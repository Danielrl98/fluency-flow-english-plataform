require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const {
  initDatabase,
  getUserByEmail,
  getUserById,
  createUser,
  getUserStats,
  recordAudioPlay,
  getActiveLessonProgress,
  saveActiveLessonProgress,
  clearActiveLessonProgress,
  saveCompletedLessonToDb,
  listUserCompletedLessons,
  getUserVocabulary,
  addUserVocabularyWord,
  removeUserVocabularyWord
} = require('./db');

const { generateLesson } = require('./gemini');
const {
  initStorage,
  saveCompletedLesson,
  getCompletedLesson
} = require('./storage');

const app = express();
const PORT = process.env.PORT || 8072;
const JWT_SECRET = process.env.JWT_SECRET || 'fluency_flow_secret_key_2026_secure';

app.use(cors());
app.use(express.json());

// Initialize SQLite DB and Storage
initDatabase();
initStorage().catch(err => console.error('Failed to init disk storage:', err));

// Helpers
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// ----------------------------------------------------
// Public Endpoints
// ----------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register new user
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'O nome deve ter pelo menos 2 caracteres.' });
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ error: 'Por favor, informe um e-mail válido.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
    }

    const newUser = createUser(name, email, password);
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(400).json({ error: err.message || 'Erro ao realizar cadastro.' });
  }
});

// Login with SQLite & bcrypt verification
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
});

// Verify token
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ valid: false });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ valid: false });
  }

  const user = getUserById(decoded.id);
  if (!user) {
    return res.status(401).json({ valid: false });
  }

  return res.json({
    valid: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

// ----------------------------------------------------
// Auth Middleware (protects all other /api routes)
// ----------------------------------------------------
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/auth')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Acesso não autorizado. Faça login primeiro.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
  }

  const user = getUserById(decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado.' });
  }

  req.user = user;
  next();
});

// ----------------------------------------------------
// Lesson Generation (Gemini AI)
// ----------------------------------------------------
app.post('/api/generate', async (req, res) => {
  try {
    const { topic, level } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const validLevels = ['A', 'B', 'C'];
    const chosenLevel = validLevels.includes(level) ? level : 'B';

    const lesson = await generateLesson(topic.trim(), chosenLevel);

    // Automatically initialize/save this as the user's active lesson in SQLite!
    saveActiveLessonProgress(req.user.id, {
      topic: topic.trim(),
      level: chosenLevel,
      activeTab: 'reading',
      lesson,
      currentIndex: 0,
      completedSentences: [],
      audioPlaysCount: 0,
      sessionAttempts: 0,
      perfectSentencesCount: 0,
      isCompleted: false
    });

    res.json(lesson);
  } catch (err) {
    console.error('Error generating lesson:', err);
    res.status(500).json({
      error: 'Failed to generate lesson with AI',
      details: err.message
    });
  }
});

// ----------------------------------------------------
// Active Lesson Progress & Realtime Audio Tracking
// ----------------------------------------------------

// Get user's current in-progress lesson state from SQLite
app.get('/api/progress', (req, res) => {
  try {
    const progress = getActiveLessonProgress(req.user.id);
    if (!progress) {
      return res.json({ hasProgress: false });
    }
    return res.json({ hasProgress: true, progress });
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Save or sync user's active lesson progress to SQLite
app.post('/api/progress', (req, res) => {
  try {
    const progressData = req.body;
    if (!progressData || !progressData.lesson) {
      return res.status(400).json({ error: 'Lesson progress data is required' });
    }

    const saved = saveActiveLessonProgress(req.user.id, progressData);
    res.json({ success: true, progress: saved });
  } catch (err) {
    console.error('Error saving progress:', err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Clear active lesson progress
app.delete('/api/progress', (req, res) => {
  try {
    clearActiveLessonProgress(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing progress:', err);
    res.status(500).json({ error: 'Failed to clear progress' });
  }
});

// Record audio playback event in SQLite (increments global and lesson counts!)
app.post('/api/progress/audio', (req, res) => {
  try {
    const { type, context } = req.body;
    const result = recordAudioPlay(req.user.id, type, context);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error recording audio play:', err);
    res.status(500).json({ error: 'Failed to record audio play' });
  }
});

// ----------------------------------------------------
// Lesson Completion & History
// ----------------------------------------------------

// Save completed lesson to SQLite and disk markdown
app.post('/api/complete', async (req, res) => {
  try {
    const { lesson, stats } = req.body;
    if (!lesson || !lesson.title) {
      return res.status(400).json({ error: 'Valid lesson data is required' });
    }

    // 1. Save Markdown file to disk
    const diskResult = await saveCompletedLesson(lesson, stats);

    // 2. Save completed lesson record to SQLite for this user
    const dbResult = saveCompletedLessonToDb(req.user.id, lesson, stats, diskResult.filename);

    res.json({
      success: true,
      ...diskResult,
      dbId: dbResult.id,
      xpEarned: dbResult.xpEarned,
      updatedStats: dbResult.updatedStats
    });
  } catch (err) {
    console.error('Error saving completed lesson:', err);
    res.status(500).json({ error: 'Failed to save completed lesson', details: err.message });
  }
});

// List completed lessons for authenticated user
app.get('/api/history', async (req, res) => {
  try {
    const history = listUserCompletedLessons(req.user.id);
    res.json(history);
  } catch (err) {
    console.error('Error listing history:', err);
    res.status(500).json({ error: 'Failed to list history', details: err.message });
  }
});

// Get single completed lesson markdown content
app.get('/api/history/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const lesson = await getCompletedLesson(filename);
    res.json(lesson);
  } catch (err) {
    console.error('Error fetching completed lesson:', err);
    res.status(404).json({ error: 'File not found or could not be read' });
  }
});

// ----------------------------------------------------
// Student Stats & Gamification
// ----------------------------------------------------
app.get('/api/stats', (req, res) => {
  try {
    const stats = getUserStats(req.user.id);
    res.json(stats);
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ----------------------------------------------------
// Vocabulary Management (per-user SQLite)
// ----------------------------------------------------
app.get('/api/vocabulary', (req, res) => {
  try {
    const vocab = getUserVocabulary(req.user.id);
    res.json(vocab);
  } catch (err) {
    console.error('Error getting vocabulary:', err);
    res.status(500).json({ error: 'Failed to get vocabulary' });
  }
});

app.post('/api/vocabulary', (req, res) => {
  try {
    const wordObj = req.body;
    const vocab = addUserVocabularyWord(req.user.id, wordObj);
    res.json(vocab);
  } catch (err) {
    console.error('Error adding vocabulary:', err);
    res.status(500).json({ error: 'Failed to add vocabulary word' });
  }
});

app.delete('/api/vocabulary/:word', (req, res) => {
  try {
    const { word } = req.params;
    const vocab = removeUserVocabularyWord(req.user.id, word);
    res.json(vocab);
  } catch (err) {
    console.error('Error removing vocabulary:', err);
    res.status(500).json({ error: 'Failed to remove vocabulary word' });
  }
});

// ----------------------------------------------------
// Static Client Serving & Fallback
// ----------------------------------------------------
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`English Platform Server running on port ${PORT} with SQLite database.`);
});

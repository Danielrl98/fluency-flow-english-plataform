require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { generateLesson } = require('./gemini');
const {
  initStorage,
  saveCompletedLesson,
  listCompletedLessons,
  getCompletedLesson,
  getStudentStats,
  getVocabulary,
  addVocabularyWord,
  removeVocabularyWord
} = require('./storage');

const app = express();
const PORT = process.env.PORT || 8072;

app.use(cors());
app.use(express.json());

// Token generation from .env credentials
function getAuthToken() {
  const secret = (process.env.AUTH_EMAIL || '') + ':' + (process.env.AUTH_PASSWORD || '');
  return crypto.createHash('sha256').update(secret).digest('hex');
}

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const expectedEmail = (process.env.AUTH_EMAIL || '').trim().toLowerCase();
  const expectedPassword = (process.env.AUTH_PASSWORD || '').trim();

  if (
    email &&
    expectedEmail &&
    email.trim().toLowerCase() === expectedEmail &&
    password &&
    password.trim() === expectedPassword
  ) {
    const token = getAuthToken();
    return res.json({ success: true, token, email: expectedEmail });
  }

  return res.status(401).json({ error: 'E-mail ou senha incorretos' });
});

app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (token && token === getAuthToken()) {
    return res.json({ valid: true, email: process.env.AUTH_EMAIL });
  }
  return res.status(401).json({ valid: false });
});

// Auth middleware protecting subsequent API endpoints
app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/auth')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token || token !== getAuthToken()) {
    return res.status(401).json({ error: 'Acesso não autorizado. Faça login primeiro.' });
  }
  next();
});

// Initialize local storage directories
initStorage().catch(err => console.error('Failed to init storage:', err));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate lesson with Gemini
app.post('/api/generate', async (req, res) => {
  try {
    const { topic, level } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const validLevels = ['A', 'B', 'C'];
    const chosenLevel = validLevels.includes(level) ? level : 'B';

    const lesson = await generateLesson(topic.trim(), chosenLevel);
    res.json(lesson);
  } catch (err) {
    console.error('Error generating lesson:', err);
    res.status(500).json({
      error: 'Failed to generate lesson with AI',
      details: err.message
    });
  }
});

// Save completed lesson to concluidos/ folder
app.post('/api/complete', async (req, res) => {
  try {
    const { lesson, stats } = req.body;
    if (!lesson || !lesson.title) {
      return res.status(400).json({ error: 'Valid lesson data is required' });
    }

    const result = await saveCompletedLesson(lesson, stats);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error saving completed lesson:', err);
    res.status(500).json({ error: 'Failed to save completed lesson', details: err.message });
  }
});

// List completed lessons
app.get('/api/history', async (req, res) => {
  try {
    const history = await listCompletedLessons();
    res.json(history);
  } catch (err) {
    console.error('Error listing history:', err);
    res.status(500).json({ error: 'Failed to list history', details: err.message });
  }
});

// Get single completed lesson content
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

// Get student stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getStudentStats();
    res.json(stats);
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get vocabulary bank
app.get('/api/vocabulary', async (req, res) => {
  try {
    const vocab = await getVocabulary();
    res.json(vocab);
  } catch (err) {
    console.error('Error getting vocabulary:', err);
    res.status(500).json({ error: 'Failed to get vocabulary' });
  }
});

// Add word to vocabulary bank
app.post('/api/vocabulary', async (req, res) => {
  try {
    const wordObj = req.body;
    const vocab = await addVocabularyWord(wordObj);
    res.json(vocab);
  } catch (err) {
    console.error('Error adding vocabulary:', err);
    res.status(500).json({ error: 'Failed to add vocabulary word' });
  }
});

// Remove word from vocabulary bank
app.delete('/api/vocabulary/:word', async (req, res) => {
  try {
    const { word } = req.params;
    const vocab = await removeVocabularyWord(word);
    res.json(vocab);
  } catch (err) {
    console.error('Error removing vocabulary:', err);
    res.status(500).json({ error: 'Failed to remove vocabulary word' });
  }
});

// Serve static assets from client/dist if available
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Fallback to index.html for SPA routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  }
  next();
});

app.listen(PORT, () => {
  console.log(`English Platform Server running on port ${PORT}`);
});


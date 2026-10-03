const fs = require('fs/promises');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const COMPLETED_DIR = path.join(ROOT_DIR, 'concluidos');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const VOCAB_FILE = path.join(DATA_DIR, 'vocabulary.json');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

// Ensure required directories exist
async function initStorage() {
  await fs.mkdir(COMPLETED_DIR, { recursive: true });
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(VOCAB_FILE);
  } catch {
    await fs.writeFile(VOCAB_FILE, JSON.stringify([], null, 2), 'utf-8');
  }

  try {
    await fs.access(STATS_FILE);
  } catch {
    const initialStats = {
      completedLessons: 0,
      totalSentencesCompleted: 0,
      streakDays: 0,
      lastStudyDate: null,
      studyDates: []
    };
    await fs.writeFile(STATS_FILE, JSON.stringify(initialStats, null, 2), 'utf-8');
  }
}

// Format slug for filename
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

// Save completed lesson to markdown file
async function saveCompletedLesson(lessonData, stats = {}) {
  await initStorage();

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const slug = slugify(lessonData.title || lessonData.topic || 'lesson');
  const level = lessonData.level || 'B';
  const filename = `${dateStr}_${timeStr}_${slug}_level-${level}.md`;
  const filePath = path.join(COMPLETED_DIR, filename);

  const sentencesList = (lessonData.sentences || [])
    .map((s, idx) => `${idx + 1}. **${s.text}**\n   *Tradução:* ${s.translation}`)
    .join('\n\n');

  const expressionsList = (lessonData.keyExpressions || [])
    .map(e => `- **${e.expression}**: ${e.meaning}\n  *Exemplo:* "${e.example}" — *${e.examplePt || ''}*`)
    .join('\n');

  const mdContent = `# ${lessonData.title || 'Aula de Inglês'} (${lessonData.titlePt || 'Estudo Diário'})

> **Nível CEFR:** Nível ${level}  
> **Tema:** ${lessonData.topic}  
> **Data de Conclusão:** ${now.toLocaleString('pt-BR')}  
> **Precisão no Ditado:** ${stats.accuracy ?? 100}%  
> **Total de Frases:** ${lessonData.sentences?.length || 0}  
> **Tentativas / Repetições de Áudio:** ${stats.totalAudioPlays ?? 0}

---

## 📖 Texto Completo em Inglês
${lessonData.fullText || ''}

## 🇧🇷 Tradução em Português
${lessonData.fullTranslation || ''}

---

## 🎧 Sentenças Praticadas no Listening
${sentencesList}

---

## 💡 Expressões-Chave e Vocabulário
${expressionsList}

---
*Gerado e concluído na Plataforma de Estudos Diários de Inglês.*
`;

  await fs.writeFile(filePath, mdContent, 'utf-8');

  // Update overall student statistics
  await updateStudentStats(lessonData.sentences?.length || 0);

  return {
    filename,
    filePath,
    savedAt: now.toISOString(),
    title: lessonData.title,
    level,
    topic: lessonData.topic
  };
}

// List all completed lessons
async function listCompletedLessons() {
  await initStorage();
  const files = await fs.readdir(COMPLETED_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md')).sort().reverse();

  const items = [];
  for (const file of mdFiles) {
    try {
      const fullPath = path.join(COMPLETED_DIR, file);
      const content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n');
      const titleLine = lines.find(l => l.startsWith('# ')) || `# ${file}`;
      const title = titleLine.replace(/^#\s*/, '').trim();

      const levelMatch = content.match(/Nível CEFR:\*\* Nível ([ABC])/);
      const level = levelMatch ? levelMatch[1] : 'B';

      const topicMatch = content.match(/Tema:\*\* (.*)/);
      const topic = topicMatch ? topicMatch[1].trim() : '';

      const dateMatch = content.match(/Data de Conclusão:\*\* (.*)/);
      const date = dateMatch ? dateMatch[1].trim() : '';

      const stat = await fs.stat(fullPath);

      items.push({
        filename: file,
        title,
        level,
        topic,
        completedAt: date || stat.mtime.toISOString(),
        size: stat.size
      });
    } catch (err) {
      console.error(`Error reading ${file}:`, err);
    }
  }

  return items;
}

// Read single completed lesson markdown
async function getCompletedLesson(filename) {
  await initStorage();
  // Prevent directory traversal
  const safeFilename = path.basename(filename);
  const fullPath = path.join(COMPLETED_DIR, safeFilename);
  const content = await fs.readFile(fullPath, 'utf-8');
  return { filename: safeFilename, content };
}

// Update student stats
async function updateStudentStats(sentencesCount = 1) {
  await initStorage();
  const raw = await fs.readFile(STATS_FILE, 'utf-8');
  const stats = JSON.parse(raw);

  const today = new Date().toISOString().split('T')[0];
  stats.completedLessons = (stats.completedLessons || 0) + 1;
  stats.totalSentencesCompleted = (stats.totalSentencesCompleted || 0) + sentencesCount;

  if (!stats.studyDates) stats.studyDates = [];
  if (!stats.studyDates.includes(today)) {
    stats.studyDates.push(today);
  }

  // Calculate streak
  stats.studyDates.sort();
  let streak = 0;
  let checkDate = new Date();
  
  while (true) {
    const checkStr = checkDate.toISOString().split('T')[0];
    if (stats.studyDates.includes(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If today hasn't happened yet, check yesterday
      if (streak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = checkDate.toISOString().split('T')[0];
        if (stats.studyDates.includes(yesterdayStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  stats.streakDays = streak;
  stats.lastStudyDate = today;

  await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
  return stats;
}

// Get student stats
async function getStudentStats() {
  await initStorage();
  const raw = await fs.readFile(STATS_FILE, 'utf-8');
  const stats = JSON.parse(raw);
  const vocabRaw = await fs.readFile(VOCAB_FILE, 'utf-8');
  const vocab = JSON.parse(vocabRaw);
  stats.totalWordsSaved = vocab.length;
  return stats;
}

// Vocabulary management
async function getVocabulary() {
  await initStorage();
  const raw = await fs.readFile(VOCAB_FILE, 'utf-8');
  return JSON.parse(raw);
}

async function addVocabularyWord(wordObj) {
  await initStorage();
  const words = await getVocabulary();
  const cleanWord = (wordObj.word || '').trim();
  if (!cleanWord) return words;

  // Check if exists
  const existingIndex = words.findIndex(w => w.word.toLowerCase() === cleanWord.toLowerCase());
  const entry = {
    id: Date.now().toString(),
    word: cleanWord,
    translation: wordObj.translation || '',
    phonetic: wordObj.phonetic || '',
    example: wordObj.example || '',
    level: wordObj.level || 'B',
    addedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    words[existingIndex] = { ...words[existingIndex], ...entry };
  } else {
    words.unshift(entry);
  }

  await fs.writeFile(VOCAB_FILE, JSON.stringify(words, null, 2), 'utf-8');
  return words;
}

async function removeVocabularyWord(word) {
  await initStorage();
  const words = await getVocabulary();
  const filtered = words.filter(w => w.word.toLowerCase() !== word.toLowerCase());
  await fs.writeFile(VOCAB_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return filtered;
}

module.exports = {
  initStorage,
  saveCompletedLesson,
  listCompletedLessons,
  getCompletedLesson,
  getStudentStats,
  getVocabulary,
  addVocabularyWord,
  removeVocabularyWord
};

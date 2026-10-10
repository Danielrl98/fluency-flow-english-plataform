const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Database path in ./sqlite/banco.db
const SQLITE_DIR = path.resolve(__dirname, '..', 'sqlite');
if (!fs.existsSync(SQLITE_DIR)) {
  fs.mkdirSync(SQLITE_DIR, { recursive: true });
}

const DB_PATH = path.join(SQLITE_DIR, 'banco.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

// Initialize Database Schema
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      user_id INTEGER PRIMARY KEY,
      completed_lessons INTEGER DEFAULT 0,
      total_sentences_completed INTEGER DEFAULT 0,
      total_audio_plays INTEGER DEFAULT 0,
      streak_days INTEGER DEFAULT 1,
      last_study_date TEXT,
      study_dates TEXT DEFAULT '[]',
      xp_points INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_active_lesson (
      user_id INTEGER PRIMARY KEY,
      topic TEXT,
      level TEXT,
      active_tab TEXT DEFAULT 'reading',
      lesson_data TEXT NOT NULL,
      current_sentence_index INTEGER DEFAULT 0,
      completed_sentences TEXT DEFAULT '[]',
      audio_plays_count INTEGER DEFAULT 0,
      session_attempts INTEGER DEFAULT 0,
      perfect_sentences_count INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS completed_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      title_pt TEXT,
      topic TEXT,
      level TEXT,
      accuracy INTEGER,
      total_sentences INTEGER,
      total_audio_plays INTEGER,
      markdown_filename TEXT,
      lesson_data TEXT,
      stats_data TEXT,
      completed_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      translation TEXT,
      phonetic TEXT,
      example TEXT,
      level TEXT,
      added_at TEXT NOT NULL,
      UNIQUE(user_id, word COLLATE NOCASE),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audio_play_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      audio_type TEXT NOT NULL,
      context_text TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_completed_user ON completed_lessons(user_id);
    CREATE INDEX IF NOT EXISTS idx_vocab_user ON user_vocabulary(user_id);
    CREATE INDEX IF NOT EXISTS idx_audio_logs_user ON audio_play_logs(user_id);
  `);

  // Seed default user from .env if table is empty or user doesn't exist
  seedInitialUser();
}

function seedInitialUser() {
  const envEmail = (process.env.AUTH_EMAIL || 'daniel@gmail.com').trim().toLowerCase();
  const envPassword = (process.env.AUTH_PASSWORD || '123456').trim();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(envEmail);
  if (!existing && envEmail && envPassword) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(envPassword, salt);
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insertUser.run('Daniel', envEmail, hash, now, now);
    const userId = Number(result.lastInsertRowid);

    // Initialize stats
    db.prepare(`
      INSERT INTO user_stats (user_id, completed_lessons, total_sentences_completed, total_audio_plays, streak_days, last_study_date, study_dates, xp_points)
      VALUES (?, 0, 0, 0, 1, ?, ?, 0)
    `).run(userId, now.split('T')[0], JSON.stringify([now.split('T')[0]]));

    console.log(`[SQLite] Seeded default user: ${envEmail} (ID: ${userId})`);
  }
}

// User Helpers
function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email.trim().toLowerCase());
}

function getUserById(id) {
  return db.prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?').get(id);
}

function createUser(name, email, password) {
  const cleanEmail = email.trim().toLowerCase();
  const existing = getUserByEmail(cleanEmail);
  if (existing) {
    throw new Error('Este e-mail já está cadastrado.');
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO users (name, email, password_hash, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = insert.run(name.trim(), cleanEmail, passwordHash, now, now);
  const userId = Number(result.lastInsertRowid);

  // Initialize stats
  db.prepare(`
    INSERT INTO user_stats (user_id, completed_lessons, total_sentences_completed, total_audio_plays, streak_days, last_study_date, study_dates, xp_points)
    VALUES (?, 0, 0, 0, 1, ?, ?, 0)
  `).run(userId, now.split('T')[0], JSON.stringify([now.split('T')[0]]));

  return { id: userId, name: name.trim(), email: cleanEmail };
}

// Stats Helpers
function getUserStats(userId) {
  let stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);
  if (!stats) {
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      INSERT INTO user_stats (user_id, completed_lessons, total_sentences_completed, total_audio_plays, streak_days, last_study_date, study_dates, xp_points)
      VALUES (?, 0, 0, 0, 1, ?, ?, 0)
    `).run(userId, today, JSON.stringify([today]));
    stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);
  }

  // Count vocabulary
  const vocabCount = db.prepare('SELECT COUNT(*) as count FROM user_vocabulary WHERE user_id = ?').get(userId);

  return {
    completedLessons: stats.completed_lessons || 0,
    totalSentencesCompleted: stats.total_sentences_completed || 0,
    totalAudioPlays: stats.total_audio_plays || 0,
    streakDays: stats.streak_days || 1,
    xpPoints: stats.xp_points || 0,
    lastStudyDate: stats.last_study_date,
    studyDates: stats.study_dates ? JSON.parse(stats.study_dates) : [],
    totalWordsSaved: vocabCount ? vocabCount.count : 0
  };
}

function recordAudioPlay(userId, audioType = 'sentence_listening', contextText = '') {
  const now = new Date().toISOString();

  // Log audio event
  db.prepare(`
    INSERT INTO audio_play_logs (user_id, audio_type, context_text, created_at)
    VALUES (?, ?, ?, ?)
  `).run(userId, audioType, (contextText || '').slice(0, 500), now);

  // Increment user global stats
  db.prepare(`
    UPDATE user_stats 
    SET total_audio_plays = total_audio_plays + 1,
        xp_points = xp_points + 5
    WHERE user_id = ?
  `).run(userId);

  // Increment active lesson audio count if active lesson exists
  db.prepare(`
    UPDATE user_active_lesson
    SET audio_plays_count = audio_plays_count + 1,
        updated_at = ?
    WHERE user_id = ?
  `).run(now, userId);

  const updatedStats = getUserStats(userId);
  const activeLesson = getActiveLessonProgress(userId);

  return {
    totalAudioPlays: updatedStats.totalAudioPlays,
    lessonAudioPlays: activeLesson ? activeLesson.audioPlaysCount : 0,
    xpPoints: updatedStats.xpPoints
  };
}

// Active Lesson Progress
function getActiveLessonProgress(userId) {
  const row = db.prepare('SELECT * FROM user_active_lesson WHERE user_id = ?').get(userId);
  if (!row) return null;

  try {
    return {
      topic: row.topic,
      level: row.level,
      activeTab: row.active_tab,
      lesson: JSON.parse(row.lesson_data),
      currentIndex: row.current_sentence_index,
      completedSentences: JSON.parse(row.completed_sentences || '[]'),
      audioPlaysCount: row.audio_plays_count,
      sessionAttempts: row.session_attempts,
      perfectSentencesCount: row.perfect_sentences_count,
      isCompleted: Boolean(row.is_completed),
      updatedAt: row.updated_at
    };
  } catch (err) {
    console.error('Error parsing active lesson data:', err);
    return null;
  }
}

function saveActiveLessonProgress(userId, progressData) {
  const now = new Date().toISOString();
  const {
    topic = '',
    level = 'B',
    activeTab = 'reading',
    lesson = {},
    currentIndex = 0,
    completedSentences = [],
    audioPlaysCount = 0,
    sessionAttempts = 0,
    perfectSentencesCount = 0,
    isCompleted = false
  } = progressData;

  const lessonDataStr = JSON.stringify(lesson);
  const completedSentencesStr = JSON.stringify(completedSentences);

  const existing = db.prepare('SELECT user_id FROM user_active_lesson WHERE user_id = ?').get(userId);
  if (existing) {
    db.prepare(`
      UPDATE user_active_lesson
      SET topic = ?,
          level = ?,
          active_tab = ?,
          lesson_data = ?,
          current_sentence_index = ?,
          completed_sentences = ?,
          audio_plays_count = ?,
          session_attempts = ?,
          perfect_sentences_count = ?,
          is_completed = ?,
          updated_at = ?
      WHERE user_id = ?
    `).run(
      topic,
      level,
      activeTab,
      lessonDataStr,
      currentIndex,
      completedSentencesStr,
      audioPlaysCount,
      sessionAttempts,
      perfectSentencesCount,
      isCompleted ? 1 : 0,
      now,
      userId
    );
  } else {
    db.prepare(`
      INSERT INTO user_active_lesson (
        user_id, topic, level, active_tab, lesson_data,
        current_sentence_index, completed_sentences, audio_plays_count,
        session_attempts, perfect_sentences_count, is_completed, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      topic,
      level,
      activeTab,
      lessonDataStr,
      currentIndex,
      completedSentencesStr,
      audioPlaysCount,
      sessionAttempts,
      perfectSentencesCount,
      isCompleted ? 1 : 0,
      now
    );
  }

  return getActiveLessonProgress(userId);
}

function clearActiveLessonProgress(userId) {
  db.prepare('DELETE FROM user_active_lesson WHERE user_id = ?').run(userId);
}

// Completed Lesson History
function saveCompletedLessonToDb(userId, lessonData, statsData = {}, markdownFilename = '') {
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  const sentencesCount = lessonData.sentences?.length || 0;

  // Insert into completed_lessons
  const insert = db.prepare(`
    INSERT INTO completed_lessons (
      user_id, title, title_pt, topic, level, accuracy,
      total_sentences, total_audio_plays, markdown_filename,
      lesson_data, stats_data, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    userId,
    lessonData.title || 'Lesson',
    lessonData.titlePt || '',
    lessonData.topic || '',
    lessonData.level || 'B',
    statsData.accuracy ?? 100,
    sentencesCount,
    statsData.totalAudioPlays ?? 0,
    markdownFilename,
    JSON.stringify(lessonData),
    JSON.stringify(statsData),
    now
  );

  // Update user statistics (streak, completed lessons, xp)
  const currentStats = getUserStats(userId);
  const studyDates = currentStats.studyDates || [];
  if (!studyDates.includes(today)) {
    studyDates.push(today);
  }
  studyDates.sort();

  // Calculate streak days
  let streak = 0;
  let checkDate = new Date();
  while (true) {
    const checkStr = checkDate.toISOString().split('T')[0];
    if (studyDates.includes(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (streak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yestStr = checkDate.toISOString().split('T')[0];
        if (studyDates.includes(yestStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  const xpEarned = 50 + (sentencesCount * 10);

  db.prepare(`
    UPDATE user_stats
    SET completed_lessons = completed_lessons + 1,
        total_sentences_completed = total_sentences_completed + ?,
        streak_days = ?,
        last_study_date = ?,
        study_dates = ?,
        xp_points = xp_points + ?
    WHERE user_id = ?
  `).run(sentencesCount, Math.max(1, streak), today, JSON.stringify(studyDates), xpEarned, userId);

  // Mark active lesson as completed
  db.prepare(`
    UPDATE user_active_lesson
    SET is_completed = 1,
        updated_at = ?
    WHERE user_id = ?
  `).run(now, userId);

  return {
    completedAt: now,
    xpEarned,
    updatedStats: getUserStats(userId)
  };
}

function listUserCompletedLessons(userId) {
  const rows = db.prepare(`
    SELECT id, title, title_pt, topic, level, accuracy, total_sentences,
           total_audio_plays, markdown_filename, completed_at
    FROM completed_lessons
    WHERE user_id = ?
    ORDER BY completed_at DESC
  `).all(userId);

  return rows.map(r => ({
    id: r.id,
    filename: r.markdown_filename,
    title: r.title,
    titlePt: r.title_pt,
    topic: r.topic,
    level: r.level,
    accuracy: r.accuracy,
    totalSentences: r.total_sentences,
    totalAudioPlays: r.total_audio_plays,
    completedAt: r.completed_at
  }));
}

// Vocabulary Management
function getUserVocabulary(userId) {
  const rows = db.prepare(`
    SELECT id, word, translation, phonetic, example, level, added_at
    FROM user_vocabulary
    WHERE user_id = ?
    ORDER BY id DESC
  `).all(userId);

  return rows.map(r => ({
    id: r.id.toString(),
    word: r.word,
    translation: r.translation || '',
    phonetic: r.phonetic || '',
    example: r.example || '',
    level: r.level || 'B',
    addedAt: r.added_at
  }));
}

function addUserVocabularyWord(userId, wordObj) {
  const cleanWord = (wordObj.word || '').trim();
  if (!cleanWord) return getUserVocabulary(userId);

  const now = new Date().toISOString();

  // Upsert
  const existing = db.prepare('SELECT id FROM user_vocabulary WHERE user_id = ? AND word = ? COLLATE NOCASE').get(userId, cleanWord);
  if (existing) {
    db.prepare(`
      UPDATE user_vocabulary
      SET translation = ?, phonetic = ?, example = ?, level = ?
      WHERE id = ?
    `).run(wordObj.translation || '', wordObj.phonetic || '', wordObj.example || '', wordObj.level || 'B', existing.id);
  } else {
    db.prepare(`
      INSERT INTO user_vocabulary (user_id, word, translation, phonetic, example, level, added_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, cleanWord, wordObj.translation || '', wordObj.phonetic || '', wordObj.example || '', wordObj.level || 'B', now);

    // Give 10 XP for saving a new word
    db.prepare('UPDATE user_stats SET xp_points = xp_points + 10 WHERE user_id = ?').run(userId);
  }

  return getUserVocabulary(userId);
}

function removeUserVocabularyWord(userId, word) {
  db.prepare('DELETE FROM user_vocabulary WHERE user_id = ? AND word = ? COLLATE NOCASE').run(userId, (word || '').trim());
  return getUserVocabulary(userId);
}

module.exports = {
  db,
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
};

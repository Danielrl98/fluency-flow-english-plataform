// SQLite Database Initialization & Migration Script
const { initDatabase, db, getUserStats } = require('../server/db');

console.log('🔄 Initializing SQLite database schema...');
initDatabase();
console.log('✅ SQLite database schema verified and initialized at sqlite/banco.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('📋 Existing database tables:', tables.map(t => t.name).join(', '));

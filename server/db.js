const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.KANICAR_DB_PATH || path.join(__dirname, 'kanicar.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    company TEXT DEFAULT '',
    eik TEXT DEFAULT '',
    vat TEXT DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const ADMIN_EMAIL = 'admin@kanikar.bg';
const ADMIN_SEED_PASSWORD = process.env.KANICAR_ADMIN_PASSWORD || 'admin123';

function seedAdmin() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL);
  if (existing) return;
  const hash = bcrypt.hashSync(ADMIN_SEED_PASSWORD, 10);
  db.prepare(`
    INSERT INTO users (email, name, surname, phone, address, company, eik, vat, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', ?)
  `).run(ADMIN_EMAIL, 'Администратор', 'КаниКар', 'Калин: 0885 074595', 'www.kanicar.com', 'КаниКар ЕООД', '123456789', 'BG123456789', hash, new Date().toISOString());
}

seedAdmin();

module.exports = { db, ADMIN_EMAIL };

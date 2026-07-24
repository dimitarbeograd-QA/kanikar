const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { db } = require('./db');
const {
  createSession, destroySession, setSessionCookie, clearSessionCookie,
  requireAuth, SESSION_COOKIE,
} = require('./auth');

const app = express();
app.use(express.json());
app.use(cookieParser());

// These only take effect as real HTTP headers — browsers silently ignore
// them when set via a <meta http-equiv> tag, which is where they used to be.
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// 10 rounds is bcrypt's own default and still well above OWASP's minimum —
// using bcrypt's async hash/compare (not the sync variants) so a slow hash
// doesn't block the event loop for other requests while it runs.
const BCRYPT_ROUNDS = 10;

// ── very small in-memory rate limiter for auth endpoints ──
const attempts = new Map(); // key -> [timestamps]
function rateLimited(key, max, windowMs) {
  const now = Date.now();
  const arr = (attempts.get(key) || []).filter(t => now - t < windowMs);
  arr.push(now);
  attempts.set(key, arr);
  return arr.length > max;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(row) {
  return {
    email: row.email,
    name: row.name,
    surname: row.surname,
    phone: row.phone,
    address: row.address,
    company: row.company,
    eik: row.eik,
    vat: row.vat,
    role: row.role,
    createdAt: row.created_at,
  };
}

app.post('/api/register', async (req, res) => {
  const ip = req.ip;
  if (rateLimited('register:' + ip, 20, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'too_many_attempts' });
  }
  const { email, name, surname, phone, password } = req.body || {};
  if (!email || !EMAIL_RE.test(String(email))) return res.status(400).json({ error: 'invalid_email' });
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'invalid_name' });
  if (!surname || !String(surname).trim()) return res.status(400).json({ error: 'invalid_surname' });
  if (!password || String(password).length < 6) return res.status(400).json({ error: 'weak_password' });

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) return res.status(409).json({ error: 'email_taken' });

  const hash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
  const now = new Date().toISOString();
  const info = db.prepare(`
    INSERT INTO users (email, name, surname, phone, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, 'customer', ?)
  `).run(normalizedEmail, String(name).trim(), String(surname).trim(), phone ? String(phone).trim() : '', hash, now);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const { token, expires } = createSession(user.id);
  setSessionCookie(res, token, expires);
  res.status(201).json({ user: publicUser(user) });
});

app.post('/api/login', async (req, res) => {
  const ip = req.ip;
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (rateLimited('login:' + ip + ':' + normalizedEmail, 10, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'too_many_attempts' });
  }
  if (!normalizedEmail || !password) return res.status(400).json({ error: 'invalid_credentials' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const { token, expires } = createSession(user.id);
  setSessionCookie(res, token, expires);
  res.json({ user: publicUser(user) });
});

app.post('/api/logout', (req, res) => {
  destroySession(req.cookies[SESSION_COOKIE]);
  clearSessionCookie(res);
  res.status(204).end();
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.put('/api/profile', requireAuth, (req, res) => {
  const { name, surname, phone, address, company, eik, vat } = req.body || {};
  const clip = (v, max = 200) => (v == null ? '' : String(v).trim().slice(0, max));
  db.prepare(`
    UPDATE users SET name = ?, surname = ?, phone = ?, address = ?, company = ?, eik = ?, vat = ?
    WHERE id = ?
  `).run(
    clip(name) || req.user.name,
    clip(surname) || req.user.surname,
    clip(phone),
    clip(address),
    clip(company),
    clip(eik, 20),
    clip(vat, 20),
    req.user.id
  );
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(updated) });
});

// Registered users directory for the admin "Clients" tab — admin only, no password hashes.
app.get('/api/admin/clients', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const rows = db.prepare(`SELECT * FROM users WHERE role != 'admin' ORDER BY created_at DESC`).all();
  res.json({ clients: rows.map(publicUser) });
});

// Static site (index.html + any assets)
app.use(express.static(path.join(__dirname, '..'), { index: 'index.html' }));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`KaniCar server listening on http://localhost:${PORT}`));
}

module.exports = app;

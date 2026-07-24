const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Isolated DB per test run so tests never touch the real kanicar.db
const dbPath = path.join(os.tmpdir(), `kanicar-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
process.env.KANICAR_DB_PATH = dbPath;
process.env.KANICAR_ADMIN_PASSWORD = 'admin123';

const request = require('supertest');
const app = require('../server');

test.after(() => {
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.unlinkSync(dbPath + suffix); } catch {}
  }
});

function agent() {
  return request.agent(app);
}

test('register creates a customer account and logs them in via cookie', async () => {
  const a = agent();
  const res = await a.post('/api/register').send({
    email: 'buyer1@example.com', name: 'Иван', surname: 'Иванов', phone: '0888', password: 'secret6',
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, 'buyer1@example.com');
  assert.equal(res.body.user.role, 'customer');
  assert.equal(res.body.user.password_hash, undefined);

  const me = await a.get('/api/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, 'buyer1@example.com');
});

test('register rejects duplicate email, short password, bad email', async () => {
  const a = agent();
  await a.post('/api/register').send({ email: 'dup@example.com', name: 'A', surname: 'B', password: 'secret6' });
  const dup = await a.post('/api/register').send({ email: 'dup@example.com', name: 'A', surname: 'B', password: 'secret6' });
  assert.equal(dup.status, 409);

  const shortPw = await a.post('/api/register').send({ email: 'x@example.com', name: 'A', surname: 'B', password: '123' });
  assert.equal(shortPw.status, 400);

  const badEmail = await a.post('/api/register').send({ email: 'not-an-email', name: 'A', surname: 'B', password: 'secret6' });
  assert.equal(badEmail.status, 400);
});

test('login fails with wrong password, succeeds with right one', async () => {
  const reg = agent();
  await reg.post('/api/register').send({ email: 'login1@example.com', name: 'A', surname: 'B', password: 'correct1' });

  const bad = await agent().post('/api/login').send({ email: 'login1@example.com', password: 'wrongpw' });
  assert.equal(bad.status, 401);

  const good = await agent().post('/api/login').send({ email: 'login1@example.com', password: 'correct1' });
  assert.equal(good.status, 200);
  assert.equal(good.body.user.email, 'login1@example.com');
});

test('/api/me requires a valid session', async () => {
  const res = await request(app).get('/api/me');
  assert.equal(res.status, 401);
});

test('logout invalidates the session', async () => {
  const a = agent();
  await a.post('/api/register').send({ email: 'logout1@example.com', name: 'A', surname: 'B', password: 'secret6' });
  const before = await a.get('/api/me');
  assert.equal(before.status, 200);

  await a.post('/api/logout');
  const after = await a.get('/api/me');
  assert.equal(after.status, 401);
});

test('the seeded admin account logs in with the real admin role', async () => {
  const a = agent();
  const login = await a.post('/api/login').send({ email: 'admin@kanikar.bg', password: 'admin123' });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.role, 'admin');
});

test('a freshly registered customer can never obtain role=admin from the API', async () => {
  const a = agent();
  const res = await a.post('/api/register').send({
    email: 'sneaky@example.com', name: 'A', surname: 'B', password: 'secret6', role: 'admin',
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, 'customer');

  const me = await a.get('/api/me');
  assert.equal(me.body.user.role, 'customer');
});

test('/api/admin/clients is forbidden for a regular customer and forged cookies do not work', async () => {
  const a = agent();
  await a.post('/api/register').send({ email: 'notadmin@example.com', name: 'A', surname: 'B', password: 'secret6' });
  const res = await a.get('/api/admin/clients');
  assert.equal(res.status, 403);

  const forged = await request(app).get('/api/admin/clients').set('Cookie', 'kk_sid=totally-made-up-token');
  assert.equal(forged.status, 401);
});

test('/api/admin/clients works for the real admin', async () => {
  const a = agent();
  await a.post('/api/login').send({ email: 'admin@kanikar.bg', password: 'admin123' });
  const res = await a.get('/api/admin/clients');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.clients));
});

test('profile update persists and never lets a client set role', async () => {
  const a = agent();
  await a.post('/api/register').send({ email: 'profile1@example.com', name: 'A', surname: 'B', password: 'secret6' });
  const res = await a.put('/api/profile').send({ phone: '+359888', address: 'ул. Тест 1', role: 'admin' });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.phone, '+359888');
  assert.equal(res.body.user.role, 'customer');
});

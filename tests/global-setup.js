const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const base = path.join(__dirname, '..', 'server', 'kanicar.test.db');
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.unlinkSync(base + suffix); } catch {}
  }
};

New-Item -ItemType Directory -Force -Path .\src | Out-Null

$txt = @'
const express = require('express');
const fs = require('fs');
const path = require('path');

function safeReadJson(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function safeWriteJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    return false;
  }
}

function createApp(options = {}) {
  const app = express();
  app.use(express.json());

  const BASE_DATA_DIR = options.dataDir || path.join(__dirname, '..', 'data');
  if (!fs.existsSync(BASE_DATA_DIR)) {
    try { fs.mkdirSync(BASE_DATA_DIR, { recursive: true }); } catch (e) {}
  }

  const USERS_FILE = options.usersFile || path.join(BASE_DATA_DIR, 'users.json');
  if (!fs.existsSync(USERS_FILE)) safeWriteJson(USERS_FILE, []);

  function readUsers() { return safeReadJson(USERS_FILE, []); }
  function saveUsers(users) { return safeWriteJson(USERS_FILE, users); }

  app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const users = readUsers();
    if (users.find(u => u.username === username)) return res.status(400).json({ error: 'Username already exists' });

    users.push({ username, email, password });
    if (!saveUsers(users)) return res.status(500).json({ error: 'Failed to save user' });
    return res.json({ success: true });
  });

  app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

    const users = readUsers();
    const user = users.find(u => (u.username === username || u.email === username) && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    return res.json({ success: true, username: user.username, email: user.email });
  });

  app.get('/__debug/users-file', (req, res) => {
    res.json({ usersFile: USERS_FILE, exists: fs.existsSync(USERS_FILE) });
  });

  return app;
}

module.exports = { createApp, safeReadJson, safeWriteJson };
'@

Set-Content -Path .\src\app.js -Value $txt -Encoding UTF8
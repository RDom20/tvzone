// ✅ server.js (merged + non-destructive enhancements)
// This file merges the provided server implementation with a few small, additive improvements
// (logging, safer JSON read/write helpers, and a couple of optional debug endpoints).
// Nothing from the original file was removed — only additive, backward-compatible code was appended.

const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const os = require("os");
const app = express();

app.use(cors());
app.use(express.json());

// -----------------------------
// Helper utilities (additive)
// -----------------------------
function safeReadJson(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`safeReadJson error reading ${filePath}:`, err);
    return fallback;
  }
}

function safeWriteJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error(`safeWriteJson error writing ${filePath}:`, err);
    return false;
  }
}

// -----------------------------
// --- 🔍 OneDrive mappa automatikus felismerése ---
// -----------------------------
function findOneDrivePath() {
  const userHome = os.homedir();
  try {
    const dirs = fs.readdirSync(userHome);
    const oneDriveFolder = dirs.find(d =>
      d.toLowerCase().includes("onedrive") &&
      d.toLowerCase().includes("nyíregyházi egyetem")
    );
    if (oneDriveFolder) {
      const fullPath = path.join(userHome, oneDriveFolder, "TVZone", "data");
      if (fs.existsSync(fullPath)) {
        console.log(`📁 OneDrive mappa megtalálva: ${fullPath}`);
        return fullPath;
      }
    }
  } catch (err) {
    console.warn("⚠️ Nem sikerült automatikusan megtalálni a OneDrive mappát:", err);
  }

  // Fallback fix útvonal
  return "C:/Users/rdomi/OneDrive - Nyíregyházi Egyetem (Student)/TVZone/data";
}

// -----------------------------
// --- Adatmappa (automatikus vagy fix) ---
// -----------------------------
const possiblePaths = [
  "C:/Users/rdomi/OneDrive - Nyíregyházi Egyetem (Student)/TVZone/data",
  "C:/Users/user/OneDrive - Nyíregyházi Egyetem (Student)/TVZone/data"
];

const DATA_DIR = possiblePaths.find(p => fs.existsSync(p)) || findOneDrivePath();
if (!DATA_DIR) {
  console.error("❌ Nincs elérhető adatkönyvtár!");
  process.exit(1);
}

console.log("✅ Adatmappa használatban:", DATA_DIR);

// =======================
//  WATCHLIST KEZELÉS 🧩
// =======================
const watchlistFile = path.join(DATA_DIR, "watchlist.json");

// ha nem létezik, hozzuk létre
if (!fs.existsSync(watchlistFile)) {
  safeWriteJson(watchlistFile, []);
}

// --- Watchlist lekérés ---
app.get("/api/watchlist", (req, res) => {
  try {
    const data = safeReadJson(watchlistFile, []);
    res.json(data);
  } catch (err) {
    console.error("❌ Hiba a watchlist olvasásakor:", err);
    res.status(500).json({ error: "Hiba a watchlist beolvasásakor." });
  }
});

// --- Watchlist mentés ---
app.post("/api/watchlist", (req, res) => {
  const { title, img, link } = req.body;
  if (!title) return res.json({ success: false, error: "Nincs cím" });

  let data = safeReadJson(watchlistFile, []);

  if (data.some(x => x.title === title)) {
    return res.json({ success: true, message: "Már hozzáadva" });
  }

  data.push({ title, img, link });
  const ok = safeWriteJson(watchlistFile, data);
  if (!ok) return res.status(500).json({ success: false, error: "Nem sikerült menteni" });
  res.json({ success: true });
});

// =======================
//  MÉDIA KEZELÉS 🎬
// =======================
function getSeriesStructure(seriesPath, baseCategory) {
  const result = {};
  const entries = fs.readdirSync(seriesPath, { withFileTypes: true });
  const seasonDirs = entries.filter(e => e.isDirectory() && /^season/i.test(e.name));

  if (seasonDirs.length === 0) {
    const videoFiles = entries
      .filter(e => e.isFile() && /\.(mp4|mkv|avi)$/i.test(e.name))
      .map(e => {
        const relUnixPath = path
          .relative(DATA_DIR, path.join(baseCategory, e.name))
          .replace(/\\/g, "/");
        return {
          name: e.name,
          path: `/video/${encodeURIComponent(relUnixPath)}`
        };
      });

    result.type = "movie";
    result.files = videoFiles;
    return result;
  }

  result.type = "series";
  result.seasons = {};

  seasonDirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  for (const dir of seasonDirs) {
    const seasonPath = path.join(seriesPath, dir.name);
    const epFiles = fs.readdirSync(seasonPath, { withFileTypes: true })
      .filter(f => f.isFile() && /\.(mp4|mkv|avi)$/i.test(f.name))
      .map(f => {
        const relUnixPath = path
          .relative(DATA_DIR, path.join(baseCategory, dir.name, f.name))
          .replace(/\\/g, "/");
        return {
          name: f.name,
          path: `/video/${encodeURIComponent(relUnixPath)}`
        };
      });

    const seasonNumberMatch = dir.name.match(/\d+/);
    const seasonKey = seasonNumberMatch ? `Season ${seasonNumberMatch[0]}` : dir.name;
    result.seasons[seasonKey] = epFiles;
  }

  return result;
}

function findMediaPath(title) {
  const categories = ["Movies", "Series", "Animes"];
  for (const cat of categories) {
    const tryPath = path.join(DATA_DIR, cat, title);
    if (fs.existsSync(tryPath)) return { abs: tryPath, category: cat };

    const tryFile = path.join(DATA_DIR, cat, `${title}.mp4`);
    if (fs.existsSync(tryFile)) return { abs: tryFile, category: cat };
  }
  return null;
}

// --- API ---
app.get("/api/series", (req, res) => {
  const title = req.query.title;
  if (!title) return res.status(400).json({ error: "Missing title parameter" });

  const found = findMediaPath(title);
  if (!found) return res.status(404).json({ error: "Not found" });

  const { abs, category } = found;
  const stat = fs.statSync(abs);

  if (stat.isFile()) {
    const relPath = path.relative(DATA_DIR, abs);
    return res.json({
      type: "movie",
      files: [{ name: path.basename(abs), path: `/video/${encodeURIComponent(relPath)}` }],
      category,
    });
  }

  if (stat.isDirectory()) {
    try {
      const data = getSeriesStructure(abs, path.join(category, title));
      data.category = category;
      return res.json(data);
    } catch (err) {
      console.error("Error reading directory:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  return res.status(400).json({ error: "Invalid media type" });
});

// --- VIDEÓ STREAM ---
app.get("/video/*", (req, res) => {
  let relPath = decodeURIComponent(req.params[0]);
  if (relPath.startsWith("/")) relPath = relPath.slice(1);
  const absPath = path.join(DATA_DIR, relPath);

  if (!fs.existsSync(absPath)) return res.status(404).send("File not found");

  const stat = fs.statSync(absPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const ext = path.extname(absPath).toLowerCase();
  const mime = ext === ".mkv" ? "video/x-matroska" : "video/mp4";

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(absPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": mime,
    };
    res.writeHead(206, head);
    stream.pipe(res);
  } else {
    const head = { "Content-Length": fileSize, "Content-Type": mime };
    res.writeHead(200, head);
    fs.createReadStream(absPath).pipe(res);
  }
});

// =======================
//  AUTH RENDSZER 🔐
// =======================
const USERS_FILE = path.join(DATA_DIR, "users.json");

// ha nem létezik, hozzuk létre
if (!fs.existsSync(USERS_FILE)) {
  safeWriteJson(USERS_FILE, []);
}

function readUsers() {
  return safeReadJson(USERS_FILE, []);
}

function saveUsers(users) {
  return safeWriteJson(USERS_FILE, users);
}

// --- Regisztráció ---
app.post("/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: "Missing fields" });

  let users = readUsers();

  if (users.find(u => u.username === username))
    return res.status(400).json({ error: "Username already exists" });

  users.push({ username, email, password });
  const ok = saveUsers(users);
  if (!ok) return res.status(500).json({ error: "Failed to save user" });
  return res.json({ success: true });
});

// --- Bejelentkezés ---
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing credentials" });

  let users = readUsers();

  const user = users.find(u =>
    (u.username === username || u.email === username) && u.password === password
  );

  if (!user)
    return res.status(401).json({ error: "Invalid username or password" });

  // visszaadjuk a felhasználónevet (a kliens localStorage-ba menti)
  res.json({ success: true, username: user.username, email: user.email });
});

// -----------------------------
// Static serving and data mounts
// -----------------------------
app.use(express.static(__dirname));
app.use("/data", express.static(DATA_DIR));

// -----------------------------
// COVERS API (additive, kept original behavior)
// -----------------------------
const coversDir = path.join(DATA_DIR, 'Covers');
if (fs.existsSync(coversDir)) {
  app.use('/covers', express.static(coversDir));
  console.log('✅ Covers útvonal engedélyezve: /covers ->', coversDir);
} else {
  console.warn('⚠️ Covers mappa nem található:', coversDir);
}

app.get('/api/covers', (req, res) => {
  try {
    if (!fs.existsSync(coversDir)) return res.json([]);
    const files = fs.readdirSync(coversDir)
      .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
      .map(f => ({ file: f, url: `/covers/${encodeURIComponent(f)}` }));
    res.json(files);
  } catch (err) {
    console.error('❌ Hiba a covers listázásakor:', err);
    res.status(500).json({ error: 'Hiba a covers listázásakor' });
  }
});

app.get('/api/cover', (req, res) => {
  const title = req.query.title;
  if (!title) return res.status(400).json({ error: 'Missing title parameter' });

  try {
    if (!fs.existsSync(coversDir)) return res.status(404).json({ error: 'Covers folder not found' });

    const candidates = fs.readdirSync(coversDir).filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f));
    const exact = candidates.find(f => {
      const base = path.parse(f).name;
      return base === title || base === decodeURIComponent(title);
    });
    if (exact) return res.json({ file: exact, url: `/covers/${encodeURIComponent(exact)}` });

    const encodedName = `${encodeURIComponent(title)}.jpg`;
    const encodedMatch = candidates.find(f => f === encodedName);
    if (encodedMatch) return res.json({ file: encodedMatch, url: `/covers/${encodeURIComponent(encodedMatch)}` });

    const norm = s => s.toLowerCase().replace(/[\s_\-]+/g, '');
    const targetNorm = norm(title);
    const loose = candidates.find(f => norm(path.parse(f).name) === targetNorm);
    if (loose) return res.json({ file: loose, url: `/covers/${encodeURIComponent(loose)}` });

    return res.status(404).json({ error: 'Cover not found' });
  } catch (err) {
    console.error('❌ Hiba a cover keresésénél:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// -----------------------------
// SUBTITLES API (kept original behavior)
// -----------------------------
const subsDir = path.join(DATA_DIR, 'Subtitles');
if (fs.existsSync(subsDir)) {
  app.use('/subtitles', express.static(subsDir));
  console.log('✅ Subtitles útvonal engedélyezve: /subtitles ->', subsDir);
} else {
  console.warn('⚠️ Subtitles mappa nem található:', subsDir);
}

app.get('/api/subtitles', (req, res) => {
  try {
    if (!fs.existsSync(subsDir)) return res.json([]);
    const files = fs.readdirSync(subsDir)
      .filter(f => /\.(vtt|srt|txt)$/i.test(f))
      .map(f => ({ file: f, url: `/subtitles/${encodeURIComponent(f)}` }));
    res.json(files);
  } catch (err) {
    console.error('❌ Hiba a subtitles listázásakor:', err);
    res.status(500).json({ error: 'Hiba a subtitles listázásakor' });
  }
});

app.get('/api/subtitle', (req, res) => {
  const title = req.query.title;
  const lang = (req.query.lang || '').toString().toLowerCase();
  if (!title) return res.status(400).json({ error: 'Missing title parameter' });

  const langSuffixMap = {
    'eng': 'Eng',
    'english': 'Eng',
    'en': 'Eng',
    'hun': 'Hun',
    'hungarian': 'Hun',
    'hu': 'Hun'
  };

  const suffix = langSuffixMap[lang] || null;

  try {
    if (!fs.existsSync(subsDir)) return res.status(404).json({ error: 'Subtitles folder not found' });

    const candidates = fs.readdirSync(subsDir).filter(f => /\.(vtt|srt|txt)$/i.test(f));
    const baseName = (name) => path.parse(name).name;

    if (suffix) {
      const targetWithSuffix = `${title} ${suffix}`;
      const exactWithSuffix = candidates.find(f => baseName(f) === targetWithSuffix || baseName(f) === decodeURIComponent(targetWithSuffix));
      if (exactWithSuffix) return res.json({ file: exactWithSuffix, url: `/subtitles/${encodeURIComponent(exactWithSuffix)}` });
    }

    const exact = candidates.find(f => baseName(f) === title || baseName(f) === decodeURIComponent(title));
    if (exact) return res.json({ file: exact, url: `/subtitles/${encodeURIComponent(exact)}` });

    const encodedName = `${encodeURIComponent(title)}.vtt`;
    const encodedMatch = candidates.find(f => f === encodedName);
    if (encodedMatch) return res.json({ file: encodedMatch, url: `/subtitles/${encodeURIComponent(encodedMatch)}` });

    const norm = s => s.toLowerCase().replace(/[\s_\-]+/g, '');
    const targetNorm = norm(title);
    const loose = candidates.find(f => norm(baseName(f)) === targetNorm);
    if (loose) return res.json({ file: loose, url: `/subtitles/${encodeURIComponent(loose)}` });

    if (suffix) {
      const looseNoSuffix = candidates.find(f => norm(baseName(f)).includes(targetNorm) || targetNorm.includes(norm(baseName(f))));
      if (looseNoSuffix) return res.json({ file: looseNoSuffix, url: `/subtitles/${encodeURIComponent(looseNoSuffix)}` });
    }

    return res.status(404).json({ error: 'Subtitle not found' });
  } catch (err) {
    console.error('❌ Hiba a subtitle keresésénél:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// -----------------------------
// Small debug endpoints (additive, optional)
// -----------------------------
app.get("/__debug/watchlist-file", (req, res) => {
  res.json({ watchlistFile, exists: fs.existsSync(watchlistFile) });
});

app.get("/__debug/users-file", (req, res) => {
  res.json({ usersFile: USERS_FILE, exists: fs.existsSync(USERS_FILE) });
});

// -----------------------------
// Start server
// -----------------------------
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

// ✅ server.js (ESM Fixed & Optimized)
import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import os from "os";
import { fileURLToPath } from "url";

// --- ESM Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json()); // FONTOS: Ez kell a POST kérések (login/register) olvasásához!
app.use(express.urlencoded({ extended: true }));

// -----------------------------
// Helper utilities
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
// OneDrive mappa felismerés
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
  return "C:/Users/rdomi/OneDrive - Nyíregyházi Egyetem (Student)/TVZone/data";
}

const possiblePaths = [
  "E:/TVZone/data",
  "E:/UI"
];

const DATA_DIR = possiblePaths.find(p => fs.existsSync(p)) || findOneDrivePath();
if (!DATA_DIR) {
  console.error("❌ Nincs elérhető adatkönyvtár!");
  process.exit(1);
}
console.log("✅ Adatmappa használatban:", DATA_DIR);

// =======================
// WATCHLIST API
// =======================
const watchlistFile = path.join(DATA_DIR, "watchlist.json");
if (!fs.existsSync(watchlistFile)) safeWriteJson(watchlistFile, []);

app.get("/api/watchlist", (req, res) => res.json(safeReadJson(watchlistFile, [])));

app.post("/api/watchlist", (req, res) => {
  const { title, img, link } = req.body;
  if (!title) return res.json({ success: false, error: "Nincs cím" });
  let data = safeReadJson(watchlistFile, []);
  if (data.some(x => x.title === title)) return res.json({ success: true, message: "Már hozzáadva" });
  data.push({ title, img, link });
  if (!safeWriteJson(watchlistFile, data)) return res.status(500).json({ success: false, error: "Nem sikerült menteni" });
  res.json({ success: true });
});

// =======================
// MEDIA API + VIDEO STREAM
// =======================
function getSeriesStructure(seriesPath, baseCategory) {
  const result = {};
  const entries = fs.readdirSync(seriesPath, { withFileTypes: true });
  const seasonDirs = entries.filter(e => e.isDirectory() && /^season/i.test(e.name));

  if (seasonDirs.length === 0) {
    const videoFiles = entries
      .filter(e => e.isFile() && /\.(mp4|mkv|avi)$/i.test(e.name))
      .map(e => {
        const relUnixPath = path.relative(DATA_DIR, path.join(baseCategory, e.name)).replace(/\\/g, "/");
        return { name: e.name, path: `/video/${encodeURIComponent(relUnixPath)}` };
      });
    return { type: "movie", files: videoFiles };
  }

  result.type = "series";
  result.seasons = {};
  seasonDirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  for (const dir of seasonDirs) {
    const seasonPath = path.join(seriesPath, dir.name);
    const epFiles = fs.readdirSync(seasonPath, { withFileTypes: true })
      .filter(f => f.isFile() && /\.(mp4|mkv|avi)$/i.test(f.name))
      .map(f => {
        const relUnixPath = path.relative(DATA_DIR, path.join(baseCategory, dir.name, f.name)).replace(/\\/g, "/");
        return { name: f.name, path: `/video/${encodeURIComponent(relUnixPath)}` };
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

app.get("/api/Series", (req, res) => {
  const title = req.query.title;
  if (!title) return res.status(400).json({ error: "Missing title parameter" });
  const found = findMediaPath(title);
  if (!found) return res.status(404).json({ error: "Not found" });
  const { abs, category } = found;
  const stat = fs.statSync(abs);
  if (stat.isFile()) {
    const relPath = path.relative(DATA_DIR, abs);
    return res.json({ type: "movie", files: [{ name: path.basename(abs), path: `/video/${encodeURIComponent(relPath)}` }], category });
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

// JAVÍTOTT VIDEO HANDLER (MIME típus kezeléssel VTT-hez is)
app.get("/video/*", (req, res) => {
  let relPath = decodeURIComponent(req.params[0]);
  if (relPath.startsWith("/")) relPath = relPath.slice(1);
  const absPath = path.join(DATA_DIR, relPath);

  // console.log("▶ Stream indítása:", absPath); // Opcionális log

  if (!fs.existsSync(absPath)) return res.status(404).send("File not found");

  const stat = fs.statSync(absPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const ext = path.extname(absPath).toLowerCase();
  
  // ITT A LÉNYEG: VTT kezelés
  let mime;
  if (ext === ".mkv") mime = "video/x-matroska";
  else if (ext === ".mp4") mime = "video/mp4";
  else if (ext === ".avi") mime = "video/x-msvideo";
  else if (ext === ".vtt") mime = "text/vtt"; // KULCSFONTOSSÁGÚ SOR
  else mime = "application/octet-stream";

  // Ha VTT fájl, akkor nem kell range streamelés, küldjük egyben
  if (ext === ".vtt") {
      res.writeHead(200, { 
          "Content-Length": fileSize, 
          "Content-Type": "text/vtt",
          "Access-Control-Allow-Origin": "*" // Biztos, ami biztos
      });
      return fs.createReadStream(absPath).pipe(res);
  }

  // Videó streamelés
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(absPath, { start, end });
    stream.on("error", err => {
      console.error("❌ Stream error (range):", err);
      // Ha már küldtünk fejlécet, nem tudunk status-t küldeni, de lezárjuk
      if (!res.headersSent) res.status(500).send("File read error");
    });

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

    const stream = fs.createReadStream(absPath);
    stream.on("error", err => {
      console.error("❌ Stream error (full):", err);
      if (!res.headersSent) res.status(500).send("File read error");
    });
    stream.pipe(res);
  }
});

// =======================
// AUTH RENDSZER 🔐
// =======================
const USERS_FILE = path.join(DATA_DIR, "users.json");
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

  res.json({ success: true, username: user.username, email: user.email });
});

// =======================
// Statikus fájlok (Fixált VTT Headerrel)
// =======================
const staticOptions = {
    setHeaders: (res, path) => {
        if (path.endsWith('.vtt')) {
            res.setHeader('Content-Type', 'text/vtt');
        }
    }
};

app.use(express.static(__dirname, staticOptions));
app.use("/data", express.static(DATA_DIR, staticOptions));

// =======================
// Covers API
// =======================
const coversDir = path.join(DATA_DIR, "Covers");
if (fs.existsSync(coversDir)) {
  app.use("/covers", express.static(coversDir, staticOptions));
  console.log("✅ Covers útvonal engedélyezve: /covers ->", coversDir);
} else {
  console.warn("⚠️ Covers mappa nem található:", coversDir);
}

app.get("/api/covers", (req, res) => {
  try {
    if (!fs.existsSync(coversDir)) return res.json([]);
    const files = fs.readdirSync(coversDir)
      .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
      .map(f => ({ file: f, url: `/covers/${encodeURIComponent(f)}` }));
    res.json(files);
  } catch (err) {
    console.error("❌ Hiba a covers listázásakor:", err);
    res.status(500).json({ error: "Hiba a covers listázásakor" });
  }
});

// =======================
// Subtitles API (JAVÍTOTT)
// =======================
const subsDir = path.join(DATA_DIR, "Subtitles");
if (fs.existsSync(subsDir)) {
  // JAVÍTÁS: Mindkét útvonalat engedélyezzük, hogy ne legyen 404 hiba a nagybetűk miatt
  app.use("/subtitles", express.static(subsDir, staticOptions));
  app.use("/Subtitles", express.static(subsDir, staticOptions)); 
  
  console.log("✅ Subtitles útvonal engedélyezve: /subtitles és /Subtitles ->", subsDir);
} else {
  console.warn("⚠️ Subtitles mappa nem található:", subsDir);
}

app.get("/api/subtitles", (req, res) => {
  try {
    if (!fs.existsSync(subsDir)) return res.json([]);
    const files = fs.readdirSync(subsDir)
      .filter(f => /\.(vtt|srt|txt)$/i.test(f))
      .map(f => ({ file: f, url: `/subtitles/${encodeURIComponent(f)}` }));
    res.json(files);
  } catch (err) {
    console.error("❌ Hiba a subtitles listázásakor:", err);
    res.status(500).json({ error: "Hiba a subtitles listázásakor" });
  }
});

// =======================
// Debug endpointok
// =======================
app.get("/__debug/watchlist-file", (req, res) => {
  res.json({ watchlistFile, exists: fs.existsSync(watchlistFile) });
});

app.get("/__debug/users-file", (req, res) => {
  res.json({ usersFile: USERS_FILE, exists: fs.existsSync(USERS_FILE) });
});

// =======================
// Server indítása
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

export default app;
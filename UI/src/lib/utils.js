// E:\UI\src\lib\utils.js

function formatTime(seconds) {
  // A formázási logikát itt kell elhelyezni, pl.:
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const secString = String(remainingSeconds).padStart(2, '0');
  return `${minutes}:${secString}`;
}

function safeParseJson(jsonString, fallback = null) {
  if (jsonString === null || jsonString === undefined) {
    return fallback;
  }
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return fallback;
  }
}

// JAVÍTÁS: CommonJS 'module.exports' cseréje ESM 'export'-ra
export { formatTime, safeParseJson };

// A kód végén lévő hibás PowerShell parancsot ('New-Item...') itt eltávolítottuk!
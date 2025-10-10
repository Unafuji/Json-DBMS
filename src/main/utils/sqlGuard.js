// src/main/utils/sqlGuard.js
function isDangerous(sql) {
    const s = (sql || '').trim().toUpperCase();
    if (!s) return true;
    if (s.startsWith('PRAGMA')) return true;
    if (s.includes('ATTACH ') || s.includes('DETACH ')) return true;
    // block multiple statements
    if (s.split(';').filter(Boolean).length > 1) return true;
    return false;
}

module.exports = { isDangerous };

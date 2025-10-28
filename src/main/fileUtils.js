
const fs = require('node:fs/promises');

function normalizePath(p) {
    let fp = String(p || '').trim();
    if (!fp) throw new Error('Missing file path/url');

    if (fp.startsWith('file://')) {
        const u = new URL(fp);
        fp = decodeURIComponent(u.pathname);
        if (process.platform === 'win32' && fp.startsWith('/')) fp = fp.slice(1);
    }
    return fp;
}

async function parseJsonOrNdjson(text) {
    try {
        const v = JSON.parse(text);
        return Array.isArray(v) ? v : [v];
    } catch {
        const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        if (!lines.length) return [];
        return lines.map(l => JSON.parse(l));
    }
}

async function readJsonFile(filePath) {
    const fp = normalizePath(filePath);
    const raw = await fs.readFile(fp, 'utf8');
    return parseJsonOrNdjson(raw);
}

module.exports = { normalizePath, parseJsonOrNdjson, readJsonFile };

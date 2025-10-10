// src/main/streams/ndjsonStream.js
const fs = require('node:fs');
const readline = require('node:readline');

async function* streamNdjson(filePath, { signal } = {}) {
    const rl = readline.createInterface({ input: fs.createReadStream(filePath) });
    for await (const line of rl) {
        if (signal?.aborted) break;
        if (!line.trim()) continue;
        try { yield JSON.parse(line); } catch { /* skip bad line */ }
    }
}

module.exports = { streamNdjson };

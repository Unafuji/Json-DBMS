// src/main/jobs/readers.js
const fs = require('fs');
const { chain } = require('stream-chain');
const { parser } = require('stream-json');
const { streamArray } = require('stream-json/streamers/StreamArray');
const readline = require('node:readline');

async function readNdjson(filePath, onItem) {
    // Stream line-by-line, do NOT load whole file
    const stream = fs.createReadStream(filePath, { encoding: 'utf8', highWaterMark: 1 << 20 }); // 1MB chunks
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    let count = 0;
    for await (const line of rl) {
        if (!line.trim()) continue;
        onItem(line); // already a JSON string per line
        if (++count % 10000 === 0) await new Promise(r => setImmediate(r)); // yield to event loop
    }
}

function readJsonArray(filePath, onItem) {
    // Keep streaming JSON array via stream-json
    return new Promise((resolve, reject) => {
        const pipeline = chain([
            fs.createReadStream(filePath, { highWaterMark: 1 << 20 }),
            parser(),
            streamArray()
        ]);
        pipeline.on('data', ({ value }) => onItem(JSON.stringify(value)));
        pipeline.on('end', resolve);
        pipeline.on('error', reject);
    });
}

module.exports = { readNdjson, readJsonArray };

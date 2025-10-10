// src/main/streams/jsonArrayStream.js
const fs = require('node:fs');
const { parser } = require('stream-json');
const { streamArray } = require('stream-json/streamers/StreamArray');

async function* streamJsonArray(filePath, { signal } = {}) {
    const read = fs.createReadStream(filePath, { highWaterMark: 1 << 20 }); // 1MB
    const p = parser();
    const arr = streamArray();
    const src = read.pipe(p).pipe(arr);

    for await (const { value } of src) {
        if (signal?.aborted) break;
        yield value;
    }
}

module.exports = { streamJsonArray };

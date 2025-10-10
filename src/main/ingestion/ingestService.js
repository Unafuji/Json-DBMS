// src/main/ingestion/ingestService.js
const { streamJsonArray } = require('../streams/jsonArrayStream');
const { streamNdjson } = require('../streams/ndjsonStream');
const { SqliteSink } = require('./sqliteSink');
const { inferColumns } = require('./schemaInfer');
const { BackpressureGate } = require('./backpressure');

class IngestService {
    constructor(win, progressCb) {
        this.win = win;
        this.progressCb = progressCb;
        this.aborter = null;
        this.sink = null;
    }

    async start({ filePath, format, table, batchSize = 1000 }) {
        const { AbortController } = require('node-abort-controller'); // local dep shim
        this.aborter = new AbortController();

        const src = format === 'ndjson'
            ? streamNdjson(filePath, { signal: this.aborter.signal })
            : streamJsonArray(filePath, { signal: this.aborter.signal });

        let sample = null;
        const gate = new BackpressureGate({ highWater: 20000, lowWater: 5000 });
        const buffer = [];
        let processed = 0;

        for await (const obj of src) {
            if (!sample) sample = obj;
            buffer.push(obj);
            gate.inc(1);
            if (buffer.length >= batchSize) {
                const chunk = buffer.splice(0, buffer.length);
                await this._flush(table, sample, chunk);
                processed += chunk.length;
                this.progressCb?.({ processed });
                gate.dec(chunk.length);
            }
        }

        if (buffer.length) {
            const chunk = buffer.splice(0, buffer.length);
            await this._flush(table, sample, chunk);
            processed += chunk.length;
            this.progressCb?.({ processed });
            gate.dec(chunk.length);
        }
        return { processed };
    }

    async _flush(table, sample, rows) {
        if (!this.sink) {
            const cols = inferColumns(sample);
            this.sink = new SqliteSink(table, cols);
        }
        this.sink.flush(rows);
    }

    cancel() { this.aborter?.abort(); }
}

module.exports = { IngestService };

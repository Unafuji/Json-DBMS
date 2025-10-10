// src/main/engine/executors/sqliteExec.js
const { db, begin, commit, rollback } = require('../../db/sqlite');
const { parseFirstId } = require('../pagination');
const { readNdjson, readJsonArray } = require('../../jobs/readers');

// ---- PUBLIC API: runQuery, applyEdits, startIngest ----

async function runQuery(plan, cancel) {
    const start = Date.now();
    if (cancel && typeof cancel.throwIfCancelled === 'function') cancel.throwIfCancelled();

    const d = db();
    const stmt = d.prepare(plan.sql);
    const rows = stmt.all(plan.bindings || []);
    const lastId = parseFirstId(rows);

    const stats = { engine: 'sqlite', ms: Date.now() - start, sql: plan.sql };
    return { rows, cursor: { lastId }, stats };
}

function applyEdits(plan) {
    const d = db();
    const getDoc = d.prepare(`SELECT json FROM doc WHERE id=? AND collection_id=?`);
    const setDoc = d.prepare(`UPDATE doc SET json=? WHERE id=? AND collection_id=?`);
    const addPatch = d.prepare(`
    INSERT INTO patch (collection_id, doc_id, op, path, old_json, new_json, applied_utc)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

    begin();
    const applied = [], failed = [];
    try {
        for (const p of (plan.patches || [])) {
            const row = getDoc.get(p.docId, plan.collectionId);
            if (!row) { failed.push({ p, error: 'not found' }); continue; }
            const { newJson, oldJson } = applyPatch(row.json, p);
            setDoc.run(newJson, p.docId, plan.collectionId);
            addPatch.run(plan.collectionId, p.docId, p.op, p.path, oldJson, newJson, Date.now());
            applied.push(p.docId);
        }
        commit();
        return { applied, failed, stats: {} };
    } catch (e) {
        rollback();
        return { applied, failed: failed.concat([{ error: String(e) }]) };
    }
}

// >>>>>>> THIS is the function the engine expects <<<<<<<<
async function startIngest(plan) {
    // plan: { datasetId, collectionName, sourcePath, format? }
    const d = db();

    // Ensure collection exists and get its id
    const getOrCreateCol = d.prepare(`
    INSERT INTO collection (dataset_id, name)
    VALUES (?, ?)
    ON CONFLICT(dataset_id, name) DO UPDATE SET name=excluded.name
    RETURNING id
  `);
    const { id: collectionId } = getOrCreateCol.get(plan.datasetId, plan.collectionName);

    // Prepared insert
    const insertDoc = d.prepare(`INSERT INTO doc (collection_id, json) VALUES (?, ?)`);

    // Batch transaction
    const tx = d.transaction((items) => {
        for (const jsonStr of items) insertDoc.run(collectionId, jsonStr);
    });

    const BATCH_SIZE = 5000;
    const batch = [];
    let inserted = 0;

    const flush = () => {
        if (!batch.length) return;
        tx(batch.splice(0, batch.length));
    };

    const pushItem = (jsonStr) => {
        batch.push(jsonStr);
        inserted++;
        if (batch.length >= BATCH_SIZE) flush();
    };

    // Auto/explicit format
    const fmt = (plan.format || guessFormat(plan.sourcePath)).toLowerCase();
    if (fmt === 'ndjson') {
        await readNdjson(plan.sourcePath, pushItem);   // streams line-by-line
        flush();
    } else if (fmt === 'json-array') {
        await readJsonArray(plan.sourcePath, pushItem); // streams array items
        flush();
    } else {
        throw new Error(`Unsupported format: ${fmt}`);
    }

    return { inserted, collectionId };
}

function guessFormat(p) {
    return String(p || '').toLowerCase().endsWith('.ndjson') ? 'ndjson' : 'json-array';
}

/* Minimal dot-path patcher (replace with a real JSON Patch later) */
function applyPatch(jsonStr, p) {
    const obj = JSON.parse(jsonStr);
    const oldJson = jsonStr;

    const path = (p.path || '').replace(/^\$\.?/, '');
    if (!path) throw new Error('empty path');

    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
        cur = cur[k];
    }
    const leaf = parts[parts.length - 1];

    switch (p.op) {
        case 'remove': delete cur[leaf]; break;
        case 'replace': cur[leaf] = p.value; break;
        case 'add': cur[leaf] = p.value; break;
        default: throw new Error(`Unsupported op ${p.op}`);
    }
    return { oldJson, newJson: JSON.stringify(obj) };
}

module.exports = { runQuery, applyEdits, startIngest };

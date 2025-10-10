// src/main/engine/sqliteHelpers.js
// Tiny helpers for safe-ish SQL text generation around JSON1 projections.

function escapeSqlString(lit) {
    // JSON paths must be string literals in SQLite; we need to quote them safely.
    if (typeof lit !== 'string') throw new Error('Path must be a string');
    return `'${lit.replace(/'/g, "''")}'`;
}

function aliasFromPath(path) {
    // '$.order.id' -> order_id   | '$._id' -> _id
    const raw = path.replace(/^\$\./, '');
    return raw.replace(/[^a-zA-Z0-9_]/g, '_');
}

function buildSelectList(paths) {
    if (!Array.isArray(paths) || paths.length === 0) return 'doc.id, doc.json';
    const cols = paths.map(p =>
        `json_extract(doc.json, ${escapeSqlString(p)}) AS ${aliasFromPath(p)}`
    );
    // Always include doc.id so pagination and selection don’t break
    cols.unshift('doc.id');
    return cols.join(', ');
}

module.exports = { escapeSqlString, aliasFromPath, buildSelectList };

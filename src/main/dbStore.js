// src/main/dbStore.js
let _rows = [];
let _cols = [];

function setRows(rows) {
    _rows = rows;
    _cols = inferCols(rows);
}

function getRows(offset = 0, limit = 100) {
    const start = Math.max(0, offset | 0);
    const end = Math.min(start + (limit | 0), _rows.length);
    return _rows.slice(start, end);
}

function getRowCount() {
    return _rows.length;
}

function getCols() {
    return _cols;
}

// helper for column inference
function inferCols(rows) {
    const first = rows.find(r => r && typeof r === 'object' && !Array.isArray(r));
    if (!first) return [];
    return Object.keys(first).map(k => ({ name: k }));
}

module.exports = { setRows, getRows, getCols, getRowCount };

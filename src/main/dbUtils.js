let _rows = [];
let _cols = [];

function inferCols(rows) {
    const first = rows.find(r => r && typeof r === 'object' && !Array.isArray(r));
    if (!first) return [];
    return Object.keys(first).map(k => ({ name: k }));
}

function setRows(rows) {
    _rows = rows;
    _cols = inferCols(rows);
}

function getRows() { return _rows; }
function getCols() { return _cols; }

module.exports = { _rows, _cols, inferCols, setRows, getRows, getCols };

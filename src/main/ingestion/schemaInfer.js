export function inferColumns(sampleObj, { maxCols = 200 }) {
    const cols = [];
    for (const [k,v] of Object.entries(sampleObj)) {
        if (cols.length >= maxCols) break;
        cols.push({ name: k, type: typeof v === 'number' ? 'REAL' : 'TEXT' });
    }
    return cols;
}

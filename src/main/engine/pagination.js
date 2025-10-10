function parseFirstId(rows) {
    if (!rows?.length) return null;
    // Prefer explicit id if present, else try rowid-like
    if ('id' in rows[rows.length - 1]) return rows[rows.length - 1].id;
    return null;
}
module.exports = { parseFirstId };

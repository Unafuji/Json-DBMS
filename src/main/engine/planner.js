const { buildSelectList } = require('./sqliteHelpers');

function planQuery(req) {
    const select = Array.isArray(req?.selectPaths) && req.selectPaths.length
        ? buildSelectList(req.selectPaths)
        : 'doc.id, doc.json';

    const pageSize = Math.max(1, Math.min(req?.pageSize ?? 200, 5000));
    const lastId = req?.cursor?.lastId ? Number(req.cursor.lastId) : null;

    const whereParts = [];
    if (req?.where) whereParts.push(`(${req.where})`);
    if (lastId) whereParts.push(`doc.id > ${lastId}`);

    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
    const orderBy = req?.orderBy || 'doc.id ASC';

    const sql = `
    SELECT ${select}
    FROM doc
    ${where}
    ORDER BY ${orderBy}
    LIMIT ${pageSize};
  `.trim();

    return { engine: 'sqlite', sql, bindings: [], page: { pageSize } };
}

function planEdit(req) { return { engine: 'sqlite', ...req }; }
function planIngest(req) { return { engine: 'sqlite', ...req }; }

module.exports = { planQuery, planEdit, planIngest };

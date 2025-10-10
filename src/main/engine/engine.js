const { planQuery, planEdit, planIngest } = require('./planner');
const sqliteExec = require('./executors/sqliteExec');
const { makeCancelToken } = require('./cancelToken');

const executors = { sqlite: sqliteExec, duckdb: null };

async function runQuery(req) {
    const plan = planQuery(req);
    const exec = executors[plan.engine];
    if (!exec || typeof exec.runQuery !== 'function') throw new Error(`Engine ${plan.engine} missing runQuery`);
    const cancel = makeCancelToken();
    try { return await exec.runQuery(plan, cancel); } finally { cancel.dispose(); }
}

async function applyEdits(req) {
    const plan = planEdit(req);
    const exec = executors[plan.engine];
    if (!exec || typeof exec.applyEdits !== 'function') throw new Error(`Engine ${plan.engine} missing applyEdits`);
    return exec.applyEdits(plan);
}

async function startIngest(req) {
    const plan = planIngest(req);
    const exec = executors[plan.engine];
    if (!exec || typeof exec.startIngest !== 'function') throw new Error(`Engine ${plan.engine} missing startIngest`);
    return exec.startIngest(plan);
}

module.exports = { runQuery, applyEdits, startIngest };

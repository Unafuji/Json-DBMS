// src/main/db/sqlite.js
// One source of truth for the SQLite handle.
// Provides: initDb(dbFilePath?), db(), begin(), commit(), rollback()

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

let _db = null;

function initDb(dbFilePath) {
    // Default DB lives under app userData; caller may pass an explicit path
    if (!dbFilePath) {
        // Lazy require to avoid circular import at module load
        const { app } = require('electron');
        const dir = app.getPath('userData');
        dbFilePath = path.join(dir, 'json-dbms.sqlite');
    }

    // Ensure folder exists
    fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });

    _db = new Database(dbFilePath, { fileMustExist: false });

    // Pragmas for sane performance on desktops
    _db.pragma('journal_mode = WAL');
    _db.pragma('synchronous = NORMAL');
    _db.pragma('temp_store = MEMORY');

    // Run bootstrap migration
    const migPath = path.join(__dirname, 'migrations', '001_bootstrap.sql');
    const sql = fs.readFileSync(migPath, 'utf8');
    _db.exec(sql);

    return _db;
}

function db() {
    if (!_db) throw new Error('DB not initialized. Call initDb() first.');
    return _db;
}

function begin()  { db().exec('BEGIN'); }
function commit() { db().exec('COMMIT'); }
function rollback(){ db().exec('ROLLBACK'); }

module.exports = { initDb, db, begin, commit, rollback };

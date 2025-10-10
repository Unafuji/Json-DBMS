import Database from 'better-sqlite3';

let db;
export function initDb(filePath) {
    db = new Database(filePath);
    db.pragma('journal_mode = WAL');
    return db;
}
export function getDb() {
    if (!db) throw new Error('DB not initialized. Call initDb() first.');
    return db;
}

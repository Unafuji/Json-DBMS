PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;

/* Datasets (logical dbs you import) */
CREATE TABLE IF NOT EXISTS dataset (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  created_utc INTEGER NOT NULL,
  meta_json TEXT NOT NULL DEFAULT '{}'
);

/* Collections (tables inside dataset) */
CREATE TABLE IF NOT EXISTS collection (
  id INTEGER PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES dataset(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stats_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(dataset_id, name)
);

/* Documents (store raw JSON; index paths lazily) */
CREATE TABLE IF NOT EXISTS doc (
  id INTEGER PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES collection(id) ON DELETE CASCADE,
  json TEXT NOT NULL
);

/* Patches (for edits/undo) */
CREATE TABLE IF NOT EXISTS patch (
  id INTEGER PRIMARY KEY,
  collection_id INTEGER NOT NULL,
  doc_id INTEGER NOT NULL,
  op TEXT NOT NULL,                 -- 'replace' | 'add' | 'remove'
  path TEXT NOT NULL,               -- JSON pointer or dot path
  old_json TEXT,
  new_json TEXT,
  applied_utc INTEGER NOT NULL
);

/* Ingestion jobs + steps (resume, audit, errors) */
CREATE TABLE IF NOT EXISTS ingest_job (
  id INTEGER PRIMARY KEY,
  dataset_id INTEGER NOT NULL,
  source TEXT NOT NULL,             -- file path/uri
  format TEXT NOT NULL,             -- 'jsonl' | 'ndjson' | 'json-array' | 'csv'
  state TEXT NOT NULL,              -- 'queued' | 'running' | 'paused' | 'failed' | 'completed'
  started_utc INTEGER,
  finished_utc INTEGER,
  meta_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS ingest_error (
  id INTEGER PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES ingest_job(id) ON DELETE CASCADE,
  line_no INTEGER,
  error TEXT,
  sample TEXT
);

/* Example JSON1 path index table (built lazily) */
CREATE TABLE IF NOT EXISTS path_index (
  id INTEGER PRIMARY KEY,
  collection_id INTEGER NOT NULL,
  path TEXT NOT NULL,               -- e.g. $.orderId
  value TEXT,                       -- normalized as TEXT; cast in queries
  doc_id INTEGER NOT NULL,
  UNIQUE(collection_id, path, value, doc_id)
);

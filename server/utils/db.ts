import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

// 数据文件目录：默认项目根 .data/，可用 DATA_DIR 环境变量覆盖
const dataDir = process.env.DATA_DIR ?? join(process.cwd(), '.data')

let _db: DatabaseSync | null = null

/**
 * 获取数据库单例（惰性初始化 + 幂等建表）。
 * server/ 代码统一通过 useDB() 访问，避免多连接与重复建表。
 */
export function useDB(): DatabaseSync {
  if (_db) return _db

  mkdirSync(dataDir, { recursive: true })
  const db = new DatabaseSync(join(dataDir, 'starpets.db'))

  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA foreign_keys = ON;')

  for (const sql of MIGRATIONS) db.exec(sql)
  ensureColumns(db)
  // 初始化钱包单行
  db.prepare('INSERT OR IGNORE INTO wallet (id, balance) VALUES (1, 0)').run()

  _db = db
  return db
}

// 旧库迁移：确保关键字段存在（幂等，PRAGMA table_info + ALTER）
function ensureColumns(db: DatabaseSync) {
  const cols = db.prepare('PRAGMA table_info(pet)').all() as Array<{ name: string }>
  if (!cols.some((c) => c.name === 'last_decay_at')) {
    db.exec('ALTER TABLE pet ADD COLUMN last_decay_at TEXT')
  }
}

// 幂等建表（IF NOT EXISTS）。后续加表在此追加，保证可重复执行。
const MIGRATIONS = [
  // 宠物
  `CREATE TABLE IF NOT EXISTS pet (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    species     TEXT    NOT NULL,
    level       INTEGER NOT NULL DEFAULT 1,
    exp         INTEGER NOT NULL DEFAULT 0,
    satiety     REAL    NOT NULL DEFAULT 50,
    cleanliness REAL    NOT NULL DEFAULT 50,
    happiness   REAL    NOT NULL DEFAULT 50,
    frozen_at   TEXT,
    onboarded   INTEGER NOT NULL DEFAULT 0,
    last_decay_at TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  )`,

  // 任务（once 一次性 / daily 每日；weekly 属 V1.5）
  `CREATE TABLE IF NOT EXISTS task (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT    NOT NULL,
    description TEXT,
    type        TEXT    NOT NULL DEFAULT 'once',
    due_time    TEXT,
    weekday     INTEGER,
    pet_id      INTEGER REFERENCES pet(id),
    status      TEXT    NOT NULL DEFAULT 'pending',
    stars       INTEGER,
    done_at     TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  )`,

  // 星星流水（正负）
  `CREATE TABLE IF NOT EXISTS star_transaction (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    amount     INTEGER NOT NULL,
    reason     TEXT    NOT NULL,
    task_id    INTEGER REFERENCES task(id),
    pet_id     INTEGER REFERENCES pet(id),
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )`,

  // 每日状态快照（成长值结算依据，UNIQUE 便于 UPSERT）
  `CREATE TABLE IF NOT EXISTS state_snapshot (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id        INTEGER NOT NULL REFERENCES pet(id),
    snapshot_date TEXT    NOT NULL,
    satiety       REAL    NOT NULL,
    cleanliness   REAL    NOT NULL,
    happiness     REAL    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (pet_id, snapshot_date)
  )`,

  // 埋点事件
  `CREATE TABLE IF NOT EXISTS analytics_event (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    event      TEXT    NOT NULL,
    payload    TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )`,

  // 星星钱包（单行，全局余额字段）
  `CREATE TABLE IF NOT EXISTS wallet (
    id      INTEGER PRIMARY KEY CHECK (id = 1),
    balance INTEGER NOT NULL DEFAULT 0
  )`,
]

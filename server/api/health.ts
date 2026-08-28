import { useDB } from '../utils/db'
import { ok } from '../utils/response'

// 验证 DB 可读写（task-002 验收）：列出当前已建表
export default defineEventHandler(() => {
  const db = useDB()
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    )
    .all() as Array<{ name: string }>

  return ok({ tables: tables.map((t) => t.name) })
})

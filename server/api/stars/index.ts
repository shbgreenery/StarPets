import { useDB } from '../../utils/db'
import { ok, fail } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const db = useDB()

  if (event.method === 'GET') {
    const rows = db.prepare('SELECT * FROM star_transaction ORDER BY id DESC').all()
    return ok(rows)
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    if (typeof body?.amount !== 'number' || !body?.reason) {
      return fail(event, 400, 'amount（数值）与 reason 必填')
    }
    const result = db
      .prepare('INSERT INTO star_transaction (amount, reason, task_id, pet_id) VALUES (?, ?, ?, ?)')
      .run(body.amount, body.reason, body.task_id ?? null, body.pet_id ?? null)
    const row = db.prepare('SELECT * FROM star_transaction WHERE id = ?').get(Number(result.lastInsertRowid))
    return ok(row)
  }

  return fail(event, 405, 'Method not allowed')
})

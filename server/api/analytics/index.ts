import { useDB } from '../../utils/db'
import { ok, fail } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const db = useDB()

  if (event.method === 'GET') {
    const rows = db.prepare('SELECT * FROM analytics_event ORDER BY id DESC LIMIT 100').all()
    return ok(rows)
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    if (!body?.event) {
      return fail(event, 400, 'event 必填')
    }
    const result = db
      .prepare('INSERT INTO analytics_event (event, payload) VALUES (?, ?)')
      .run(body.event, body.payload ? JSON.stringify(body.payload) : null)
    const row = db.prepare('SELECT * FROM analytics_event WHERE id = ?').get(Number(result.lastInsertRowid))
    return ok(row)
  }

  return fail(event, 405, 'Method not allowed')
})

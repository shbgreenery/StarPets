import { useDB } from '../../utils/db'
import { ok, fail } from '../../utils/response'
import { toDateStr } from '../../utils/date'

interface TaskRow {
  id: number
  title: string
  description: string | null
  type: string
  due_time: string | null
  pet_id: number | null
  status: string
  stars: number | null
  done_at: string | null
}

export default defineEventHandler(async (event) => {
  const db = useDB()

  if (event.method === 'GET') {
    const today = toDateStr(new Date())

    // 每日任务每日重置：昨天完成的 daily 任务 → 今天重置为待办
    const tasks = db.prepare('SELECT * FROM task ORDER BY id').all() as TaskRow[]
    for (const t of tasks) {
      if (t.type === 'daily' && t.status === 'done' && t.done_at && toDateStr(new Date(t.done_at)) !== today) {
        db.prepare("UPDATE task SET status = 'pending', done_at = NULL, stars = NULL WHERE id = ?").run(t.id)
        t.status = 'pending'
        t.done_at = null
        t.stars = null
      }
    }

    // 逾期判定：pending 且 due_time 已过
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const result = tasks.map((t) => {
      let overdue = false
      if (t.status === 'pending' && t.due_time) {
        const [h, m] = t.due_time.split(':').map(Number)
        overdue = nowMinutes > h * 60 + m
      }
      return { ...t, overdue }
    })

    return ok(result)
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    if (!body?.title) return fail(event, 400, 'title 必填')
    if (String(body.title).length > 20) return fail(event, 400, 'title 不能超过 20 字')

    const result = db
      .prepare('INSERT INTO task (title, description, type, due_time, pet_id) VALUES (?, ?, ?, ?, ?)')
      .run(body.title, body.description ?? null, body.type ?? 'once', body.due_time ?? null, body.pet_id ?? null)

    const task = db.prepare('SELECT * FROM task WHERE id = ?').get(Number(result.lastInsertRowid))
    return ok(task)
  }

  return fail(event, 405, 'Method not allowed')
})

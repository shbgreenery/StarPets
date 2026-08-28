import { useDB } from '../../../utils/db'
import { ok, fail } from '../../../utils/response'
import { addStarTransaction, getBalance } from '../../../utils/wallet'

// 完成任务：打星 + 星星入账（task-006 / req-004）
export default defineEventHandler(async (event) => {
  const db = useDB()
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const stars = Number(body?.stars)

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return fail(event, 400, 'stars 必须是 1-5 的整数')
  }

  const task = db.prepare('SELECT * FROM task WHERE id = ?').get(id) as
    | { id: number; status: string; pet_id: number | null }
    | undefined
  if (!task) return fail(event, 404, '任务不存在')
  if (task.status === 'done') return fail(event, 409, '任务已完成')

  const now = new Date().toISOString()

  db.prepare("UPDATE task SET status = 'done', stars = ?, done_at = ? WHERE id = ?").run(stars, now, id)
  addStarTransaction(db, stars, 'task_reward', id, task.pet_id ?? null)

  return ok({ id, stars, balance: getBalance(db) })
})

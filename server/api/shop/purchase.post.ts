import { useDB } from '../../utils/db'
import { ok, fail } from '../../utils/response'
import { findItem } from '../../utils/catalog'
import { statCap } from '../../utils/decay'
import { addStarTransaction, getBalance } from '../../utils/wallet'

// 购买道具：扣星 + 提升三维（task-009 / req-008）
export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)
  const item = findItem(String(body?.itemId))
  const petId = Number(body?.petId)

  if (!item) return fail(event, 404, '道具不存在')
  if (!Number.isInteger(petId)) return fail(event, 400, 'petId 必填')

  const pet = db.prepare('SELECT * FROM pet WHERE id = ?').get(petId) as
    | { level: number; satiety: number; cleanliness: number; happiness: number }
    | undefined
  if (!pet) return fail(event, 404, '宠物不存在')

  const balance = getBalance(db)
  if (balance < item.price) return fail(event, 400, '星星不足')

  const cap = statCap(pet.level)
  const current = pet[item.effect]
  const newValue = Math.min(cap, current + item.amount) // 不超过上限

  // 扣星（事务内写 -N 流水 + 更新余额）
  addStarTransaction(db, -item.price, 'shop_purchase', null, petId)

  // 提升对应维度
  db.prepare(`UPDATE pet SET ${item.effect} = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(newValue, petId)

  return ok({ item: item.name, effect: item.effect, value: newValue, cap, balance: balance - item.price })
})

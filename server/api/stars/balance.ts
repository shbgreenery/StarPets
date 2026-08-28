import { useDB } from '../../utils/db'
import { ok } from '../../utils/response'
import { getBalance } from '../../utils/wallet'

// 星星余额（读 wallet.balance）
export default defineEventHandler(() => {
  const db = useDB()
  return ok({ balance: getBalance(db) })
})

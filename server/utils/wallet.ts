import type { DatabaseSync } from 'node:sqlite'

/**
 * 星星变动：事务内写流水 + 更新余额（保证 wallet.balance 与流水求和一致）。
 * amount 为正（获得）或负（消费）。
 */
export function addStarTransaction(
  db: DatabaseSync,
  amount: number,
  reason: string,
  taskId?: number | null,
  petId?: number | null,
) {
  db.exec('BEGIN')
  try {
    db.prepare('INSERT INTO star_transaction (amount, reason, task_id, pet_id) VALUES (?, ?, ?, ?)')
      .run(amount, reason, taskId ?? null, petId ?? null)
    db.prepare('UPDATE wallet SET balance = balance + ? WHERE id = 1').run(amount)
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

/** 读取星星余额 */
export function getBalance(db: DatabaseSync): number {
  const row = db.prepare('SELECT balance FROM wallet WHERE id = 1').get() as { balance: number }
  return row.balance
}

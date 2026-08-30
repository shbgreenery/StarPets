import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'

beforeEach(async () => {
  await db.open()
  await clearAll()
  await initDb()
})

describe('db schema 与初始化', () => {
  it('有 5 张表', () => {
    expect(db.tables.map(t => t.name).sort()).toEqual([
      'badges', 'evaluation_records', 'evaluation_rules',
      'settings', 'students'
    ])
  })

  it('initDb 幂等：重复调用不重复插入默认规则', async () => {
    await initDb()
    const count = await db.evaluation_rules.count()
    expect(count).toBe(83)
  })

  it('初始化默认设置 levelConfig', async () => {
    const s = await db.settings.get('levelConfig')
    expect(s?.value).toEqual([40, 60, 80, 100, 120, 140, 160])
  })
})

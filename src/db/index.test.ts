import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll, purgeNegativeRules } from './index'

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
    expect(count).toBe(45)
  })

  it('初始化默认设置 levelConfig', async () => {
    const s = await db.settings.get('levelConfig')
    expect(s?.value).toEqual([40, 60, 80, 100, 120, 140, 160])
  })

  it('v3 升级清理:删除负分规则保留正分', async () => {
    await db.evaluation_rules.add({ id: 'neg1', name: '不交作业', points: -1, category: '学习', is_custom: 0, created_at: 1 })
    await db.evaluation_rules.add({ id: 'pos1', name: '作业完成优秀', points: 3, category: '学习', is_custom: 0, created_at: 1 })
    await db.transaction('rw', db.evaluation_rules, async (tx) => {
      await purgeNegativeRules(tx)
    })
    const rules = await db.evaluation_rules.toArray()
    expect(rules.filter(r => r.points < 0)).toHaveLength(0)
    expect(rules.some(r => r.id === 'pos1')).toBe(true)
  })
})

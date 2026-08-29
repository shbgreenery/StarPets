import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'
import { getRules, addRule, deleteRule, getSettings, updateSettings } from './rules'

beforeEach(async () => {
  await db.open()
  await clearAll()
  await initDb()
})

describe('规则', () => {
  it('getRules 返回 83 条默认规则', async () => {
    const rules = await getRules()
    expect(rules).toHaveLength(83)
  })

  it('添加自定义规则 is_custom=1', async () => {
    const r = await addRule('测试规则', 5, '其他')
    expect(r.is_custom).toBe(1)
    expect(await getRules()).toHaveLength(84)
  })

  it('删除自定义规则', async () => {
    const r = await addRule('测试规则', 5, '其他')
    await deleteRule(r.id)
    expect(await getRules()).toHaveLength(83)
  })

  it('不能删除默认规则', async () => {
    const rules = await getRules()
    await deleteRule(rules[0].id)
    expect(await getRules()).toHaveLength(83)
  })
})

describe('设置', () => {
  it('getSettings 读取 levelConfig', async () => {
    const v = await getSettings('levelConfig')
    expect(v).toEqual([40, 60, 80, 100, 120, 140, 160])
  })

  it('updateSettings 写入并读回', async () => {
    await updateSettings('levelConfig', [10, 20, 30])
    expect(await getSettings('levelConfig')).toEqual([10, 20, 30])
  })
})

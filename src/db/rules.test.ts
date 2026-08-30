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
    expect(rules).toHaveLength(45)
  })

  it('添加自定义规则 is_custom=1', async () => {
    const r = await addRule('测试规则', 5, '其他')
    expect(r.is_custom).toBe(1)
    expect(await getRules()).toHaveLength(46)
  })

  it('删除自定义规则', async () => {
    const r = await addRule('测试规则', 5, '其他')
    await deleteRule(r.id)
    expect(await getRules()).toHaveLength(45)
  })

  it('不能删除默认规则', async () => {
    const rules = await getRules()
    await deleteRule(rules[0].id)
    expect(await getRules()).toHaveLength(45)
  })

  it('同类别内按 points 降序', async () => {
    await addRule('规则A', 5, '其他')
    await addRule('规则B', 8, '其他')
    const rules = await getRules()
    const idxA = rules.findIndex(r => r.name === '规则A')
    const idxB = rules.findIndex(r => r.name === '规则B')
    expect(idxA).toBeGreaterThan(-1)
    expect(idxB).toBeGreaterThan(-1)
    expect(idxB).toBeLessThan(idxA) // 8 分排在 5 分之前
  })

  it('按类别确定性排序（localeCompare zh）', async () => {
    const rules = await getRules()
    const categories: string[] = []
    for (const r of rules) {
      if (categories[categories.length - 1] !== r.category) categories.push(r.category)
    }
    const sorted = [...categories].sort((a, b) => a.localeCompare(b, 'zh'))
    expect(categories).toEqual(sorted)
    // zh 拼音序下类别顺序示例：其他 在 学习 之前
    expect(categories.indexOf('其他')).toBeLessThan(categories.indexOf('学习'))
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

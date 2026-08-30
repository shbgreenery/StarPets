import { describe, it, expect } from 'vitest'
import { DEFAULT_RULES } from './evaluation-rules'

describe('默认评价规则', () => {
  it('应该有 45 条默认规则', () => {
    expect(DEFAULT_RULES).toHaveLength(45)
  })

  it('每条规则字段完整', () => {
    for (const rule of DEFAULT_RULES) {
      expect(rule.id).toBeTruthy()
      expect(rule.name).toBeTruthy()
      expect(typeof rule.points).toBe('number')
      expect(rule.points).not.toBe(0)
      expect(['学习', '行为', '健康', '其他']).toContain(rule.category)
      expect(rule.is_custom).toBe(0)
    }
  })

  it('覆盖四个分类', () => {
    const cats = new Set(DEFAULT_RULES.map(r => r.category))
    expect(cats.size).toBe(4)
  })

  it('全部为正分规则(已去掉扣分)', () => {
    expect(DEFAULT_RULES.length).toBeGreaterThan(0)
    expect(DEFAULT_RULES.every(r => r.points > 0)).toBe(true)
  })
})

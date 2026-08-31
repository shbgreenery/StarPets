import { db } from './index'
import type { RuleRow } from './index'

export async function getRules(): Promise<RuleRow[]> {
  const rules = await db.evaluation_rules.toArray()
  return rules.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category, 'zh')
    return b.points - a.points
  })
}

export async function addRule(name: string, points: number, category: string): Promise<RuleRow> {
  const rule: RuleRow = {
    id: crypto.randomUUID(), name, points, category, is_custom: 1, created_at: Date.now()
  }
  await db.evaluation_rules.add(rule)
  return rule
}

export async function deleteRule(id: string): Promise<void> {
  await db.evaluation_rules.delete(id)
}

export async function getSettings(key: string): Promise<unknown> {
  const s = await db.settings.get(key)
  return s?.value
}

export async function updateSettings(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value })
}

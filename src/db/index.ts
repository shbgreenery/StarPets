import Dexie, { type Table, type Transaction } from 'dexie'
import { DEFAULT_RULES } from '@/data/evaluation-rules'

// 表行类型
export interface StudentRow {
  id: string; name: string;
  total_points: number; pet_type: string | null; pet_name: string | null;
  pet_level: number; pet_exp: number;
  hunger: number; cleanliness: number; happiness: number;
  stars: number; last_decay_at: number;
  deco_bg: string | null; deco_fx: string | null; deco_pendants: string[]; deco_owned: string[];
  deco_expiry: Record<string, number>;  // 限时装饰过期时间戳 { id: expiresAt }
  created_at: number
}
export interface BadgeRow { id: string; student_id: string; pet_type: string; earned_at: number }
export interface RuleRow { id: string; name: string; points: number; category: string; is_custom: number; created_at: number }
export interface EvaluationRecordRow { id: string; student_id: string; points: number; reason: string; category: string; timestamp: number }
export interface SettingRow { key: string; value: unknown }

class PetGardenDB extends Dexie {
  students!: Table<StudentRow, string>
  badges!: Table<BadgeRow, string>
  evaluation_rules!: Table<RuleRow, string>
  evaluation_records!: Table<EvaluationRecordRow, string>
  settings!: Table<SettingRow, string>

  constructor() {
    super('pet-garden')
    this.version(1).stores({
      students: 'id, name, total_points',
      badges: 'id, student_id, pet_type',
      evaluation_rules: 'id, category, is_custom',
      evaluation_records: 'id, student_id, timestamp',
      settings: 'key'
    })
    // v2: 学生新增生存指标/星星字段(无索引),为存量行回填默认值
    this.version(2).stores({
      students: 'id, name, total_points'
    }).upgrade((tx) =>
      tx.table('students').toCollection().modify((s) => {
        s.hunger ??= 80
        s.cleanliness ??= 80
        s.happiness ??= 80
        s.stars ??= 0
        s.last_decay_at ??= Date.now()
      })
    )
    // v3: 去掉扣分评价后,清理存量负分规则(种子数据已只保留正分)
    this.version(3).upgrade((tx) => purgeNegativeRules(tx))
    // v4: 装扮装饰字段(无索引),为存量行回填 null
    this.version(4).upgrade((tx) =>
      tx.table('students').toCollection().modify((s) => {
        s.deco_bg ??= null
        s.deco_pendant ??= null
      })
    )
    // v5: 挂饰支持多件 + 拥有集合。迁移 v4 单值 deco_pendant → deco_pendants/deco_owned
    this.version(5).upgrade((tx) =>
      tx.table('students').toCollection().modify((s) => {
        const pendants: string[] = s.deco_pendant ? [s.deco_pendant] : []
        const owned: string[] = []
        if (s.deco_bg) owned.push(s.deco_bg)
        for (const p of pendants) owned.push(p)
        s.deco_pendants = pendants
        s.deco_owned = owned
      })
    )
    // v6: 特效装饰字段(单槽,同背景),为存量行回填 null
    this.version(6).upgrade((tx) =>
      tx.table('students').toCollection().modify((s) => {
        s.deco_fx ??= null
      })
    )
    // v7: 占位版本号（任务成就系统已移除，保留版本号避免存量数据库降级报错）
    this.version(7)
  }
}

export const db = new PetGardenDB()

// 删除所有负分规则(扣分评价已下线,保留正分规则)
export function purgeNegativeRules(tx: Transaction): Promise<number> {
  return tx.table<RuleRow, string>('evaluation_rules')
    .toCollection()
    .filter((r) => r.points < 0)
    .delete()
}

// 清空所有表（测试用）
export async function clearAll() {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map(t => t.clear()))
  })
}

// 初始化默认数据（幂等）
export async function initDb() {
  // 默认规则
  const ruleCount = await db.evaluation_rules.count()
  if (ruleCount === 0) {
    // DEFAULT_RULES 均带 is_custom/created_at，只是 Rule 类型声明为可选；此处断言为 RuleRow
    await db.evaluation_rules.bulkPut(DEFAULT_RULES as RuleRow[])
  }

  // 等级配置
  const levelConfig = await db.settings.get('levelConfig')
  if (!levelConfig) {
    await db.settings.put({ key: 'levelConfig', value: [40, 60, 80, 100, 120, 140, 160] })
  }
}

import Dexie, { type Table } from 'dexie'
import { DEFAULT_RULES } from '@/data/evaluation-rules'

// 表行类型
export interface StudentRow {
  id: string; name: string;
  total_points: number; pet_type: string | null; pet_name: string | null;
  pet_level: number; pet_exp: number;
  hunger: number; cleanliness: number; happiness: number;
  stars: number; last_decay_at: number;
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
  }
}

export const db = new PetGardenDB()

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

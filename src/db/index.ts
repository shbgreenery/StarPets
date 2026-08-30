import Dexie, { type Table } from 'dexie'
import { DEFAULT_RULES } from '@/data/evaluation-rules'

// 表行类型
export interface ClassRow { id: string; user_id: string; name: string; created_at: number; updated_at: number }
export interface StudentRow {
  id: string; class_id: string; name: string; student_no: string | null;
  total_points: number; pet_type: string | null; pet_name: string | null;
  pet_level: number; pet_exp: number; created_at: number
}
export interface BadgeRow { id: string; student_id: string; pet_type: string; earned_at: number }
export interface RuleRow { id: string; name: string; points: number; category: string; is_custom: number; created_at: number }
export interface EvaluationRecordRow { id: string; class_id: string; student_id: string; points: number; reason: string; category: string; timestamp: number }
export interface SettingRow { key: string; value: unknown }
export interface UserRow { id: string; username: string; password_hash: string; is_guest: number; created_at: number }

class PetGardenDB extends Dexie {
  classes!: Table<ClassRow, string>
  students!: Table<StudentRow, string>
  badges!: Table<BadgeRow, string>
  evaluation_rules!: Table<RuleRow, string>
  evaluation_records!: Table<EvaluationRecordRow, string>
  settings!: Table<SettingRow, string>
  users!: Table<UserRow, string>

  constructor() {
    super('pet-garden')
    this.version(1).stores({
      classes: 'id, name, created_at',
      students: 'id, class_id, name, student_no, total_points',
      badges: 'id, student_id, pet_type',
      evaluation_rules: 'id, category, is_custom',
      evaluation_records: 'id, class_id, student_id, timestamp',
      settings: 'key',
      users: 'id, username'
    })
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

  // 游客用户
  const guest = await db.users.get('guest')
  if (!guest) {
    await db.users.put({ id: 'guest', username: 'guest', password_hash: '', is_guest: 1, created_at: Date.now() })
  }
}

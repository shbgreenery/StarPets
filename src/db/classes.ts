import { db } from './index'
import type { BadgeRow, StudentRow } from './index'
import type { ShopItem } from '@/data/shop'
import { calculateLevel } from '@/data/pets'

// 指标衰减/成长值间隔:每 30 分钟
export const DECAY_INTERVAL = 30 * 60 * 1000

// 指标兜底默认值(防旧行缺字段)
function normalize(s: StudentRow, now: number): StudentRow {
  return {
    ...s,
    hunger: s.hunger ?? 80,
    cleanliness: s.cleanliness ?? 80,
    happiness: s.happiness ?? 80,
    stars: s.stars ?? 0,
    last_decay_at: s.last_decay_at ?? now
  }
}

export interface TimeEffectResult {
  student: StudentRow
  leveledUp: boolean
  graduated: boolean
}

// 每个时间步:三指标各降1(下限0);三指标都 ≥10 时成长值(总积分/经验)各 +1,否则不涨(任一=0 即休眠)
export function applyTimeEffects(s: StudentRow, now = Date.now()): TimeEffectResult {
  const elapsed = Math.floor((now - s.last_decay_at) / DECAY_INTERVAL)
  const student = { ...s }
  if (elapsed <= 0) return { student, leveledUp: false, graduated: false }

  // 指标衰减
  student.hunger = Math.max(0, s.hunger - elapsed)
  student.cleanliness = Math.max(0, s.cleanliness - elapsed)
  student.happiness = Math.max(0, s.happiness - elapsed)
  student.last_decay_at = s.last_decay_at + elapsed * DECAY_INTERVAL

  // 成长值:三指标任一 <10 不涨
  if (student.hunger >= 10 && student.cleanliness >= 10 && student.happiness >= 10) {
    student.total_points = s.total_points + elapsed
    student.pet_exp = s.pet_exp + elapsed
  }

  // 重算等级,检测升级/毕业
  const oldLevel = s.pet_level
  student.pet_level = calculateLevel(student.pet_exp)
  const leveledUp = student.pet_level > oldLevel
  const graduated = leveledUp && student.pet_level === 8 && !!student.pet_type

  return { student, leveledUp, graduated }
}

export async function getStudents(): Promise<StudentRow[]> {
  const students = await db.students.orderBy('name').toArray()
  const now = Date.now()
  const updated: StudentRow[] = []
  const badges: BadgeRow[] = []
  for (const s of students) {
    const norm = normalize(s, now)
    const { student, graduated } = applyTimeEffects(norm, now)
    if (graduated && student.pet_type) {
      badges.push({ id: crypto.randomUUID(), student_id: student.id, pet_type: student.pet_type, earned_at: now })
    }
    updated.push(student)
  }
  // 只写回发生变化的行
  const changed = updated.filter((s, i) => {
    const before = students[i]
    return s.hunger !== before.hunger || s.cleanliness !== before.cleanliness ||
      s.happiness !== before.happiness || s.stars !== before.stars ||
      s.last_decay_at !== before.last_decay_at || s.total_points !== before.total_points ||
      s.pet_exp !== before.pet_exp || s.pet_level !== before.pet_level
  })
  if (changed.length > 0) {
    await db.students.bulkPut(changed)
  }
  if (badges.length > 0) {
    await db.badges.bulkAdd(badges)
  }
  return updated
}

export async function addStudent(name: string): Promise<StudentRow> {
  const now = Date.now()
  const s: StudentRow = {
    id: crypto.randomUUID(), name,
    total_points: 0, pet_type: null, pet_name: null, pet_level: 1, pet_exp: 0,
    hunger: 80, cleanliness: 80, happiness: 80, stars: 0, last_decay_at: now,
    created_at: now
  }
  await db.students.add(s)
  return s
}

export async function updateStudent(id: string, name: string): Promise<void> {
  await db.students.update(id, { name })
}

export async function deleteStudent(id: string): Promise<void> {
  await db.transaction('rw', [db.students, db.evaluation_records, db.badges], async () => {
    await db.evaluation_records.where('student_id').equals(id).delete()
    await db.badges.where('student_id').equals(id).delete()
    await db.students.delete(id)
  })
}

export async function updateStudentPet(id: string, petType: string, petName?: string): Promise<void> {
  await db.students.update(id, { pet_type: petType, pet_name: petName?.trim() || null })
}

export async function updateStudentPetName(id: string, petName: string | null): Promise<void> {
  await db.students.update(id, { pet_name: petName?.trim() || null })
}

// 商城购买:校验星星余额,扣星并恢复对应指标(上限 100)
export async function buyShopItem(studentId: string, item: ShopItem): Promise<StudentRow> {
  return db.transaction('rw', [db.students], async () => {
    const s = await db.students.get(studentId)
    if (!s) throw new Error('宝贝不存在')
    const norm = normalize(s, Date.now())
    if (norm.stars < item.price) throw new Error('星星不足')
    const patch: Partial<StudentRow> = { stars: norm.stars - item.price }
    patch[item.target] = Math.min(100, norm[item.target] + item.amount)
    await db.students.update(studentId, patch)
    return { ...norm, ...patch } as StudentRow
  })
}

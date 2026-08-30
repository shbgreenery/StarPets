import { db } from './index'
import type { StudentRow } from './index'
import type { ShopItem } from '@/data/shop'
import { isSleeping } from '@/data/shop'
import { calculateLevel } from '@/data/pets'

// 指标衰减间隔:每 30 分钟
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

// 每个时间步:三指标各降1(下限0)。成长值不再随时间增长,只靠喂养(商城购买)获得
export function applyTimeEffects(s: StudentRow, now = Date.now()): StudentRow {
  const elapsed = Math.floor((now - s.last_decay_at) / DECAY_INTERVAL)
  if (elapsed <= 0) return { ...s }
  return {
    ...s,
    hunger: Math.max(0, s.hunger - elapsed),
    cleanliness: Math.max(0, s.cleanliness - elapsed),
    happiness: Math.max(0, s.happiness - elapsed),
    last_decay_at: s.last_decay_at + elapsed * DECAY_INTERVAL
  }
}

export async function getStudents(): Promise<StudentRow[]> {
  const students = await db.students.orderBy('name').toArray()
  const now = Date.now()
  const updated: StudentRow[] = []
  for (const s of students) {
    updated.push(applyTimeEffects(normalize(s, now), now))
  }
  // 只写回发生变化的行
  const changed = updated.filter((s, i) => {
    const before = students[i]
    return s.hunger !== before.hunger || s.cleanliness !== before.cleanliness ||
      s.happiness !== before.happiness || s.stars !== before.stars ||
      s.last_decay_at !== before.last_decay_at
  })
  if (changed.length > 0) {
    await db.students.bulkPut(changed)
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

export interface BuyResult {
  student: StudentRow
  gainedPoints: number
  leveledUp: boolean
  graduated: boolean
}

// 商城购买:校验星星余额,扣星并恢复对应指标(上限100)。
// 成长状态(三指标都>0)喂养时,成长值(总积分/经验) += 物品加值/5 向下取整;
// 休眠状态(任一指标=0)喂养只恢复指标,不涨成长值
export async function buyShopItem(studentId: string, item: ShopItem): Promise<BuyResult> {
  return db.transaction('rw', [db.students, db.badges], async () => {
    const s = await db.students.get(studentId)
    if (!s) throw new Error('宝贝不存在')
    const norm = normalize(s, Date.now())
    if (norm.stars < item.price) throw new Error('星星不足')

    const patch: Partial<StudentRow> = { stars: norm.stars - item.price }
    patch[item.target] = Math.min(100, norm[item.target] + item.amount)

    let gainedPoints = 0
    let leveledUp = false
    let graduated = false
    // 购买前是否处于成长状态(非休眠)
    if (!isSleeping(norm)) {
      const gain = Math.floor(item.amount / 5)
      gainedPoints = gain
      patch.total_points = norm.total_points + gain
      patch.pet_exp = norm.pet_exp + gain
      patch.pet_level = calculateLevel(norm.pet_exp + gain)
      leveledUp = patch.pet_level > norm.pet_level
      graduated = leveledUp && patch.pet_level === 8 && !!norm.pet_type
      if (graduated) {
        await db.badges.add({ id: crypto.randomUUID(), student_id: studentId, pet_type: norm.pet_type!, earned_at: Date.now() })
      }
    }

    await db.students.update(studentId, patch)
    return { student: { ...norm, ...patch } as StudentRow, gainedPoints, leveledUp, graduated }
  })
}

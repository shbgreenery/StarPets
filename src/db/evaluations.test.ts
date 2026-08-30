import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'
import { addEvaluation, getStudentEvaluations, getEvaluations } from './evaluations'
import { calculateLevel } from '@/data/pets'

let studentId: string

async function createStudentWithPet(exp = 0) {
  studentId = crypto.randomUUID()
  const now = Date.now()
  await db.students.add({
    id: studentId, name: '张三', total_points: exp, pet_type: 'corgi', pet_name: null,
    pet_level: calculateLevel(exp), pet_exp: exp,
    hunger: 80, cleanliness: 80, happiness: 80, stars: 0, last_decay_at: now,
    created_at: now
  })
}

beforeEach(async () => {
  await db.open()
  await clearAll()
  await initDb()
})

describe('addEvaluation', () => {
  it('评价只给星,不涨成长值', async () => {
    await createStudentWithPet(40)
    const res = await addEvaluation({ studentId, points: 3, reason: 'x', category: '学习' })
    expect(res.starsGained).toBe(3)
    const s = await db.students.get(studentId)
    expect(s?.stars).toBe(3)
    expect(s?.total_points).toBe(40)
    expect(s?.pet_exp).toBe(40)
    expect(s?.pet_level).toBe(2)
  })

  it('扣分评价不动成长值也不给星', async () => {
    await createStudentWithPet(50)
    const res = await addEvaluation({ studentId, points: -20, reason: 'x', category: '行为' })
    expect(res.starsGained).toBe(0)
    const s = await db.students.get(studentId)
    expect(s?.total_points).toBe(50)
    expect(s?.pet_exp).toBe(50)
    expect(s?.stars).toBe(0)
  })

  it('无宠物宝贝评价只给星', async () => {
    const sid = crypto.randomUUID()
    const now = Date.now()
    await db.students.add({
      id: sid, name: '李四', total_points: 0, pet_type: null, pet_name: null,
      pet_level: 1, pet_exp: 0,
      hunger: 80, cleanliness: 80, happiness: 80, stars: 0, last_decay_at: now,
      created_at: now
    })
    const res = await addEvaluation({ studentId: sid, points: 1, reason: 'x', category: '学习' })
    expect(res.starsGained).toBe(1)
    expect((await db.students.get(sid))?.stars).toBe(1)
  })
})

describe('星星联动', () => {
  it('加分评价按分值给星', async () => {
    await createStudentWithPet(0)
    await addEvaluation({ studentId, points: 3, reason: 'x', category: '学习' })
    expect((await db.students.get(studentId))?.stars).toBe(3)
  })

  it('扣分评价不给星', async () => {
    await createStudentWithPet(50)
    await addEvaluation({ studentId, points: -20, reason: 'x', category: '行为' })
    expect((await db.students.get(studentId))?.stars).toBe(0)
  })
})

describe('查询', () => {
  it('getStudentEvaluations 返回含 student_name 的记录', async () => {
    await createStudentWithPet(0)
    await addEvaluation({ studentId, points: 10, reason: 'x', category: '学习' })
    const records = await getStudentEvaluations(studentId)
    expect(records).toHaveLength(1)
    expect(records[0].student_name).toBe('张三')
  })

  it('getEvaluations 分页正确', async () => {
    await createStudentWithPet(0)
    for (let i = 0; i < 5; i++) {
      await addEvaluation({ studentId, points: 1, reason: `r${i}`, category: '学习' })
    }
    const page = await getEvaluations(1, 2)
    expect(page.total).toBe(5)
    expect(page.records).toHaveLength(2)
    expect(page.totalPages).toBe(3)
  })
})

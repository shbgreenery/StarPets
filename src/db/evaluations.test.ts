import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'
import { addEvaluation, deleteEvaluation, deleteLatestEvaluation, getStudentEvaluations, getClassEvaluations } from './evaluations'
import { calculateLevel } from '@/data/pets'

let classId: string
let studentId: string

async function createStudentWithPet(exp = 0) {
  const cls = await db.classes.add({ id: crypto.randomUUID(), user_id: 'guest', name: '班', created_at: Date.now(), updated_at: Date.now() })
  classId = cls
  studentId = crypto.randomUUID()
  await db.students.add({ id: studentId, class_id: classId, name: '张三', student_no: null, total_points: exp, pet_type: 'corgi', pet_name: null, pet_level: calculateLevel(exp), pet_exp: exp, created_at: Date.now() })
}

beforeEach(async () => {
  await db.open()
  await clearAll()
  await initDb()
})

describe('addEvaluation', () => {
  it('加分升级：exp 与 total_points 同步，返回 levelUp', async () => {
    await createStudentWithPet(0)
    const res = await addEvaluation({ classId, studentId, points: 40, reason: 'x', category: '学习' })
    expect(res.petLevel).toBe(2)
    expect(res.petExp).toBe(40)
    expect(res.levelUp).toBe(true)
    const s = await db.students.get(studentId)
    expect(s?.total_points).toBe(40)
    expect(s?.pet_exp).toBe(40)
    expect(s?.pet_level).toBe(2)
  })

  it('扣分不升反降', async () => {
    await createStudentWithPet(50)
    const res = await addEvaluation({ classId, studentId, points: -20, reason: 'x', category: '行为' })
    expect(res.levelDown).toBe(true)
    const s = await db.students.get(studentId)
    expect(s?.total_points).toBe(30)
    expect(s?.pet_exp).toBe(30)
  })

  it('达到 8 级发徽章', async () => {
    await createStudentWithPet(690)
    const res = await addEvaluation({ classId, studentId, points: 10, reason: 'x', category: '学习' })
    expect(res.graduated).toBe(true)
    expect(await db.badges.count()).toBe(1)
  })

  it('无宠物学生不返回等级字段', async () => {
    const cls = await db.classes.add({ id: crypto.randomUUID(), user_id: 'guest', name: '班', created_at: Date.now(), updated_at: Date.now() })
    const sid = crypto.randomUUID()
    await db.students.add({ id: sid, class_id: cls, name: '李四', student_no: null, total_points: 0, pet_type: null, pet_name: null, pet_level: 1, pet_exp: 0, created_at: Date.now() })
    const res = await addEvaluation({ classId: cls, studentId: sid, points: 1, reason: 'x', category: '学习' })
    expect(res.petLevel).toBeUndefined()
  })
})

describe('撤回', () => {
  it('deleteLatestEvaluation 撤回加分并回滚经验', async () => {
    await createStudentWithPet(0)
    await addEvaluation({ classId, studentId, points: 40, reason: 'x', category: '学习' })
    const res = await deleteLatestEvaluation(classId)
    expect(res.success).toBe(true)
    expect(res.undone.student_name).toBe('张三')
    const s = await db.students.get(studentId)
    expect(s?.total_points).toBe(0)
    expect(s?.pet_exp).toBe(0)
    expect(s?.pet_level).toBe(1)
  })

  it('deleteEvaluation 撤回指定记录', async () => {
    await createStudentWithPet(0)
    const r = await addEvaluation({ classId, studentId, points: 10, reason: 'x', category: '学习' })
    await deleteEvaluation(r.id)
    expect(await db.evaluation_records.count()).toBe(0)
  })
})

describe('查询', () => {
  it('getStudentEvaluations 返回含 student_name 的记录', async () => {
    await createStudentWithPet(0)
    await addEvaluation({ classId, studentId, points: 10, reason: 'x', category: '学习' })
    const records = await getStudentEvaluations(studentId)
    expect(records).toHaveLength(1)
    expect(records[0].student_name).toBe('张三')
  })

  it('getClassEvaluations 分页正确', async () => {
    await createStudentWithPet(0)
    for (let i = 0; i < 5; i++) {
      await addEvaluation({ classId, studentId, points: 1, reason: `r${i}`, category: '学习' })
    }
    const page = await getClassEvaluations(classId, 1, 2)
    expect(page.total).toBe(5)
    expect(page.records).toHaveLength(2)
    expect(page.totalPages).toBe(3)
  })
})

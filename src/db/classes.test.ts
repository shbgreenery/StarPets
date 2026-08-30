import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'
import { getStudents, addStudent, deleteStudent, updateStudentPet, updateStudentPetName } from './classes'

beforeEach(async () => {
  await db.open()
  await clearAll()
  await initDb()
})

describe('宝贝', () => {
  it('添加宝贝默认字段正确', async () => {
    const s = await addStudent('张三')
    expect(s.name).toBe('张三')
    expect(s.total_points).toBe(0)
    expect(s.pet_level).toBe(1)
    expect(s.pet_exp).toBe(0)
  })

  it('getStudents 按名字排序', async () => {
    await addStudent('李四')
    await addStudent('张三')
    const students = await getStudents()
    expect(students.map(s => s.name)).toEqual(['张三', '李四'])
  })

  it('删除宝贝级联删除评价记录', async () => {
    const s = await addStudent('张三')
    await db.evaluation_records.add({ id: 'r1', student_id: s.id, points: 1, reason: 'x', category: '学习', timestamp: Date.now() })
    await deleteStudent(s.id)
    expect(await db.evaluation_records.count()).toBe(0)
  })

  it('换宠物保留等级经验', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { total_points: 50, pet_exp: 50, pet_level: 2, pet_type: 'corgi' })
    await updateStudentPet(s.id, 'bichon', '小白')
    const updated = await db.students.get(s.id)
    expect(updated?.pet_type).toBe('bichon')
    expect(updated?.pet_name).toBe('小白')
    expect(updated?.pet_exp).toBe(50)
    expect(updated?.pet_level).toBe(2)
  })

  it('改宠物名', async () => {
    const s = await addStudent('张三')
    await updateStudentPetName(s.id, '旺财')
    expect((await db.students.get(s.id))?.pet_name).toBe('旺财')
  })
})

import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'
import { getClasses, createClass, updateClass, deleteClass, getStudents, addStudent, deleteStudent, importStudents, updateStudentPet, updateStudentPetName } from './classes'

let classId: string

beforeEach(async () => {
  await db.open()
  await clearAll()
  await initDb()
  const cls = await createClass('测试班级')
  classId = cls.id
})

describe('班级', () => {
  it('创建并获取班级', async () => {
    const classes = await getClasses()
    expect(classes).toHaveLength(1)
    expect(classes[0].name).toBe('测试班级')
  })

  it('更新班级名称', async () => {
    await updateClass(classId, '新名字')
    const classes = await getClasses()
    expect(classes[0].name).toBe('新名字')
  })

  it('删除班级级联删除学生', async () => {
    await addStudent(classId, '张三', null)
    await deleteClass(classId)
    expect(await db.classes.count()).toBe(0)
    expect(await db.students.count()).toBe(0)
  })
})

describe('学生', () => {
  it('添加学生默认字段正确', async () => {
    const s = await addStudent(classId, '张三', '001')
    expect(s.name).toBe('张三')
    expect(s.student_no).toBe('001')
    expect(s.total_points).toBe(0)
    expect(s.pet_level).toBe(1)
    expect(s.pet_exp).toBe(0)
  })

  it('getStudents 按名字排序', async () => {
    await addStudent(classId, '李四', null)
    await addStudent(classId, '张三', null)
    const students = await getStudents(classId)
    expect(students.map(s => s.name)).toEqual(['张三', '李四'])
  })

  it('批量导入跳过空名字', async () => {
    const res = await importStudents(classId, [
      { name: ' 王五 ', studentNo: ' 003 ' },
      { name: '   ', studentNo: '' },
      { name: '赵六', studentNo: '' }
    ])
    expect(res.imported).toBe(2)
    const students = await getStudents(classId)
    expect(students).toHaveLength(2)
    expect(students.find(s => s.name === '王五')?.student_no).toBe('003')
  })

  it('删除学生级联删除评价记录', async () => {
    const s = await addStudent(classId, '张三', null)
    await db.evaluation_records.add({ id: 'r1', class_id: classId, student_id: s.id, points: 1, reason: 'x', category: '学习', timestamp: Date.now() })
    await deleteStudent(s.id)
    expect(await db.evaluation_records.count()).toBe(0)
  })

  it('换宠物保留等级经验', async () => {
    const s = await addStudent(classId, '张三', null)
    await db.students.update(s.id, { total_points: 50, pet_exp: 50, pet_level: 2, pet_type: 'corgi' })
    await updateStudentPet(s.id, 'bichon', '小白')
    const updated = await db.students.get(s.id)
    expect(updated?.pet_type).toBe('bichon')
    expect(updated?.pet_name).toBe('小白')
    expect(updated?.pet_exp).toBe(50)
    expect(updated?.pet_level).toBe(2)
  })

  it('改宠物名', async () => {
    const s = await addStudent(classId, '张三', null)
    await updateStudentPetName(s.id, '旺财')
    expect((await db.students.get(s.id))?.pet_name).toBe('旺财')
  })
})

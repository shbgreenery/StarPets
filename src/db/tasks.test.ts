import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'
import { createTask, getTasks, completeTask, deleteTask } from './tasks'

beforeEach(async () => {
  await db.open()
  await clearAll()
  await initDb()
})

describe('任务成就系统', () => {
  it('创建任务', async () => {
    // 先添加一个学生
    const studentId = 'test-student'
    await db.students.add({
      id: studentId, name: '测试', total_points: 0, pet_type: null, pet_name: null,
      pet_level: 1, pet_exp: 0, hunger: 80, cleanliness: 80, happiness: 80,
      stars: 0, last_decay_at: Date.now(), deco_bg: null, deco_fx: null,
      deco_pendants: [], deco_owned: [], created_at: Date.now()
    })

    const task = await createTask(studentId, '收拾玩具')
    expect(task.name).toBe('收拾玩具')
    expect(task.student_id).toBe(studentId)
    expect(task.current_streak).toBe(0)
    expect(task.max_streak).toBe(0)
    expect(task.total_days).toBe(0)
    expect(task.achievements).toBe('[]')
  })

  it('完成任务累加连续天数', async () => {
    const studentId = 'test-student'
    await db.students.add({
      id: studentId, name: '测试', total_points: 0, pet_type: null, pet_name: null,
      pet_level: 1, pet_exp: 0, hunger: 80, cleanliness: 80, happiness: 80,
      stars: 0, last_decay_at: Date.now(), deco_bg: null, deco_fx: null,
      deco_pendants: [], deco_owned: [], created_at: Date.now()
    })

    const task = await createTask(studentId, '收拾玩具')

    // 第一次完成
    const result1 = await completeTask(task.id)
    expect(result1.task.current_streak).toBe(1)
    expect(result1.task.total_days).toBe(1)
    expect(result1.starBonus).toBe(1) // 基础 1 星

    // 修改最后完成日期为昨天，模拟连续
    const yesterday = new Date(Date.now() - 86400000)
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    await db.tasks.update(task.id, { last_completed_date: yesterdayStr, current_streak: 1 })

    // 第二次完成（连续）
    const result2 = await completeTask(task.id)
    expect(result2.task.current_streak).toBe(2)
    expect(result2.task.total_days).toBe(2)
  })

  it('3 天达成成就奖励 5 星', async () => {
    const studentId = 'test-student'
    await db.students.add({
      id: studentId, name: '测试', total_points: 0, pet_type: null, pet_name: null,
      pet_level: 1, pet_exp: 0, hunger: 80, cleanliness: 80, happiness: 80,
      stars: 0, last_decay_at: Date.now(), deco_bg: null, deco_fx: null,
      deco_pendants: [], deco_owned: [], created_at: Date.now()
    })

    const task = await createTask(studentId, '收拾玩具')

    // 模拟连续 2 天: last_completed_date 设为昨天, current_streak=2
    const yesterday = new Date(Date.now() - 86400000)
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    await db.tasks.update(task.id, {
      last_completed_date: yesterdayStr,
      current_streak: 2,
      max_streak: 2,
      total_days: 2
    })

    // 第 3 天完成
    const result = await completeTask(task.id)
    expect(result.task.current_streak).toBe(3)
    expect(result.achieved).toContain('3')
    expect(result.achievementStarBonus).toBe(5) // 5 星成就奖励

    // 验证星星已加到学生
    const student = await db.students.get(studentId)
    expect(student?.stars).toBe(1 + 5) // 基础 1 星 + 成就 5 星
  })

  it('删除任务', async () => {
    const studentId = 'test-student'
    await db.students.add({
      id: studentId, name: '测试', total_points: 0, pet_type: null, pet_name: null,
      pet_level: 1, pet_exp: 0, hunger: 80, cleanliness: 80, happiness: 80,
      stars: 0, last_decay_at: Date.now(), deco_bg: null, deco_fx: null,
      deco_pendants: [], deco_owned: [], created_at: Date.now()
    })

    const task = await createTask(studentId, '收拾玩具')
    expect((await getTasks()).length).toBe(1)

    await deleteTask(task.id)
    expect((await getTasks()).length).toBe(0)
  })
})
import { db } from './index'
import type { TaskRow } from './index'

// 成就里程碑
const ACHIEVEMENT_MILESTONES = [3, 7, 15, 21]

export interface Task extends TaskRow {
  // 扩展字段
  student_name?: string
}

export interface CompleteTaskResult {
  task: TaskRow
  starBonus: number
  achieved: string[]
  achievementStarBonus: number
}

// 获取所有任务，关联学生姓名
export async function getTasks(): Promise<Task[]> {
  const tasks = await db.tasks.orderBy('created_at').toArray()
  const students = await db.students.toArray()
  const nameMap = new Map(students.map(s => [s.id, s.name]))
  return tasks.map(t => ({ ...t, student_name: nameMap.get(t.student_id) || '' }))
}

// 获取某学生的任务
export async function getStudentTasks(studentId: string): Promise<TaskRow[]> {
  return db.tasks.where('student_id').equals(studentId).toArray()
}

// 创建任务
export async function createTask(studentId: string, name: string): Promise<TaskRow> {
  const task: TaskRow = {
    id: crypto.randomUUID(),
    student_id: studentId,
    name: name.trim(),
    current_streak: 0,
    max_streak: 0,
    total_days: 0,
    last_completed_date: '',
    achievements: '[]',
    created_at: Date.now()
  }
  await db.tasks.add(task)
  return task
}

// 删除任务
export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id)
}

// 检测成就
function checkAchievements(streak: number, existing: string[]): string[] {
  const achieved: string[] = []
  for (const milestone of ACHIEVEMENT_MILESTONES) {
    const key = String(milestone)
    if (streak >= milestone && !existing.includes(key)) {
      achieved.push(key)
    }
  }
  return achieved
}

// 确认完成任务
export async function completeTask(taskId: string): Promise<CompleteTaskResult> {
  return db.transaction('rw', [db.tasks, db.students], async () => {
    const task = await db.tasks.get(taskId)
    if (!task) throw new Error('任务不存在')

    const today = new Date()
    const todayStr = formatDate(today)
    const yesterdayStr = formatDate(new Date(today.getTime() - 86400000))

    let currentStreak = task.current_streak
    let totalDays = task.total_days
    let existingAchievements: string[] = JSON.parse(task.achievements || '[]')

    // 判断是否已连续
    if (task.last_completed_date === todayStr) {
      // 今天已经完成过，不重复计数
      return {
        task,
        starBonus: 0,
        achieved: [],
        achievementStarBonus: 0
      }
    }

    if (task.last_completed_date === yesterdayStr) {
      // 昨天也完成了，连续天数+1
      currentStreak += 1
    } else if (task.last_completed_date === '') {
      // 第一次完成
      currentStreak = 1
    } else {
      // 断签了，重置
      currentStreak = 1
    }

    totalDays += 1

    // 检测是否达成新成就
    const achieved = checkAchievements(currentStreak, existingAchievements)
    let achievementStarBonus = 0
    if (achieved.length > 0) {
      existingAchievements = [...existingAchievements, ...achieved]
      achievementStarBonus = achieved.length * 5 // 每个成就 5 星
    }

    // 更新最大连续天数
    const maxStreak = Math.max(task.max_streak, currentStreak)

    // 给星星：常规完成 1 星 + 成就奖励
    const starBonus = 1 + achievementStarBonus

    const patch: Partial<TaskRow> = {
      current_streak: currentStreak,
      max_streak: maxStreak,
      total_days: totalDays,
      last_completed_date: todayStr,
      achievements: JSON.stringify(existingAchievements)
    }

    await db.tasks.update(taskId, patch)

    // 给学生的星星余额加星
    const student = await db.students.get(task.student_id)
    if (student) {
      await db.students.update(task.student_id, {
        stars: (student.stars ?? 0) + starBonus
      })
    }

    const updated = { ...task, ...patch }
    return { task: updated, starBonus, achieved, achievementStarBonus }
  })
}

// 格式化日期为 YYYY-MM-DD
function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
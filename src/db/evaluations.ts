import { db } from './index'
import type { EvaluationRecordRow } from './index'

export interface AddEvaluationInput {
  studentId: string
  points: number
  reason: string
  category: string
}

// 评价只给星星,不涨成长值(成长值随时间为半小时 +1,在 getStudents 时惰性计算)
export async function addEvaluation(input: AddEvaluationInput) {
  const id = crypto.randomUUID()
  const now = Date.now()

  return db.transaction('rw', [db.evaluation_records, db.students], async () => {
    await db.evaluation_records.add({
      id, student_id: input.studentId,
      points: input.points, reason: input.reason, category: input.category, timestamp: now
    })

    const student = await db.students.get(input.studentId)
    if (!student) return { id, timestamp: now, starsGained: 0 }

    const starGain = input.points > 0 ? input.points : 0
    await db.students.update(input.studentId, {
      stars: (student.stars ?? 0) + starGain
    })

    return { id, timestamp: now, starsGained: starGain }
  })
}

export async function getStudentEvaluations(studentId: string, pageSize = 20): Promise<Array<EvaluationRecordRow & { student_name: string }>> {
  const student = await db.students.get(studentId)
  const records = await db.evaluation_records.where('student_id').equals(studentId)
    .reverse().sortBy('timestamp')
  return records.slice(0, pageSize).map(r => ({ ...r, student_name: student?.name || '' }))
}

export async function getEvaluations(page: number, pageSize: number) {
  const all = await db.evaluation_records.toArray()
  const total = all.length
  const sorted = all.sort((a, b) => b.timestamp - a.timestamp)
  const offset = (page - 1) * pageSize
  const students = await db.students.toArray()
  const nameMap = new Map(students.map(s => [s.id, s.name]))
  const records = sorted.slice(offset, offset + pageSize).map(r => ({ ...r, student_name: nameMap.get(r.student_id) || '' }))
  return { records, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// 获取指定时间之后的评价记录（用于光荣榜等场景）
export async function getEvaluationsSince(timestamp: number) {
  return db.evaluation_records.where('timestamp').aboveOrEqual(timestamp).toArray()
}

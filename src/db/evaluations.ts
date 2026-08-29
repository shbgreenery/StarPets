import { db } from './index'
import type { EvaluationRecordRow } from './index'
import { calculateLevel } from '@/data/pets'

export interface AddEvaluationInput {
  classId: string
  studentId: string
  points: number
  reason: string
  category: string
}

export async function addEvaluation(input: AddEvaluationInput) {
  const id = crypto.randomUUID()
  const now = Date.now()

  return db.transaction('rw', [db.evaluation_records, db.students, db.badges], async () => {
    await db.evaluation_records.add({
      id, class_id: input.classId, student_id: input.studentId,
      points: input.points, reason: input.reason, category: input.category, timestamp: now
    })

    const student = await db.students.get(input.studentId)
    if (!student) return { id, timestamp: now }

    const newTotalPoints = student.total_points + input.points
    await db.students.update(input.studentId, { total_points: newTotalPoints })

    if (student.pet_type) {
      const newExp = Math.max(0, newTotalPoints)
      const newLevel = calculateLevel(newExp)
      let graduated = false
      if (newLevel === 8 && student.pet_level < 8) {
        await db.badges.add({ id: crypto.randomUUID(), student_id: input.studentId, pet_type: student.pet_type, earned_at: now })
        graduated = true
      }
      await db.students.update(input.studentId, { pet_exp: newExp, pet_level: newLevel })
      return {
        id, timestamp: now, petLevel: newLevel, petExp: newExp,
        levelUp: newLevel > student.pet_level, levelDown: newLevel < student.pet_level, graduated
      }
    }

    return { id, timestamp: now }
  })
}

export async function getStudentEvaluations(studentId: string, pageSize = 20): Promise<Array<EvaluationRecordRow & { student_name: string }>> {
  const student = await db.students.get(studentId)
  const records = await db.evaluation_records.where('student_id').equals(studentId)
    .reverse().sortBy('timestamp')
  return records.slice(0, pageSize).map(r => ({ ...r, student_name: student?.name || '' }))
}

export async function getClassEvaluations(classId: string, page: number, pageSize: number) {
  const all = await db.evaluation_records.where('class_id').equals(classId).toArray()
  const total = all.length
  const sorted = all.sort((a, b) => b.timestamp - a.timestamp)
  const offset = (page - 1) * pageSize
  const students = await db.students.where('class_id').equals(classId).toArray()
  const nameMap = new Map(students.map(s => [s.id, s.name]))
  const records = sorted.slice(offset, offset + pageSize).map(r => ({ ...r, student_name: nameMap.get(r.student_id) || '' }))
  return { records, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

async function undoRecord(record: EvaluationRecordRow): Promise<{ success: true; undone: EvaluationRecordRow & { student_name: string } }> {
  const student = await db.students.get(record.student_id)
  return db.transaction('rw', [db.students, db.evaluation_records], async () => {
    const expChange = Math.abs(record.points)
    const newExp = Math.max(0, (student?.pet_exp ?? 0) - expChange)
    const newLevel = calculateLevel(newExp)
    if (student) {
      await db.students.update(student.id, {
        total_points: student.total_points - record.points,
        pet_exp: newExp,
        pet_level: newLevel
      })
    }
    await db.evaluation_records.delete(record.id)
    return { success: true, undone: { ...record, student_name: student?.name || '' } }
  })
}

export async function deleteEvaluation(id: string) {
  const record = await db.evaluation_records.get(id)
  if (!record) throw new Error('Record not found')
  return undoRecord(record)
}

export async function deleteLatestEvaluation(classId: string) {
  const records = await db.evaluation_records.where('class_id').equals(classId).toArray()
  const latest = records.sort((a, b) => b.timestamp - a.timestamp)[0]
  if (!latest) throw new Error('No record found')
  return undoRecord(latest)
}

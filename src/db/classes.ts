import { db } from './index'
import type { ClassRow, StudentRow } from './index'

export async function getClasses(): Promise<ClassRow[]> {
  return db.classes.orderBy('created_at').reverse().toArray()
}

export async function createClass(name: string): Promise<ClassRow> {
  const now = Date.now()
  const cls: ClassRow = { id: crypto.randomUUID(), user_id: 'guest', name, created_at: now, updated_at: now }
  await db.classes.add(cls)
  return cls
}

export async function updateClass(id: string, name: string): Promise<void> {
  await db.classes.update(id, { name, updated_at: Date.now() })
}

export async function deleteClass(id: string): Promise<void> {
  const studentIds = (await db.students.where('class_id').equals(id).toArray()).map(s => s.id)
  await db.transaction('rw', [db.classes, db.students, db.evaluation_records, db.badges], async () => {
    await db.badges.where('student_id').anyOf(studentIds).delete()
    await db.evaluation_records.where('class_id').equals(id).delete()
    await db.students.where('class_id').equals(id).delete()
    await db.classes.delete(id)
  })
}

export async function getStudents(classId: string): Promise<StudentRow[]> {
  return db.students.where('class_id').equals(classId).sortBy('name')
}

export async function addStudent(classId: string, name: string, studentNo: string | null): Promise<StudentRow> {
  const s: StudentRow = {
    id: crypto.randomUUID(), class_id: classId, name, student_no: studentNo || null,
    total_points: 0, pet_type: null, pet_name: null, pet_level: 1, pet_exp: 0, created_at: Date.now()
  }
  await db.students.add(s)
  return s
}

export async function updateStudent(id: string, name: string, studentNo: string | null): Promise<void> {
  await db.students.update(id, { name, student_no: studentNo || null })
}

export async function deleteStudent(id: string): Promise<void> {
  await db.transaction('rw', [db.students, db.evaluation_records, db.badges], async () => {
    await db.evaluation_records.where('student_id').equals(id).delete()
    await db.badges.where('student_id').equals(id).delete()
    await db.students.delete(id)
  })
}

export async function importStudents(classId: string, list: { name: string; studentNo: string }[]): Promise<{ imported: number }> {
  const now = Date.now()
  const rows: StudentRow[] = []
  for (const s of list) {
    const name = s.name?.trim()
    if (!name) continue
    rows.push({
      id: crypto.randomUUID(), class_id: classId, name,
      student_no: s.studentNo?.trim() || null,
      total_points: 0, pet_type: null, pet_name: null, pet_level: 1, pet_exp: 0, created_at: now
    })
  }
  await db.students.bulkAdd(rows)
  return { imported: rows.length }
}

export async function updateStudentPet(id: string, petType: string, petName?: string): Promise<void> {
  await db.students.update(id, { pet_type: petType, pet_name: petName?.trim() || null })
}

export async function updateStudentPetName(id: string, petName: string | null): Promise<void> {
  await db.students.update(id, { pet_name: petName?.trim() || null })
}

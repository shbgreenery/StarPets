import { db } from './index'
import type { StudentRow } from './index'

export async function getStudents(): Promise<StudentRow[]> {
  return db.students.orderBy('name').toArray()
}

export async function addStudent(name: string): Promise<StudentRow> {
  const s: StudentRow = {
    id: crypto.randomUUID(), name,
    total_points: 0, pet_type: null, pet_name: null, pet_level: 1, pet_exp: 0, created_at: Date.now()
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

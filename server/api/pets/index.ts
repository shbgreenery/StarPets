import { useDB } from '../../utils/db'
import { ok, fail } from '../../utils/response'
import { decayAll, statCap } from '../../utils/decay'

interface PetRow {
  id: number
  name: string
  species: string
  level: number
  exp: number
  satiety: number
  cleanliness: number
  happiness: number
  frozen_at: string | null
  last_decay_at: string | null
  onboarded: number
  created_at: string
  updated_at: string
}

export default defineEventHandler(async (event) => {
  const db = useDB()

  if (event.method === 'GET') {
    decayAll(db) // 惰性衰减：返回实时扣减后的值
    const pets = db.prepare('SELECT * FROM pet ORDER BY id').all() as PetRow[]
    return ok(pets.map((p) => ({ ...p, cap: statCap(p.level) })))
  }

  if (event.method === 'POST') {
    const body = await readBody(event)
    if (!body?.name || !body?.species) {
      return fail(event, 400, 'name 与 species 必填')
    }
    const result = db
      .prepare('INSERT INTO pet (name, species, last_decay_at) VALUES (?, ?, ?)')
      .run(body.name, body.species, new Date().toISOString())
    const pet = db.prepare('SELECT * FROM pet WHERE id = ?').get(Number(result.lastInsertRowid)) as PetRow
    return ok({ ...pet, cap: statCap(pet.level) })
  }

  return fail(event, 405, 'Method not allowed')
})

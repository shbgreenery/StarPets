import type { DatabaseSync } from 'node:sqlite'

const HALF_HOUR_MS = 30 * 60 * 1000

/** 三维上限：基础 100 点，每级 +10（dec-003） */
export function statCap(level: number): number {
  return 100 + (level - 1) * 10
}

/** 每半小时衰减量：基础 1，每 5 级 +1（dec-003） */
function decayPerHalfHour(level: number): number {
  return 1 + Math.floor((level - 1) / 5)
}

interface PetRow {
  id: number
  satiety: number
  cleanliness: number
  happiness: number
  exp: number
  level: number
  frozen_at: string | null
  last_decay_at: string | null
}

/** 惰性衰减所有宠物（on-read 调用，返回实时扣减后的值） */
export function decayAll(db: DatabaseSync): number {
  const now = Date.now()
  const pets = db.prepare('SELECT * FROM pet').all() as PetRow[]
  let count = 0
  for (const pet of pets) {
    if (decayPet(db, pet, now)) count++
  }
  return count
}

function decayPet(db: DatabaseSync, pet: PetRow, now: number): boolean {
  const lastAt = pet.last_decay_at ? new Date(pet.last_decay_at).getTime() : now
  const elapsed = now - lastAt
  const halfHours = Math.floor(elapsed / HALF_HOUR_MS)
  if (halfHours <= 0) return false

  const per = decayPerHalfHour(pet.level)

  let satiety = pet.satiety
  let cleanliness = pet.cleanliness
  let happiness = pet.happiness
  let exp = pet.exp

  // 逐半小时推进：衰减 + 成长值实时累计（冬眠后停止累计）
  for (let i = 0; i < halfHours; i++) {
    satiety = Math.max(0, satiety - per)
    cleanliness = Math.max(0, cleanliness - per)
    happiness = Math.max(0, happiness - per)

    if (satiety <= 0 && cleanliness <= 0 && happiness <= 0) break
    exp += 1 // 每半小时 +1 成长值
  }

  // 升级：所需经验 = 等级 × 20，可连升
  let level = pet.level
  while (exp >= level * 20) {
    exp -= level * 20
    level += 1
  }

  // 冬眠：三维全 0
  const frozen = satiety <= 0 && cleanliness <= 0 && happiness <= 0
  const frozenAt = frozen ? (pet.frozen_at ?? new Date(now).toISOString()) : null

  // 保留不足半小时的零头，避免吞时间
  const newLastAt = new Date(lastAt + halfHours * HALF_HOUR_MS).toISOString()

  db.prepare(
    `UPDATE pet SET satiety = ?, cleanliness = ?, happiness = ?, exp = ?, level = ?, frozen_at = ?, last_decay_at = ? WHERE id = ?`,
  ).run(satiety, cleanliness, happiness, exp, level, frozenAt, newLastAt, pet.id)

  return true
}

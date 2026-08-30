import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'
import { getStudents, addStudent, deleteStudent, updateStudentPet, updateStudentPetName, buyShopItem } from './classes'
import { SHOP_ITEMS } from '@/data/shop'

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
    expect(s.hunger).toBe(80)
    expect(s.cleanliness).toBe(80)
    expect(s.happiness).toBe(80)
    expect(s.stars).toBe(0)
    expect(s.last_decay_at).toEqual(expect.any(Number))
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

describe('指标衰减', () => {
  it('30分钟内不衰减', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { last_decay_at: Date.now() - 5 * 60 * 1000 })
    const [st] = await getStudents()
    expect(st.hunger).toBe(80)
    expect(st.cleanliness).toBe(80)
    expect(st.happiness).toBe(80)
  })

  it('每30分钟各降1', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { last_decay_at: Date.now() - 31 * 60 * 1000 })
    const [st] = await getStudents()
    expect(st.hunger).toBe(79)
    expect(st.cleanliness).toBe(79)
    expect(st.happiness).toBe(79)
  })

  it('累计多个30分钟', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { last_decay_at: Date.now() - 62 * 60 * 1000 })
    const [st] = await getStudents()
    expect(st.hunger).toBe(78)
  })

  it('衰减下限为0', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { hunger: 1, last_decay_at: Date.now() - 62 * 60 * 1000 })
    const [st] = await getStudents()
    expect(st.hunger).toBe(0)
  })

  it('last_decay_at 按衰减步推进', async () => {
    const s = await addStudent('张三')
    const old = Date.now() - 31 * 60 * 1000
    await db.students.update(s.id, { last_decay_at: old })
    const [st] = await getStudents()
    expect(st.last_decay_at).toBe(old + 30 * 60 * 1000)
  })
})

describe('成长值时间增长', () => {
  it('三指标≥10 时每30分钟成长值+1', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { last_decay_at: Date.now() - 31 * 60 * 1000 })
    const [st] = await getStudents()
    expect(st.total_points).toBe(1)
    expect(st.pet_exp).toBe(1)
  })

  it('三指标任一<10 不涨成长值但指标照常衰减', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { hunger: 9, last_decay_at: Date.now() - 31 * 60 * 1000 })
    const [st] = await getStudents()
    expect(st.total_points).toBe(0)
    expect(st.pet_exp).toBe(0)
    expect(st.hunger).toBe(8)
  })

  it('指标为0休眠不涨成长值', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { happiness: 0, last_decay_at: Date.now() - 31 * 60 * 1000 })
    const [st] = await getStudents()
    expect(st.total_points).toBe(0)
    expect(st.pet_exp).toBe(0)
    expect(st.happiness).toBe(0)
  })

  it('购买补给解除休眠后恢复增长', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { happiness: 0, stars: 10 })
    await buyShopItem(s.id, SHOP_ITEMS.find(i => i.id === 'bear')!)
    await db.students.update(s.id, { last_decay_at: Date.now() - 31 * 60 * 1000 })
    const [st] = await getStudents()
    expect(st.happiness).toBe(29)
    expect(st.total_points).toBe(1)
  })

  it('成长值跨过8级阈值触发毕业徽章', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { pet_type: 'corgi', total_points: 699, pet_exp: 699, pet_level: 7 })
    await db.students.update(s.id, { last_decay_at: Date.now() - 31 * 60 * 1000 })
    await getStudents()
    expect(await db.badges.count()).toBe(1)
  })
})

describe('商城购买', () => {
  const chicken = SHOP_ITEMS.find(i => i.id === 'chicken')!

  it('购买成功扣星加指标', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 10, hunger: 50 })
    await buyShopItem(s.id, chicken)
    const st = await db.students.get(s.id)
    expect(st?.stars).toBe(0)
    expect(st?.hunger).toBe(80)
  })

  it('指标上限100', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 10, hunger: 90 })
    await buyShopItem(s.id, chicken)
    expect((await db.students.get(s.id))?.hunger).toBe(100)
  })

  it('星星不足拒绝购买', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 5 })
    await expect(buyShopItem(s.id, chicken)).rejects.toThrow('星星不足')
  })
})

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

  it('时间不再涨成长值', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { total_points: 10, pet_exp: 10, last_decay_at: Date.now() - 62 * 60 * 1000 })
    const [st] = await getStudents()
    expect(st.hunger).toBe(78)
    expect(st.total_points).toBe(10)
    expect(st.pet_exp).toBe(10)
    expect(st.pet_level).toBe(1)
  })
})

describe('成长值喂养规则', () => {
  const chicken = SHOP_ITEMS.find(i => i.id === 'chicken')!
  const apple = SHOP_ITEMS.find(i => i.id === 'apple')!

  it('成长状态喂养按物品加值/5加成长值(向下取整)', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 20, hunger: 50 })
    const res = await buyShopItem(s.id, chicken) // +30 饥饿 → 30/5=6
    expect(res.student.total_points).toBe(6)
    expect(res.student.pet_exp).toBe(6)
    expect(res.student.hunger).toBe(80)
    expect(res.student.stars).toBe(10)
    expect(res.leveledUp).toBe(false)
  })

  it('小件加值15 → 成长值+3', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 20, hunger: 50 })
    const res = await buyShopItem(s.id, apple)
    expect(res.student.total_points).toBe(3)
    expect(res.student.hunger).toBe(65)
  })

  it('休眠状态喂养只恢复指标不涨成长值', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { happiness: 0, stars: 20, hunger: 50 })
    const res = await buyShopItem(s.id, chicken) // 快乐=0 处于休眠,买食物
    expect(res.student.hunger).toBe(80) // 指标照常恢复
    expect(res.student.total_points).toBe(0)
    expect(res.student.pet_exp).toBe(0)
    expect(res.leveledUp).toBe(false)
  })

  it('休眠购买恢复后再次喂养涨成长值', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { happiness: 0, stars: 30 })
    const bear = SHOP_ITEMS.find(i => i.id === 'bear')!
    await buyShopItem(s.id, bear) // +30 快乐解除休眠,但休眠时不涨
    let st = await db.students.get(s.id)
    expect(st?.happiness).toBe(30)
    expect(st?.total_points).toBe(0)
    await buyShopItem(s.id, chicken) // 已非休眠,涨
    st = await db.students.get(s.id)
    expect(st?.total_points).toBe(6)
  })

  it('喂养升级但未毕业不触发徽章', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { pet_type: 'corgi', total_points: 94, pet_exp: 94, pet_level: 2, stars: 20 })
    const res = await buyShopItem(s.id, chicken) // 94+6=100 → 3级
    expect(res.leveledUp).toBe(true)
    expect(res.graduated).toBe(false)
    expect(res.student.pet_level).toBe(3)
    expect(await db.badges.count()).toBe(0)
  })

  it('喂养跨过8级阈值触发毕业徽章', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { pet_type: 'corgi', total_points: 694, pet_exp: 694, pet_level: 7, stars: 20 })
    const res = await buyShopItem(s.id, chicken) // 694+6=700 → 8级毕业
    expect(res.leveledUp).toBe(true)
    expect(res.graduated).toBe(true)
    expect(res.student.pet_level).toBe(8)
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

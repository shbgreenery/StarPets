import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'
import { getStudents, addStudent, deleteStudent, updateStudentPet, updateStudentPetName, buyShopItem, buyDecoration, wearDecoration, takeOffDecoration } from './classes'
import { SHOP_ITEMS } from '@/data/shop'
import { DECOR_ITEMS } from '@/data/decorations'

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
    expect(s.deco_bg).toBeNull()
    expect(s.deco_fx).toBeNull()
    expect(s.deco_pendants).toEqual([])
    expect(s.deco_owned).toEqual([])
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

describe('装扮装饰', () => {
  const forest = DECOR_ITEMS.find(i => i.id === 'bg-forest')!
  const ocean = DECOR_ITEMS.find(i => i.id === 'bg-ocean')!
  const crown = DECOR_ITEMS.find(i => i.id === 'pendant-crown')!
  const star = DECOR_ITEMS.find(i => i.id === 'pendant-star')!
  const bow = DECOR_ITEMS.find(i => i.id === 'pendant-bow')!
  const balloon = DECOR_ITEMS.find(i => i.id === 'pendant-balloon')!
  const snow = DECOR_ITEMS.find(i => i.id === 'fx-snow')!
  const fireflies = DECOR_ITEMS.find(i => i.id === 'fx-fireflies')!

  it('买背景:扣星、加入拥有、自动戴上、不涨成长值', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 30, total_points: 10, pet_exp: 10, pet_level: 2 })
    const res = await buyDecoration(s.id, forest)
    expect(res.stars).toBe(10)
    expect(res.deco_bg).toBe('bg-forest')
    expect(res.deco_owned).toContain('bg-forest')
    expect(res.total_points).toBe(10)
    expect(res.pet_exp).toBe(10)
    expect(res.pet_level).toBe(2)
  })

  it('买挂饰:加入拥有并自动戴上', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 30 })
    await buyDecoration(s.id, crown)
    const st = await db.students.get(s.id)
    expect(st?.deco_pendants).toEqual(['pendant-crown'])
    expect(st?.deco_owned).toContain('pendant-crown')
    expect(st?.stars).toBe(10)
  })

  it('买新背景覆盖旧背景槽位,拥有不变', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 40 })
    await buyDecoration(s.id, forest)
    await buyDecoration(s.id, ocean)
    const st = await db.students.get(s.id)
    expect(st?.deco_bg).toBe('bg-ocean')
    expect(st?.deco_owned).toEqual(['bg-forest', 'bg-ocean'])
  })

  it('挂饰最多同时戴 3 个:第 4 件只收藏不自动戴', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 100 })
    await buyDecoration(s.id, crown)
    await buyDecoration(s.id, star)
    await buyDecoration(s.id, bow)
    await buyDecoration(s.id, balloon)
    const st = await db.students.get(s.id)
    expect(st?.deco_pendants).toHaveLength(3)
    expect(st?.deco_owned).toHaveLength(4)
    expect(st?.deco_pendants).not.toContain('pendant-balloon')
  })

  it('卸下挂饰:移除佩戴但保留拥有', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 30 })
    await buyDecoration(s.id, crown)
    await takeOffDecoration(s.id, crown)
    const st = await db.students.get(s.id)
    expect(st?.deco_pendants).toEqual([])
    expect(st?.deco_owned).toContain('pendant-crown')
  })

  it('卸下背景:还原默认但保留拥有', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 30 })
    await buyDecoration(s.id, forest)
    await takeOffDecoration(s.id, forest)
    const st = await db.students.get(s.id)
    expect(st?.deco_bg).toBeNull()
    expect(st?.deco_owned).toContain('bg-forest')
  })

  it('戴上已拥有背景', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 30 })
    await buyDecoration(s.id, forest)
    await takeOffDecoration(s.id, forest)
    await wearDecoration(s.id, forest)
    expect((await db.students.get(s.id))?.deco_bg).toBe('bg-forest')
  })

  it('未拥有就戴上抛错', async () => {
    const s = await addStudent('张三')
    await expect(wearDecoration(s.id, crown)).rejects.toThrow('还没拥有这件装饰')
  })

  it('挂饰位已满再戴上抛错', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 100 })
    await buyDecoration(s.id, crown)
    await buyDecoration(s.id, star)
    await buyDecoration(s.id, bow)
    await buyDecoration(s.id, balloon) // 已拥有但满3不自动戴
    await expect(wearDecoration(s.id, balloon)).rejects.toThrow('挂饰位已满')
  })

  it('星星不足拒绝购买且字段不变', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 5 })
    await expect(buyDecoration(s.id, crown)).rejects.toThrow('星星不足')
    const st = await db.students.get(s.id)
    expect(st?.stars).toBe(5)
    expect(st?.deco_pendants).toEqual([])
  })

  // ---- 特效(规则同背景:单槽、购买即戴、可卸下、拥有保留)----
  it('买特效:扣星、加入拥有、自动戴上、不涨成长值', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 60, total_points: 10, pet_exp: 10, pet_level: 2 })
    const res = await buyDecoration(s.id, snow)
    expect(res.stars).toBe(15)
    expect(res.deco_fx).toBe('fx-snow')
    expect(res.deco_owned).toContain('fx-snow')
    expect(res.total_points).toBe(10)
    expect(res.pet_exp).toBe(10)
    expect(res.pet_level).toBe(2)
  })

  it('买新特效覆盖旧特效槽位,拥有不变', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 100 })
    await buyDecoration(s.id, snow)
    await buyDecoration(s.id, fireflies)
    const st = await db.students.get(s.id)
    expect(st?.deco_fx).toBe('fx-fireflies')
    expect(st?.deco_owned).toEqual(['fx-snow', 'fx-fireflies'])
  })

  it('卸下特效:还原默认但保留拥有', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 60 })
    await buyDecoration(s.id, snow)
    await takeOffDecoration(s.id, snow)
    const st = await db.students.get(s.id)
    expect(st?.deco_fx).toBeNull()
    expect(st?.deco_owned).toContain('fx-snow')
  })

  it('未拥有特效就戴上抛错', async () => {
    const s = await addStudent('张三')
    await expect(wearDecoration(s.id, snow)).rejects.toThrow('还没拥有这件装饰')
  })

  it('特效星星不足拒绝购买且字段不变', async () => {
    const s = await addStudent('张三')
    await db.students.update(s.id, { stars: 40 })
    await expect(buyDecoration(s.id, snow)).rejects.toThrow('星星不足')
    const st = await db.students.get(s.id)
    expect(st?.stars).toBe(40)
    expect(st?.deco_fx).toBeNull()
  })
})

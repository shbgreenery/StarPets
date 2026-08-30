import type { Student } from '@/types'

// 商城商品
export interface ShopItem {
  id: string
  name: string
  emoji: string
  target: 'hunger' | 'cleanliness' | 'happiness'
  amount: number
  price: number
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'chicken', name: '烤鸡腿', emoji: '🍖', target: 'hunger', amount: 30, price: 10 },
  { id: 'apple', name: '红苹果', emoji: '🍎', target: 'hunger', amount: 15, price: 5 },
  { id: 'shower', name: '沐浴露', emoji: '🧼', target: 'cleanliness', amount: 30, price: 10 },
  { id: 'towel', name: '香毛巾', emoji: '🧻', target: 'cleanliness', amount: 15, price: 5 },
  { id: 'bear', name: '布偶熊', emoji: '🧸', target: 'happiness', amount: 30, price: 10 },
  { id: 'ball', name: '小皮球', emoji: '⚽', target: 'happiness', amount: 15, price: 5 },
]

export const SHOP_GROUPS: { target: 'hunger' | 'cleanliness' | 'happiness'; label: string; emoji: string }[] = [
  { target: 'hunger', label: '食物', emoji: '🍖' },
  { target: 'cleanliness', label: '用品', emoji: '🧼' },
  { target: 'happiness', label: '玩具', emoji: '🧸' },
]

// 指标展示信息(卡片/详情共用)
export const METRICS: Record<'hunger' | 'cleanliness' | 'happiness', { label: string; emoji: string; barClass: string }> = {
  hunger: { label: '饥饿值', emoji: '🍗', barClass: 'bg-gradient-to-r from-orange-400 to-amber-400' },
  cleanliness: { label: '清洁度', emoji: '🧼', barClass: 'bg-gradient-to-r from-blue-400 to-cyan-400' },
  happiness: { label: '快乐指数', emoji: '🧸', barClass: 'bg-gradient-to-r from-pink-400 to-rose-400' },
}

// 休眠:任一指标为 0(购买补给恢复后自动解除);成长状态 = 非休眠(三指标都 > 0)
export function isSleeping(student: Pick<Student, 'hunger' | 'cleanliness' | 'happiness'>): boolean {
  return student.hunger === 0 || student.cleanliness === 0 || student.happiness === 0
}

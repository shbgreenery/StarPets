export type EffectKey = 'satiety' | 'cleanliness' | 'happiness'

export interface ShopItem {
  id: string
  category: 'food' | 'clean' | 'toy'
  name: string
  emoji: string
  effect: EffectKey
  amount: number // 提升点数（数值系统 v2）
  price: number // 星星价格
}

// MVP 消耗品目录（PRD 3.6.1，点数制）
export const CONSUMABLES: ShopItem[] = [
  { id: 'milk', category: 'food', name: '牛奶', emoji: '🥛', effect: 'satiety', amount: 30, price: 2 },
  { id: 'dried-fish', category: 'food', name: '小鱼干', emoji: '🐟', effect: 'satiety', amount: 30, price: 2 },
  { id: 'fruit-platter', category: 'food', name: '水果拼盘', emoji: '🍉', effect: 'satiety', amount: 30, price: 2 },
  { id: 'towel', category: 'clean', name: '小毛巾', emoji: '🧻', effect: 'cleanliness', amount: 30, price: 2 },
  { id: 'bubble-bath', category: 'clean', name: '泡泡浴液', emoji: '🫧', effect: 'cleanliness', amount: 30, price: 2 },
  { id: 'yarn-ball', category: 'toy', name: '毛线球', emoji: '🧶', effect: 'happiness', amount: 30, price: 3 },
  { id: 'ball', category: 'toy', name: '小皮球', emoji: '⚽', effect: 'happiness', amount: 30, price: 3 },
  { id: 'blocks', category: 'toy', name: '积木', emoji: '🧱', effect: 'happiness', amount: 30, price: 3 },
]

export function findItem(id: string): ShopItem | undefined {
  return CONSUMABLES.find((i) => i.id === id)
}

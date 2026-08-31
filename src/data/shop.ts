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
  // ---- 食物（饥饿值）----
  { id: 'chicken', name: '烤鸡腿', emoji: '🍖', target: 'hunger', amount: 30, price: 10 },
  { id: 'apple', name: '红苹果', emoji: '🍎', target: 'hunger', amount: 15, price: 5 },
  { id: 'melon-jelly', name: '香瓜果冻', emoji: '🍈', target: 'hunger', amount: 20, price: 7 },
  { id: 'ice-cream', name: '圈圈冰淇淋', emoji: '🍦', target: 'hunger', amount: 25, price: 8 },
  { id: 'chocolate', name: '甜心巧克力', emoji: '🍫', target: 'hunger', amount: 35, price: 12 },
  { id: 'moon-cake', name: '月光饼饼', emoji: '🥮', target: 'hunger', amount: 40, price: 14 },
  { id: 'pop-candy', name: '霹雳啪啦糖', emoji: '🍬', target: 'hunger', amount: 45, price: 15 },
  { id: 'fish-crisp', name: '彩虹鱼脆脆', emoji: '🐟', target: 'hunger', amount: 50, price: 17 },
  { id: 'prawn', name: '大对虾', emoji: '🦐', target: 'hunger', amount: 45, price: 15 },
  { id: 'eight-treasure', name: '八宝饭', emoji: '🍚', target: 'hunger', amount: 50, price: 17 },
  { id: 'longjing-tea', name: '西湖龙井', emoji: '🍵', target: 'hunger', amount: 50, price: 17 },
  { id: 'honey-bone', name: '蜜汁乳香骨', emoji: '🍢', target: 'hunger', amount: 50, price: 17 },
  // ---- 洗浴（清洁度）----
  { id: 'shower', name: '沐浴露', emoji: '🧼', target: 'cleanliness', amount: 30, price: 10 },
  { id: 'towel', name: '香毛巾', emoji: '🧻', target: 'cleanliness', amount: 15, price: 5 },
  { id: 'cool-body-wash', name: '冰爽沐浴液', emoji: '🧴', target: 'cleanliness', amount: 20, price: 7 },
  { id: 'magic-mud', name: '魔幻矿泉泥', emoji: '🫧', target: 'cleanliness', amount: 25, price: 8 },
  { id: 'beer-shampoo', name: '啤酒香波', emoji: '🍺', target: 'cleanliness', amount: 35, price: 12 },
  { id: 'hot-spring-egg', name: '温泉溜溜蛋', emoji: '🥚', target: 'cleanliness', amount: 40, price: 14 },
  { id: 'fragrant-dew', name: '含香凝露', emoji: '💧', target: 'cleanliness', amount: 45, price: 15 },
  { id: 'bath-bomb', name: '奇幻浴球', emoji: '🛁', target: 'cleanliness', amount: 50, price: 17 },
  { id: 'fruit-mask', name: '水果面膜', emoji: '🍊', target: 'cleanliness', amount: 45, price: 15 },
  { id: 'baby-powder', name: '宝宝爽身粉', emoji: '🍼', target: 'cleanliness', amount: 50, price: 17 },
  { id: 'tasty-soap', name: '妙味香皂', emoji: '🧽', target: 'cleanliness', amount: 50, price: 17 },
  { id: 'hair-conditioner', name: '飘飘护发素', emoji: '💆', target: 'cleanliness', amount: 50, price: 17 },
  // ---- 玩具（快乐指数）----
  { id: 'bear', name: '布偶熊', emoji: '🧸', target: 'happiness', amount: 30, price: 10 },
  { id: 'ball', name: '小皮球', emoji: '⚽', target: 'happiness', amount: 15, price: 5 },
  { id: 'lucky-bag', name: '棒棒实惠包', emoji: '🎁', target: 'happiness', amount: 20, price: 7 },
  { id: 'fashion-bag', name: '棒棒时尚包', emoji: '🎀', target: 'happiness', amount: 25, price: 8 },
  { id: 'treasure-bag', name: '棒棒百宝包', emoji: '🧧', target: 'happiness', amount: 35, price: 12 },
  { id: 'good-mouse', name: '乖乖鼠', emoji: '🐭', target: 'happiness', amount: 40, price: 14 },
  { id: 'little-train', name: '呜呜小火车', emoji: '🚂', target: 'happiness', amount: 45, price: 15 },
  { id: 'wind-chime', name: '叮当风铃', emoji: '🎐', target: 'happiness', amount: 50, price: 17 },
  { id: 'paper-kite', name: '纸鸢', emoji: '🪁', target: 'happiness', amount: 45, price: 15 },
  { id: 'nine-rings', name: '九连环', emoji: '🧩', target: 'happiness', amount: 50, price: 17 },
  { id: 'bamboo-copter', name: '竹蜻蜓', emoji: '🪀', target: 'happiness', amount: 50, price: 17 },
  { id: 'star-chess', name: '星汉棋盘', emoji: '♟️', target: 'happiness', amount: 50, price: 17 },
]

export const SHOP_GROUPS: { target: 'hunger' | 'cleanliness' | 'happiness'; label: string; emoji: string }[] = [
  { target: 'hunger', label: '食物', emoji: '🍖' },
  { target: 'cleanliness', label: '洗浴', emoji: '🧼' },
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

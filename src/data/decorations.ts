// 装扮装饰:背景 + 挂饰(商城购买,只扣星星,不涨成长值)
export interface DecorationItem {
  id: string
  name: string
  slot: 'bg' | 'pendant'
  price: number
  bgClass?: string   // slot === 'bg' 时:宠物显示区渐变 class
  emoji?: string     // slot === 'pendant' 时:叠加在宠物旁的图标
}

export const DECOR_ITEMS: DecorationItem[] = [
  // 背景(5 件),宠物图为不透明实底,背景以四周留白相框形式呈现,故用 200/100 档保证可见
  { id: 'bg-forest', name: '森林漫步', slot: 'bg', price: 20, bgClass: 'bg-gradient-to-br from-emerald-200 via-green-100 to-lime-100' },
  { id: 'bg-ocean', name: '海洋泡泡', slot: 'bg', price: 20, bgClass: 'bg-gradient-to-br from-sky-200 via-cyan-100 to-blue-100' },
  { id: 'bg-sunset', name: '粉色晚霞', slot: 'bg', price: 25, bgClass: 'bg-gradient-to-br from-orange-200 via-rose-100 to-pink-100' },
  { id: 'bg-starry', name: '梦幻星空', slot: 'bg', price: 30, bgClass: 'bg-gradient-to-br from-indigo-200 via-purple-100 to-violet-100' },
  { id: 'bg-candy', name: '糖果乐园', slot: 'bg', price: 30, bgClass: 'bg-gradient-to-br from-pink-200 via-fuchsia-100 to-purple-100' },
  // 挂饰(5 件)
  { id: 'pendant-star', name: '幸运星星', slot: 'pendant', price: 5, emoji: '⭐' },
  { id: 'pendant-bow', name: '粉蝴蝶结', slot: 'pendant', price: 10, emoji: '🎀' },
  { id: 'pendant-glasses', name: '酷酷墨镜', slot: 'pendant', price: 15, emoji: '🕶️' },
  { id: 'pendant-balloon', name: '彩色气球', slot: 'pendant', price: 15, emoji: '🎈' },
  { id: 'pendant-crown', name: '闪闪皇冠', slot: 'pendant', price: 20, emoji: '👑' },
]

// 商城分组(补给三组之后追加)
export const DECOR_GROUPS: { slot: 'bg' | 'pendant'; label: string; emoji: string }[] = [
  { slot: 'bg', label: '装扮背景', emoji: '🎨' },
  { slot: 'pendant', label: '装扮挂饰', emoji: '🎀' },
]

// 背景装饰的渐变 class,未购买返回 ''(展示点回落默认渐变)
export function getDecorBgClass(id: string | null): string {
  if (!id) return ''
  const item = DECOR_ITEMS.find(i => i.id === id && i.slot === 'bg')
  return item?.bgClass || ''
}

// 挂饰 emoji,未购买返回 null
export function getDecorPendantEmoji(id: string | null): string | null {
  if (!id) return null
  const item = DECOR_ITEMS.find(i => i.id === id && i.slot === 'pendant')
  return item?.emoji || null
}

// 挂饰同时佩戴上限
export const PENDANT_LIMIT = 3

// 装扮卡片操作:购买 / 戴上 / 卸下
export type DecorAction = 'buy' | 'wear' | 'takeOff'

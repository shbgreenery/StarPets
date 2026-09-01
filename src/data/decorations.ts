// 装扮装饰:背景 + 挂饰(商城购买,只扣星星,不涨成长值)
export interface DecorationItem {
  id: string
  name: string
  slot: 'bg' | 'pendant' | 'fx'
  price: number
  bgClass?: string        // slot === 'bg' 时:宠物显示区渐变 class
  emoji?: string          // slot === 'pendant'/'fx' 时:挂饰图标 / 特效粒子
  // 限时装饰:购买窗口 + 显示期限
  availableFrom?: number  // 购买窗口开始时间戳(未到不显示)
  availableTo?: number    // 购买窗口结束时间戳(过期下架)
  expiresAt?: number      // 显示到期时间戳(统一过期,自动移除)
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
  // 特效(5 件),价格高于背景,规则同背景(单槽、可卸下、拥有保留)
  { id: 'fx-snow', name: '漫天飞雪', slot: 'fx', price: 45, emoji: '❄️' },
  { id: 'fx-sparkles', name: '星光闪烁', slot: 'fx', price: 45, emoji: '✨' },
  { id: 'fx-petals', name: '樱花飘落', slot: 'fx', price: 50, emoji: '🌸' },
  { id: 'fx-bubbles', name: '梦幻泡泡', slot: 'fx', price: 50, emoji: '🫧' },
  { id: 'fx-fireflies', name: '萤火点点', slot: 'fx', price: 55, emoji: '💫' },

  // ---- 中秋限定(购买窗口:9月1日~9月21日, 显示期限:10月21日统一过期)----
  { id: 'holiday-midautumn-lantern', name: '玉兔宫灯', slot: 'pendant', price: 15, emoji: '🏮',
    availableFrom: new Date(2026, 8, 1).getTime(),
    availableTo: new Date(2026, 8, 21, 23, 59, 59).getTime(),
    expiresAt: new Date(2026, 9, 21, 23, 59, 59).getTime() },
  { id: 'holiday-midautumn-osmanthus', name: '月桂飘香', slot: 'pendant', price: 10, emoji: '🌼',
    availableFrom: new Date(2026, 8, 1).getTime(),
    availableTo: new Date(2026, 8, 21, 23, 59, 59).getTime(),
    expiresAt: new Date(2026, 9, 21, 23, 59, 59).getTime() },
  { id: 'holiday-midautumn-moonlight', name: '月光如水', slot: 'fx', price: 45, emoji: '🌙',
    availableFrom: new Date(2026, 8, 1).getTime(),
    availableTo: new Date(2026, 8, 21, 23, 59, 59).getTime(),
    expiresAt: new Date(2026, 9, 21, 23, 59, 59).getTime() },
  { id: 'holiday-midautumn-night', name: '月夜星空', slot: 'bg', price: 35, bgClass: 'bg-gradient-to-br from-indigo-900 via-purple-800 to-slate-900',
    availableFrom: new Date(2026, 8, 1).getTime(),
    availableTo: new Date(2026, 8, 21, 23, 59, 59).getTime(),
    expiresAt: new Date(2026, 9, 21, 23, 59, 59).getTime() },
]

// 商城分组(补给三组之后追加)
export const DECOR_GROUPS: { slot: 'bg' | 'pendant' | 'fx'; label: string; emoji: string }[] = [
  { slot: 'bg', label: '装扮背景', emoji: '🎨' },
  { slot: 'pendant', label: '装扮挂饰', emoji: '🎀' },
  { slot: 'fx', label: '装扮特效', emoji: '✨' },
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

// 特效粒子动画配置(id → 粒子数/动画类型)
export interface FxStyle { count: number; anim: 'fall' | 'rise' | 'sparkle' }
export const FX_CONFIG: Record<string, FxStyle> = {
  'fx-snow': { count: 10, anim: 'fall' },
  'fx-petals': { count: 8, anim: 'fall' },
  'fx-sparkles': { count: 14, anim: 'sparkle' },
  'fx-bubbles': { count: 10, anim: 'rise' },
  'fx-fireflies': { count: 12, anim: 'rise' },
  'holiday-midautumn-moonlight': { count: 10, anim: 'fall' },
}
export function getFxStyle(id: string | null): FxStyle | null {
  if (!id) return null
  return FX_CONFIG[id] || null
}

// 限时装饰:当前是否在购买窗口内
export function isInPurchaseWindow(item: DecorationItem): boolean {
  if (!item.availableFrom && !item.availableTo) return true
  const now = Date.now()
  if (item.availableFrom && now < item.availableFrom) return false
  if (item.availableTo && now > item.availableTo) return false
  return true
}

// 限时装饰:是否已过期(显示期限已到)
export function isExpired(item: DecorationItem): boolean {
  if (!item.expiresAt) return false
  return Date.now() >= item.expiresAt
}

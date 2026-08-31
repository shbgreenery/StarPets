// 宠物点击互动配置数据

// 宠物专属叫声（按宠物类型）
export const PET_SOUNDS: Record<string, { text: string; emoji: string }> = {
  'west-highland': { text: '汪汪！', emoji: '🐕' },
  'bichon': { text: '汪汪！', emoji: '🐕' },
  'border-collie': { text: '汪汪！', emoji: '🐕' },
  'shiba': { text: '汪汪！', emoji: '🐕' },
  'golden-retriever': { text: '汪汪！', emoji: '🐕' },
  'samoyed': { text: '汪汪！', emoji: '🐕' },
  'husky': { text: '汪汪！', emoji: '🐕' },
  'corgi': { text: '汪汪！', emoji: '🐕' },
  'tabby-cat': { text: '喵～', emoji: '🐱' },
  'persian-cat': { text: '喵～', emoji: '🐱' },
  'ragdoll-cat': { text: '喵～', emoji: '🐱' },
  'orange-cat': { text: '喵～', emoji: '🐱' },
  'lop-rabbit': { text: '蹦蹦！', emoji: '🐰' },
  'angora-rabbit': { text: '蹦蹦！', emoji: '🐰' },
  'hamster': { text: '吱吱！', emoji: '🐹' },
  'winter-hamster': { text: '吱吱！', emoji: '🐹' },
  'call-duck': { text: '嘎嘎！', emoji: '🦆' },
  'alpaca': { text: '草草～', emoji: '🦙' },
  'red-panda': { text: '嗷呜～', emoji: '🐼' },
  'white-tiger': { text: '吼！', emoji: '🐯' },
  'unicorn': { text: '叮铃～', emoji: '✨' },
  'azure-dragon': { text: '呼～', emoji: '🌊' },
  'vermilion-bird': { text: '啾～', emoji: '🔥' },
  'succulent-spirit': { text: '咕噜～', emoji: '🌱' },
  'pixiu': { text: '嚯！', emoji: '💎' },
  'suanni': { text: '吼！', emoji: '👑' },
}

export const DEFAULT_SOUND = { text: '嘿嘿！', emoji: '🐾' }

// 通用互动台词类型
export interface ReactionLine {
  text: string
  emoji: string
  condition?: 'hunger' | 'cleanliness' | 'happiness'
}

// 通用互动台词（每条带条件标记，用于动态调权）
export const PET_LINES: ReactionLine[] = [
  { text: '你是要和我玩游戏吗？', emoji: '🎮' },
  { text: '商城里最近有一个好看的发卡，你买给我好吗？', emoji: '🛍️' },
  { text: '今天有没有好好表现呀？', emoji: '😊' },
  { text: '我有点饿了，喂我吃点东西吧～', emoji: '🍖', condition: 'hunger' },
  { text: '陪我玩一会儿嘛！', emoji: '🧸', condition: 'happiness' },
  { text: '今天我们一起玩吧！', emoji: '🎈' },
  { text: '你的表现真棒，继续加油哦！', emoji: '⭐' },
  { text: '明天也要记得来看我哦！', emoji: '💕' },
  { text: '我好开心呀！', emoji: '🎉' },
  { text: '你今天的表现怎么样？给我讲讲吧！', emoji: '💬' },
  { text: '我想去商城逛逛～', emoji: '🛒' },
  { text: '今天有没有赚到星星呀？', emoji: '✨' },
  { text: '我身上脏了，帮我洗个澡吧！', emoji: '🧼', condition: 'cleanliness' },
  { text: '你是我最好的朋友！', emoji: '❤️' },
  { text: '猜猜我今天在想什么？', emoji: '🤔' },
  { text: '今天的晚饭好吃吗？', emoji: '🍚' },
  { text: '我昨晚做了一个好玩的梦！', emoji: '🌙' },
  { text: '你今天穿得真好看！', emoji: '👕' },
  { text: '我们一起去看星星吧！', emoji: '🌟' },
  { text: '你有没有想我呀？', emoji: '🥰' },
]

// 宠物小知识（按宠物类型，运行时只取当前宠物的）
export const PET_FACTS: Record<string, { text: string; emoji: string }[]> = {
  'tabby-cat': [
    { text: '你知道吗？猫咪一天有70%的时间在睡觉！', emoji: '😺' },
    { text: '你知道吗？每只猫咪的鼻纹都是独一无二的！', emoji: '👃' },
  ],
  'shiba': [
    { text: '你知道吗？狗狗的嗅觉比人类灵敏1000倍！', emoji: '👃' },
    { text: '你知道吗？狗狗的耳朵可以转动180度！', emoji: '👂' },
  ],
  'golden-retriever': [
    { text: '你知道吗？金毛是最聪明的犬种之一！', emoji: '🧠' },
  ],
  'hamster': [
    { text: '你知道吗？仓鼠的腮帮子可以储存食物！', emoji: '🐹' },
    { text: '你知道吗？仓鼠是夜行动物！', emoji: '🌙' },
  ],
  'lop-rabbit': [
    { text: '你知道吗？兔子的耳朵可以转动270度！', emoji: '👂' },
  ],
  'red-panda': [
    { text: '你知道吗？小熊猫不是熊猫，是独立的物种！', emoji: '🐼' },
    { text: '你知道吗？小熊猫的尾巴有9个环纹！', emoji: '🦝' },
  ],
  'unicorn': [
    { text: '你知道吗？独角兽是苏格兰的国兽！', emoji: '🦄' },
  ],
  'azure-dragon': [
    { text: '你知道吗？青龙是中国四象之一，代表东方！', emoji: '🐉' },
  ],
  'pixiu': [
    { text: '你知道吗？貔貅是招财进宝的瑞兽！', emoji: '💎' },
  ],
  'suanni': [
    { text: '你知道吗？狻猊是龙生九子之一！', emoji: '👑' },
  ],
}
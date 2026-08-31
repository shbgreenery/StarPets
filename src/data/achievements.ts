export interface AchievementDef {
  key: string
  type: 'eval' | 'star' | 'streak'
  label: string
  description: string
  target: number
  reward: number  // 奖励星星数
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // 累计评价
  { key: 'eval_10', type: 'eval', label: '评价新手', description: '累计评价 10 次', target: 10, reward: 2 },
  { key: 'eval_50', type: 'eval', label: '评价达人', description: '累计评价 50 次', target: 50, reward: 5 },
  { key: 'eval_100', type: 'eval', label: '评价大师', description: '累计评价 100 次', target: 100, reward: 10 },
  { key: 'eval_200', type: 'eval', label: '评价传奇', description: '累计评价 200 次', target: 200, reward: 15 },
  // 累计星星
  { key: 'star_50', type: 'star', label: '星星收集者', description: '累计获得 50 星', target: 50, reward: 2 },
  { key: 'star_200', type: 'star', label: '星星富翁', description: '累计获得 200 星', target: 200, reward: 5 },
  { key: 'star_500', type: 'star', label: '星星大亨', description: '累计获得 500 星', target: 500, reward: 10 },
  { key: 'star_1000', type: 'star', label: '星星传奇', description: '累计获得 1000 星', target: 1000, reward: 15 },
  // 连续评价
  { key: 'streak_3', type: 'streak', label: '初露锋芒', description: '连续评价 3 天', target: 3, reward: 2 },
  { key: 'streak_7', type: 'streak', label: '坚持不懈', description: '连续评价 7 天', target: 7, reward: 5 },
  { key: 'streak_15', type: 'streak', label: '毅力惊人', description: '连续评价 15 天', target: 15, reward: 10 },
  { key: 'streak_21', type: 'streak', label: '习惯成自然', description: '连续评价 21 天', target: 21, reward: 20 },
]

// Settings 键名
export const ACHIEVED_KEY = 'achieved_milestones'    // 已达成
export const CLAIMED_KEY = 'claimed_milestones'       // 已领取

// 按类型分组
export const ACHIEVEMENT_GROUPS: { type: string; label: string; items: AchievementDef[] }[] = [
  { type: 'eval', label: '📊 累计评价', items: ACHIEVEMENTS.filter(a => a.type === 'eval') },
  { type: 'star', label: '⭐ 累计星星', items: ACHIEVEMENTS.filter(a => a.type === 'star') },
  { type: 'streak', label: '🔥 连续评价', items: ACHIEVEMENTS.filter(a => a.type === 'streak') },
]
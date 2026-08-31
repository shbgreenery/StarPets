import { db } from '@/db/index'
import { ACHIEVEMENTS, ACHIEVED_KEY } from '@/data/achievements'

export interface AchievementInfo {
  studentName: string
  taskName: string
  days: number
  starBonus: number
}

export function useAchievements() {
  async function checkAchievements(studentName: string): Promise<{
    achieved: boolean
    info?: AchievementInfo
  }> {
    const allRecords = await db.evaluation_records.toArray()
    const achieved = await db.settings.get(ACHIEVED_KEY)
    const achievedList: string[] = (achieved?.value as string[]) || []
    const newly: string[] = []

    // 1. 累计评价次数
    const totalEvals = allRecords.length
    // 2. 累计星星
    const totalStars = allRecords.reduce((s, r) => s + (r.points > 0 ? r.points : 0), 0)
    // 3. 连续评价天数
    const days = [...new Set(allRecords.map(r => {
      const d = new Date(r.timestamp)
      return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    }))].sort()
    let maxStreak = 0
    if (days.length > 0) {
      let streak = 1
      maxStreak = 1
      for (let i = 1; i < days.length; i++) {
        const prev = new Date(days[i - 1])
        const curr = new Date(days[i])
        if ((curr.getTime() - prev.getTime()) / 86400000 <= 1) {
          streak++
          maxStreak = Math.max(maxStreak, streak)
        } else {
          streak = 1
        }
      }
    }

    // 遍历所有成就定义，检测是否新达成
    for (const def of ACHIEVEMENTS) {
      if (achievedList.includes(def.key)) continue
      let progress = 0
      if (def.type === 'eval') progress = totalEvals
      else if (def.type === 'star') progress = totalStars
      else if (def.type === 'streak') progress = maxStreak
      if (progress >= def.target) {
        newly.push(def.key)
        achievedList.push(def.key)
      }
    }

    if (newly.length > 0) {
      await db.settings.put({ key: ACHIEVED_KEY, value: achievedList })
      const lastKey = newly[newly.length - 1]
      const def = ACHIEVEMENTS.find(a => a.key === lastKey)
      if (def) {
        return {
          achieved: true,
          info: {
            studentName,
            taskName: def.label,
            days: def.target,
            starBonus: def.reward
          }
        }
      }
    }

    return { achieved: false }
  }

  return { checkAchievements }
}
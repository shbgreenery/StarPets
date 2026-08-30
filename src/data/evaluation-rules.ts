import type { Rule } from '@/types'

// 数据来自后端 server/index.js 的 initDefaultRules()
// 只保留加分规则(去掉扣分评价后,分值均为正数)
const rawRules: Array<{ name: string; points: number; category: string }> = [
  // 学习类 - 加分
  { name: '作业完成优秀', points: 1, category: '学习' },
  { name: '平时测验满分', points: 3, category: '学习' },
  { name: '平时测验达优秀', points: 2, category: '学习' },
  { name: '默写全对', points: 1, category: '学习' },
  { name: '订正态度认真', points: 1, category: '学习' },
  { name: '优秀作业,值得表扬', points: 1, category: '学习' },
  { name: '近期学习状态进步', points: 1, category: '学习' },
  { name: '被老师点名表扬', points: 1, category: '学习' },
  { name: '单元测验显著进步', points: 2, category: '学习' },
  // 行为类 - 加分
  { name: '早读认真专注', points: 1, category: '行为' },
  { name: '课前准备充分', points: 1, category: '行为' },
  { name: '眼保健操全程认真', points: 1, category: '行为' },
  { name: '升旗仪式安静整齐', points: 1, category: '行为' },
  { name: '守纪表现优秀(被表扬)', points: 2, category: '行为' },
  { name: '主动帮助同学', points: 2, category: '行为' },
  { name: '拾金不昧(一般物品)', points: 2, category: '行为' },
  { name: '拾金不昧(贵重物品)', points: 5, category: '行为' },
  { name: '主动帮助生病同学', points: 3, category: '行为' },
  { name: '主动调解同学矛盾、化解冲突', points: 3, category: '行为' },
  { name: '做好人好事被学校提出表扬', points: 3, category: '行为' },
  { name: '积极参与校内外志愿服务', points: 3, category: '行为' },
  { name: '犯错主动认错,积极协商', points: 1, category: '行为' },
  // 健康类 - 加分
  { name: '认真完成包干区值日', points: 1, category: '健康' },
  { name: '主动为班级擦黑板', points: 1, category: '健康' },
  { name: '主动整理讲台', points: 1, category: '健康' },
  { name: '主动整理黑板粉笔槽', points: 1, category: '健康' },
  { name: '主动倒垃圾并套垃圾袋', points: 2, category: '健康' },
  { name: '座位整洁无涂画,桌椅干净', points: 1, category: '健康' },
  { name: '座位周围无垃圾', points: 1, category: '健康' },
  // 其他类 - 加分
  { name: '主动整理图书、摆放整齐', points: 2, category: '其他' },
  { name: '主动帮同学更换桌椅', points: 2, category: '其他' },
  { name: '主动承担班级任务', points: 2, category: '其他' },
  { name: '积极参加班级墙面布置', points: 2, category: '其他' },
  { name: '积极参加班级或学校活动', points: 1, category: '其他' },
  { name: '活动中表现优秀', points: 2, category: '其他' },
  { name: '代表班级参赛', points: 3, category: '其他' },
  { name: '校级比赛:一等奖', points: 5, category: '其他' },
  { name: '校级比赛:二等奖', points: 4, category: '其他' },
  { name: '校级比赛:三等奖', points: 3, category: '其他' },
  { name: '区级及以上:一等奖', points: 8, category: '其他' },
  { name: '区级及以上:二等奖', points: 6, category: '其他' },
  { name: '区级及以上:三等奖', points: 4, category: '其他' },
  { name: '联欢会或文艺汇演积极参与', points: 2, category: '其他' },
  { name: '为班级争得荣誉', points: 5, category: '其他' },
  { name: '小组全周无违纪、全员交作业', points: 2, category: '其他' },
]

export const DEFAULT_RULES: Rule[] = rawRules.map((r, i) => ({
  id: `default_${i + 1}`,
  name: r.name,
  points: r.points,
  category: r.category,
  is_custom: 0,
  created_at: 1704067200000
}))

export interface GuessItem {
  emoji: string
  answer: string
  category: string
  hints: string[]
}

export const GUESS_ITEMS: GuessItem[] = [
  // 🐕 动物
  { emoji: '🐘', answer: '大象', category: '动物', hints: ['长鼻子', '大耳朵', '身体很大', '生活在非洲'] },
  { emoji: '🐧', answer: '企鹅', category: '动物', hints: ['不会飞', '生活在很冷的地方', '穿黑色白色衣服', '走路摇摇摆摆'] },
  { emoji: '🦒', answer: '长颈鹿', category: '动物', hints: ['脖子很长', '身上有斑点', '可以吃到很高的树叶', '生活在非洲'] },
  { emoji: '🐬', answer: '海豚', category: '动物', hints: ['生活在水里', '很聪明', '会跳起来', '对人类很友好'] },
  { emoji: '🦁', answer: '狮子', category: '动物', hints: ['森林之王', '有鬃毛', '叫声很大', '很凶猛'] },
  { emoji: '🐒', answer: '猴子', category: '动物', hints: ['喜欢爬树', '爱吃香蕉', '很调皮', '会模仿人'] },
  { emoji: '🐢', answer: '乌龟', category: '动物', hints: ['走路很慢', '背上有壳', '活得很久', '遇到危险会缩进壳里'] },
  { emoji: '🐝', answer: '蜜蜂', category: '动物', hints: ['会飞', '采花蜜', '有黄色和黑色条纹', '会蜇人'] },
  { emoji: '🦋', answer: '蝴蝶', category: '动物', hints: ['翅膀很漂亮', '会飞', '小时候是毛毛虫', '喜欢花'] },
  { emoji: '🐌', answer: '蜗牛', category: '动物', hints: ['背着小房子', '走路很慢', '下雨天会出现', '有触角'] },
  { emoji: '🐸', answer: '青蛙', category: '动物', hints: ['会跳', '爱吃虫子', '小时候是小蝌蚪', '叫声呱呱'] },
  { emoji: '🦉', answer: '猫头鹰', category: '动物', hints: ['晚上活动', '白天睡觉', '眼睛很大', '会抓老鼠'] },
  { emoji: '🐊', answer: '鳄鱼', category: '动物', hints: ['生活在水里', '嘴巴很长', '牙齿很锋利', '看起来很凶'] },
  { emoji: '🦜', answer: '鹦鹉', category: '动物', hints: ['有漂亮的羽毛', '会学人说话', '会飞', '嘴巴弯弯的'] },
  { emoji: '🐧', answer: '北极熊', category: '动物', hints: ['生活在很冷的地方', '全身白色', '很大', '很会游泳'] },
  { emoji: '🦈', answer: '鲨鱼', category: '动物', hints: ['生活在大海里', '牙齿很锋利', '游泳很快', '是海洋里的霸主'] },
  { emoji: '🐼', answer: '熊猫', category: '动物', hints: ['黑白颜色', '爱吃竹子', '胖胖的', '是中国国宝'] },
  { emoji: '🦊', answer: '狐狸', category: '动物', hints: ['尾巴很大很蓬松', '很聪明', '橙色的毛', '爱吃鸡'] },
  { emoji: '🐰', answer: '兔子', category: '动物', hints: ['耳朵很长', '尾巴很短', '爱吃胡萝卜', '跳得很快'] },
  { emoji: '🐶', answer: '狗', category: '动物', hints: ['是人类最好的朋友', '会汪汪叫', '看家护院', '爱摇尾巴'] },

  // 🍎 食物
  { emoji: '🍉', answer: '西瓜', category: '食物', hints: ['绿色外皮', '红色果肉', '夏天最爱', '很甜很多汁'] },
  { emoji: '🍦', answer: '冰淇淋', category: '食物', hints: ['夏天吃很凉快', '甜甜的', '会融化', '有很多口味'] },
  { emoji: '🍕', answer: '披萨', category: '食物', hints: ['圆圆的', '上面有芝士', '可以切成几块', '意大利的美食'] },
  { emoji: '🍔', answer: '汉堡', category: '食物', hints: ['两片面包夹肉', '有生菜和番茄', '快餐食品', '很好拿'] },
  { emoji: '🍩', answer: '甜甜圈', category: '食物', hints: ['中间有个洞', '圆形的', '甜甜的', '上面有糖霜'] },
  { emoji: '🍰', answer: '蛋糕', category: '食物', hints: ['生日的时候吃', '上面有奶油', '很甜', '插蜡烛'] },
  { emoji: '🍜', answer: '面条', category: '食物', hints: ['长长的', '用筷子吃', '热乎乎的', '可以加汤'] },
  { emoji: '🥟', answer: '饺子', category: '食物', hints: ['过年的时候吃', '里面包馅', '像小耳朵', '可以蘸醋'] },
  { emoji: '🍪', answer: '饼干', category: '食物', hints: ['脆脆的', '小小的', '可以当零食', '圆圆的'] },
  { emoji: '🍿', answer: '爆米花', category: '食物', hints: ['看电影的时候吃', '玉米做的', '一颗一颗的', '会嘭嘭爆开'] },
  { emoji: '🥚', answer: '鸡蛋', category: '食物', hints: ['椭圆形', '外面有壳', '可以煮着吃', '鸡妈妈生的'] },
  { emoji: '🥛', answer: '牛奶', category: '食物', hints: ['白色的', '补充钙质', '从奶牛身上来的', '小朋友每天喝'] },
  { emoji: '🍇', answer: '葡萄', category: '食物', hints: ['一串一串的', '紫色的或绿色的', '圆圆的', '可以做葡萄酒'] },
  { emoji: '🍌', answer: '香蕉', category: '食物', hints: ['黄色的', '弯弯的', '剥皮吃', '猴子最爱'] },
  { emoji: '🍎', answer: '苹果', category: '食物', hints: ['红色的或绿色的', '一天一...医生远离我', '脆脆的', '牛顿被它砸到'] },

  // 🏠 日常用品
  { emoji: '☂️', answer: '雨伞', category: '日常', hints: ['下雨天用', '可以打开', '用来挡雨', '也可以遮太阳'] },
  { emoji: '⌚', answer: '手表', category: '日常', hints: ['戴在手腕上', '看时间用', '有指针', '可以防水'] },
  { emoji: '🔑', answer: '钥匙', category: '日常', hints: ['开门用', '小小的', '金属做的', '出门要记得带'] },
  { emoji: '📖', answer: '书', category: '日常', hints: ['有很多页', '可以读', '学知识', '去图书馆借'] },
  { emoji: '✏️', answer: '铅笔', category: '日常', hints: ['写字用', '有笔芯', '可以削', '橡皮擦可以擦掉'] },
  { emoji: '🪥', answer: '牙刷', category: '日常', hints: ['早上晚上都用', '刷牙用', '有刷毛', '和牙膏一起用'] },
  { emoji: '🛏️', answer: '床', category: '日常', hints: ['睡觉用', '有被子和枕头', '在卧室里', '软软的'] },
  { emoji: '🚿', answer: '淋浴', category: '日常', hints: ['洗澡用', '有水喷出来', '在卫生间', '洗完后很干净'] },
  { emoji: '🧹', answer: '扫帚', category: '日常', hints: ['扫地用', '长长的', '清理垃圾', '和簸箕一起用'] },
  { emoji: '📱', answer: '手机', category: '日常', hints: ['可以打电话', '可以上网', '小小的拿在手里', '爸爸妈妈每天用'] },
  { emoji: '🪴', answer: '盆栽', category: '日常', hints: ['种在花盆里', '绿色的', '需要浇水', '放在家里装饰'] },
  { emoji: '🎒', answer: '书包', category: '日常', hints: ['上学背', '装书和文具', '背在背上', '有肩带'] },
  { emoji: '🧸', answer: '玩具熊', category: '日常', hints: ['毛茸茸的', '小朋友喜欢抱着睡觉', '软软的', '是好朋友'] },
  { emoji: '🕯️', answer: '蜡烛', category: '日常', hints: ['会发光', '有火苗', '生日蛋糕上插', '吹灭可以许愿'] },
  { emoji: '🎁', answer: '礼物', category: '日常', hints: ['用包装纸包着', '有蝴蝶结', '生日或节日送', '拆开有惊喜'] },

  // 🔤 认知
  { emoji: '🔴', answer: '红色', category: '认知', hints: ['苹果的颜色', '国旗的颜色', '红灯停', '玫瑰花'] },
  { emoji: '🟡', answer: '黄色', category: '认知', hints: ['香蕉的颜色', '太阳的颜色', '警告标志', '小鸭子的颜色'] },
  { emoji: '🔵', answer: '蓝色', category: '认知', hints: ['天空的颜色', '大海的颜色', '蓝莓', '牛仔裤'] },
  { emoji: '🟢', answer: '绿色', category: '认知', hints: ['草的颜色', '树叶的颜色', '绿灯行', '西瓜皮'] },
  { emoji: '🔺', answer: '三角形', category: '认知', hints: ['有三个角', '有三条边', '三明治的形状', '警告标志'] },
  { emoji: '⬜', answer: '正方形', category: '认知', hints: ['四条边一样长', '四个角', '像一个盒子', '魔方的每一面'] },
  { emoji: '⭕', answer: '圆形', category: '认知', hints: ['没有角', '像车轮', '像太阳', '滚来滚去'] },
  { emoji: '⭐', answer: '星星', category: '认知', hints: ['在天上闪闪发光', '晚上出现', '有五个角', '许愿的时候看它'] },
  { emoji: '🌙', answer: '月亮', category: '认知', hints: ['晚上出来', '有时圆有时弯', '会发光', '和太阳轮流值班'] },
  { emoji: '🌈', answer: '彩虹', category: '认知', hints: ['有七种颜色', '雨后出现', '像一座桥', '在天上弯弯的'] },
  { emoji: '❄️', answer: '雪花', category: '认知', hints: ['冬天会下', '白色的', '从天上飘下来', '六角形的'] },
  { emoji: '🔥', answer: '火', category: '认知', hints: ['红红的', '很热', '会发光', '不能用手摸'] },
  { emoji: '💧', answer: '水', category: '认知', hints: ['透明的', '可以喝', '没有味道', '从水龙头流出来'] },
  { emoji: '🌪️', answer: '龙卷风', category: '认知', hints: ['转得很快', '风很大', '会把东西卷起来', '很危险'] },

  // 📚 进阶
  { emoji: '🚀', answer: '火箭', category: '进阶', hints: ['飞到太空', '速度很快', '尾部喷火', '宇航员乘坐'] },
  { emoji: '🦕', answer: '恐龙', category: '进阶', hints: ['很久以前生活在地球', '已经灭绝了', '很大', '在博物馆能看到骨架'] },
  { emoji: '🌋', answer: '火山', category: '进阶', hints: ['会喷火', '山顶有个洞', '喷出岩浆', '很热很危险'] },
  { emoji: '🏰', answer: '城堡', category: '进阶', hints: ['很高很大', '公主和王子住在里面', '有尖尖的塔顶', '古代的建筑'] },
  { emoji: '🎪', answer: '马戏团', category: '进阶', hints: ['有大帐篷', '有小丑表演', '有空中飞人', '动物表演'] },
  { emoji: '🤖', answer: '机器人', category: '进阶', hints: ['不是人', '用金属做的', '会做很多事情', '有程序控制'] },
  { emoji: '🧭', answer: '指南针', category: '进阶', hints: ['用来认方向', '有个指针总是指向一个方向', '去野外要带', '不会迷路'] },
  { emoji: '🔬', answer: '显微镜', category: '进阶', hints: ['看很小的东西', '科学家用', '可以放大很多倍', '看细菌和细胞'] },
  { emoji: '🎭', answer: '面具', category: '进阶', hints: ['戴在脸上', '可以扮演角色', '有各种表情', '万圣节的时候戴'] },
  { emoji: '🗺️', answer: '地图', category: '进阶', hints: ['画着很多地方', '找路用', '有各种颜色', '上面有地名'] },
  { emoji: '⚓', answer: '船锚', category: '进阶', hints: ['在船上', '沉在水底', '让船停下来', '很重很重'] },
  { emoji: '🎯', answer: '靶心', category: '进阶', hints: ['瞄准的目标', '最中间是红色', '射箭的目标', '要打中最中间'] },
  { emoji: '🏆', answer: '奖杯', category: '进阶', hints: ['比赛赢了得到', '金色的', '有把手', '举起来庆祝'] },
  { emoji: '🎨', answer: '调色盘', category: '进阶', hints: ['画家用', '有各种颜色', '画画的时候拿在手上', '圆形或方形'] },
  { emoji: '🪐', answer: '土星', category: '进阶', hints: ['太阳系的一颗星星', '有光环', '很大', '围绕太阳转'] },
]

export const CATEGORIES = ['动物', '食物', '日常', '认知', '进阶']

// 按分类获取题目
export function getItemsByCategory(category: string): GuessItem[] {
  if (category === '全部' || category === 'all') {
    return [...GUESS_ITEMS]
  }
  return GUESS_ITEMS.filter(item => item.category === category)
}

// 随机抽取 N 道题
export function getRandomItems(items: GuessItem[], count: number): GuessItem[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}
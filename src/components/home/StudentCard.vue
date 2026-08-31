<script setup lang="ts">
import { ref, computed } from 'vue'
import { getLevelProgress, getPetType } from '@/data/pets'
import PetImage from '@/components/PetImage.vue'
import ParticleEffect from '@/components/ParticleEffect.vue'
import { getDisplayLevel, getLevelBgClass, getLevelBorderClass, getStudentPetImage } from '@/utils/levelStyle'
import { isSleeping } from '@/data/shop'
import { getDecorBgClass, getDecorPendantEmoji } from '@/data/decorations'
import type { Student } from '@/types'

interface ScoreAnimation {
  points: number
  show: boolean
}

// 喂养过程动画:三种补给类型各自的气泡台词 + 飘落 emoji
type FeedKind = 'hunger' | 'cleanliness' | 'happiness'
const FEED_CONFIG: Record<FeedKind, { text: string; emoji: string; floats: string[] }> = {
  hunger: { text: '啊呜～', emoji: '🍖', floats: ['🍖', '🍗', '🍎'] },
  cleanliness: { text: '洗香香～', emoji: '🧼', floats: ['🫧', '🧼', '💧'] },
  happiness: { text: '好好玩～', emoji: '🧸', floats: ['🧸', '⚽', '❤️'] },
}

// 宠物点击互动配置
// 1. 宠物专属叫声（按宠物类型）
const PET_SOUNDS: Record<string, { text: string; emoji: string }> = {
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
const DEFAULT_SOUND = { text: '嘿嘿！', emoji: '🐾' }

// 2. 通用互动台词（每条带条件标记，用于动态调权）
interface ReactionLine { text: string; emoji: string; condition?: 'hunger' | 'cleanliness' | 'happiness' }
const PET_LINES: ReactionLine[] = [
  { text: '你是要和我玩游戏吗？', emoji: '🎮' },
  { text: '商城里最近有一个好看的发卡，你买给我好吗？', emoji: '🛍️' },
  { text: '今天有没有好好表现呀？', emoji: '😊' },
  { text: '我有点饿了，喂我吃点东西吧～', emoji: '🍖', condition: 'hunger' },
  { text: '陪我玩一会儿嘛！', emoji: '🧸', condition: 'happiness' },
  { text: '今天我们一起做任务吧！', emoji: '📋' },
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

// 3. 宠物小知识（按宠物类型，运行时只取当前宠物的）
const PET_FACTS: Record<string, { text: string; emoji: string }[]> = {
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

const petReaction = ref<{ text: string; emoji: string } | null>(null)

// 计算当前指标状态
const lowHunger = computed(() => props.student.hunger < 30)
const lowCleanliness = computed(() => props.student.cleanliness < 30)
const lowHappiness = computed(() => props.student.happiness < 30)

function triggerPetReaction() {
  if (!props.student.pet_type) {
    // 未领养时点击跳转到领养流程
    emit('click', props.student)
    return
  }
  // 构建权重池：叫声(base 1) + 20条台词(base 1, 条件满足时 base 3) + 宠物小知识(base 1)
  const pool: { text: string; emoji: string; weight: number }[] = []

  // 当前宠物的叫声，权重 1
  const sound = PET_SOUNDS[props.student.pet_type] || DEFAULT_SOUND
  pool.push({ ...sound, weight: 1 })

  // 20条互动台词，条件满足时权重 3 否则 1
  for (const line of PET_LINES) {
    let weight = 1
    if (line.condition === 'hunger' && lowHunger.value) weight = 3
    if (line.condition === 'cleanliness' && lowCleanliness.value) weight = 3
    if (line.condition === 'happiness' && lowHappiness.value) weight = 3
    pool.push({ text: line.text, emoji: line.emoji, weight })
  }

  // 当前宠物的小知识，权重 1
  const facts = PET_FACTS[props.student.pet_type]
  if (facts) {
    for (const fact of facts) {
      pool.push({ ...fact, weight: 1 })
    }
  }

  // 加权随机选取
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight
  for (const item of pool) {
    random -= item.weight
    if (random <= 0) {
      petReaction.value = item
      break
    }
  }

  setTimeout(() => {
    petReaction.value = null
  }, 2000)
}
  const props = defineProps<{
  student: Student
  deleteMode: boolean
  markedForDelete: boolean
  scoreAnimation: ScoreAnimation | null
  feedAnimation: FeedKind | null
}>()

const feedCfg = computed(() => (props.feedAnimation ? FEED_CONFIG[props.feedAnimation] : null))

const emit = defineEmits<{
  (e: 'click', student: Student): void
}>()
</script>

<template>
  <div
    class="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer relative group card-hover"
    :class="[getLevelBorderClass(getDisplayLevel(student)), {
      'ring-2 ring-red-400 ring-offset-2': deleteMode && markedForDelete
    }]"
    @click="emit('click', student)"
  >
    <!-- 评分动效 -->
    <Transition name="score-pop">
      <div
        v-if="scoreAnimation"
        class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
      >
        <div
          class="text-4xl font-bold animate-bounce-in"
          :class="scoreAnimation.points > 0 ? 'text-green-500' : 'text-red-500'"
        >
          {{ scoreAnimation.points > 0 ? '+' : '' }}{{ scoreAnimation.points }}
        </div>
        <div class="absolute inset-0 overflow-hidden">
          <span v-for="i in 6" :key="i" class="absolute text-2xl animate-sparkle" :style="{ left: `${Math.random() * 80 + 10}%`, top: `${Math.random() * 80 + 10}%`, animationDelay: `${i * 100}ms` }">
            {{ scoreAnimation.points > 0 ? '⭐' : '💫' }}
          </span>
        </div>
      </div>
    </Transition>

    <!-- 选中标记 -->
    <Transition name="pop">
      <div
        v-if="deleteMode"
        class="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center z-10 shadow-md transition-all"
        :class="markedForDelete ? 'bg-gradient-to-r from-red-400 to-pink-400' : 'bg-white border-2 border-gray-300'"
      >
        <span v-if="markedForDelete" class="text-white text-sm font-bold">✓</span>
      </div>
    </Transition>

    <!-- 宠物图片区域 -->
    <div class="aspect-square flex items-center justify-center relative rounded-t-2xl"
      :class="[student.pet_type ? (getDecorBgClass(student.deco_bg) || 'bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100') : 'bg-gradient-to-br from-gray-100 via-slate-50 to-gray-100', student.pet_type ? 'cursor-pointer' : '']"
      @click.stop="triggerPetReaction"
    >
      <!-- 有宠物时使用 PetImage 组件。宠物图不透明,有背景装饰时四周留白露出渐变 -->
      <template v-if="student.pet_type">
        <div
          class="w-full h-full overflow-hidden transition-all duration-300"
          :class="[student.deco_bg ? 'p-3 sm:p-4' : '', feedCfg || petReaction ? 'animate-feed-bounce' : '']"
          style="border-radius: 14px 14px 0 0; margin: -1px -1px 0 -1px; width: calc(100% + 2px);"
        >
          <PetImage
            :src="getStudentPetImage(student)"
            :alt="getPetType(student.pet_type)?.name"
            size="full"
            :rounded="false"
            :show-loading="true"
            class="w-full h-full"
            :class="student.deco_bg ? 'rounded-2xl' : ''"
          />
        </div>
      </template>
      <!-- 未领养宠物 -->
      <div v-else class="flex flex-col items-center">
        <span class="text-6xl pet-unknown">❓</span>
        <span class="text-xs text-gray-400 mt-2 group-hover:text-orange-400 transition-colors">点击领养</span>
      </div>

      <!-- 喂养过程动画:气泡台词 + 飘落 emoji(盖住挂饰/徽章,2.5s 自动消失) -->
      <div v-if="feedCfg" class="absolute inset-0 z-30 pointer-events-none">
        <div class="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 feed-bubble">
          <span>{{ feedCfg.emoji }}</span>
          <span class="text-sm font-bold text-gray-700 whitespace-nowrap">{{ feedCfg.text }}</span>
        </div>
        <span
          v-for="(f, i) in feedCfg.floats"
          :key="i"
          class="absolute feed-float text-2xl"
          :style="{ left: `${20 + i * 22}%`, animationDelay: `${i * 0.25}s` }"
        >{{ f }}</span>
      </div>

      <!-- 宠物点击互动:气泡台词 + 弹跳(2s 自动消失,不盖住挂饰/徽章) -->
      <div v-if="petReaction" class="absolute inset-0 z-20 pointer-events-none">
        <div class="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pet-reaction-bubble">
          <span class="text-lg">{{ petReaction.emoji }}</span>
          <span class="text-sm font-bold text-gray-700 leading-tight">{{ petReaction.text }}</span>
        </div>
      </div>

      <!-- 特效粒子层(覆盖宠物区;无 z-index,先于挂饰渲染,故挂饰/等级徽章盖在粒子之上) -->
      <ParticleEffect v-if="student.deco_fx" :fx="student.deco_fx" />

      <!-- 挂饰装饰(最多同时戴 3 个) -->
      <div
        v-if="student.deco_pendants?.length"
        class="absolute top-2 left-2 z-10 flex items-center gap-1"
      >
        <span
          v-for="pid in student.deco_pendants.slice(0, 3)"
          :key="pid"
          class="w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-2xl"
        >{{ getDecorPendantEmoji(pid) }}</span>
      </div>

      <!-- 等级徽章 -->
      <div
        class="absolute bottom-3 right-3 font-bold px-3 py-1 rounded-full shadow-lg text-white text-sm"
        :class="`bg-gradient-to-r ${getLevelBgClass(getDisplayLevel(student))}`"
      >
        <span v-if="getDisplayLevel(student) >= 10">👑</span>
        <span v-else>Lv.</span>{{ getDisplayLevel(student) }}
      </div>

      <!-- 休眠标记(任一指标为0) -->
      <Transition name="pop">
        <div v-if="isSleeping(student)" class="absolute top-3 right-3 w-9 h-9 rounded-full bg-indigo-500/90 flex items-center justify-center text-lg shadow-md z-10">
          💤
        </div>
      </Transition>
    </div>

    <!-- 信息区域 -->
    <div class="p-3 sm:p-4">
      <!-- 学生姓名 + 宠物名 -->
      <div class="flex items-center justify-between mb-2">
        <span class="font-bold text-lg text-gray-800 group-hover:text-orange-500 transition-colors">{{ student.name }}</span>
        <span class="text-xs px-2 py-1 rounded-full"
          :class="student.pet_type ? 'bg-gradient-to-r from-orange-100 to-pink-100 text-orange-600' : 'bg-gray-100 text-gray-400'">
          {{ student.pet_type ? (student.pet_name || getPetType(student.pet_type)?.name) : '未领养' }}
        </span>
      </div>

      <!-- 成长值 + 积分 -->
      <div class="flex items-center justify-between text-sm mb-3">
        <span class="text-gray-500 flex items-center gap-1">
          <template v-if="getLevelProgress(student.pet_exp).isMaxLevel">
            <span class="text-xs text-amber-500 font-medium">🏆 已毕业</span>
          </template>
          <template v-else>
            <span class="text-purple-400">💜</span>
            <span class="font-medium text-purple-600">{{ getLevelProgress(student.pet_exp).current }}</span>
            <span class="text-gray-300">/</span>
            <span>{{ getLevelProgress(student.pet_exp).required }}</span>
          </template>
        </span>
        <span class="font-bold text-lg flex items-center gap-1" title="星星余额（评价所得，商城花费后剩余）">
          <span class="text-yellow-400">✨</span>
          <span class="text-orange-500">{{ student.stars }}</span>
        </span>
      </div>

      <!-- 进度条 -->
      <div class="bg-gray-100 rounded-full h-2.5 overflow-hidden progress-glow">
        <div
          class="rounded-full h-2.5 transition-all duration-500"
          :class="getDisplayLevel(student) >= 5 ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400' : 'bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400'"
          :style="{ width: `${getLevelProgress(student.pet_exp).percentage}%` }"
        ></div>
      </div>

      <!-- 生存指标 -->
      <div class="flex items-center justify-between text-[11px] text-gray-400 mt-2 px-0.5">
        <span :class="student.hunger < 30 ? 'text-red-500 font-medium' : ''">🍗{{ student.hunger }}</span>
        <span :class="student.cleanliness < 30 ? 'text-red-500 font-medium' : ''">🧼{{ student.cleanliness }}</span>
        <span :class="student.happiness < 30 ? 'text-red-500 font-medium' : ''">🧸{{ student.happiness }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 喂养过程动画:宠物弹跳 */
@keyframes feedBounce {
  0%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(0);
  }
  80% {
    transform: translateY(-5px);
  }
}

.animate-feed-bounce {
  animation: feedBounce 0.6s ease;
}

/* 气泡台词:弹出 → 停留 → 淡出,带指向宠物的白色小尾巴 */
.feed-bubble {
  background: #fff;
  border-radius: 12px;
  padding: 4px 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  animation: feedBubble 2.4s ease forwards;
}

.feed-bubble::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #fff;
}

@keyframes feedBubble {
  0% {
    opacity: 0;
    transform: translateY(6px) scale(0.6);
  }
  12% {
    opacity: 1;
    transform: translateY(0) scale(1.05);
  }
  20% {
    transform: translateY(0) scale(1);
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-8px);
  }
}

/* 飘落 emoji:从顶部落到宠物身上 */
.feed-float {
  top: -20px;
  animation: feedFloat 2s ease-in forwards;
}

@keyframes feedFloat {
  0% {
    opacity: 0;
    transform: translateY(0) rotate(0deg);
  }
  15% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(130px) rotate(30deg);
  }
}

/* 评分动效 */
.score-pop-enter-active {
  animation: scorePopIn 0.5s ease-out;
}

.score-pop-leave-active {
  transition: all 0.3s ease;
}

.score-pop-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

@keyframes scorePopIn {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes sparkle {
  0% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.5) rotate(180deg);
  }
  100% {
    opacity: 0;
    transform: scale(0) rotate(360deg);
  }
}

.animate-sparkle {
  animation: sparkle 0.8s ease-out forwards;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-bounce-in {
  animation: bounceIn 0.5s ease-out;
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.2s ease;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

/* 宠物点击互动气泡 */
.pet-reaction-bubble {
  background: #fff;
  border-radius: 14px;
  padding: 6px 14px;
  max-width: 90%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  animation: petReactionBubble 1.8s ease forwards;
}

.pet-reaction-bubble::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #fff;
}

@keyframes petReactionBubble {
  0% {
    opacity: 0;
    transform: translateY(6px) scale(0.6);
  }
  12% {
    opacity: 1;
    transform: translateY(0) scale(1.05);
  }
  20% {
    transform: translateY(0) scale(1);
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-6px);
  }
}
</style>
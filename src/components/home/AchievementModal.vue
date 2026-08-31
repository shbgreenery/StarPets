<script setup lang="ts">
import { ref } from 'vue'

interface AchievementInfo {
  studentName: string
  taskName: string
  days: number
  starBonus: number
}

defineProps<{
  show: boolean
  info: AchievementInfo | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// 额外奖励选项
const EXTRA_REWARDS = [
  { key: 'praise', emoji: '👍', text: '表扬' },
  { key: 'kiss', emoji: '😘', text: '亲亲' },
  { key: 'skip-bath', emoji: '🛁', text: '免洗澡' },
]

const rewardPhase = ref<'celebration' | 'reward'>('celebration')
const selectedReward = ref<string | null>(null)

function handleRewardClick(key: string) {
  selectedReward.value = key
  rewardPhase.value = 'reward'
  setTimeout(() => {
    emit('close')
    reset()
  }, 1500)
}

// 抽奖
function handleLuckyDraw() {
  const randomIdx = Math.floor(Math.random() * EXTRA_REWARDS.length)
  selectedReward.value = EXTRA_REWARDS[randomIdx].key
  rewardPhase.value = 'reward'
  setTimeout(() => {
    emit('close')
    reset()
  }, 1500)
}

function handleSkip() {
  emit('close')
  reset()
}

function reset() {
  selectedReward.value = null
  rewardPhase.value = 'celebration'
}
</script>

<template>
  <Transition name="achievement">
    <div
      v-if="show && info"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      @click.self="handleSkip"
    >
      <!-- 庆祝阶段 -->
      <div
        v-if="rewardPhase === 'celebration'"
        class="bg-white rounded-3xl shadow-2xl mx-4 p-8 max-w-sm w-full text-center animate-bounce-in"
      >
        <div class="text-6xl mb-4 animate-float">🎉</div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">太棒了！</h3>
        <p class="text-gray-600 mb-1">
          {{ info.studentName }} 连续
          <span class="text-orange-500 font-bold text-lg">{{ info.days }}</span> 天
        </p>
        <p class="text-gray-600 mb-4">
          「{{ info.taskName }}」
        </p>
        <div class="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full px-5 py-2 mb-5">
          <span class="text-yellow-400">✨</span>
          <span class="font-bold text-orange-600">+{{ info.starBonus }} 星</span>
        </div>

        <p class="text-gray-500 text-sm mb-4">给孩子一个额外奖励吧！</p>

        <div class="flex gap-3 justify-center mb-4">
          <button
            v-for="reward in EXTRA_REWARDS"
            :key="reward.key"
            class="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-gray-50 hover:bg-orange-50 hover:shadow-md transition-all active:scale-95"
            @click="handleRewardClick(reward.key)"
          >
            <span class="text-2xl">{{ reward.emoji }}</span>
            <span class="text-xs text-gray-500">{{ reward.text }}</span>
          </button>
          <button
            class="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl bg-gray-50 hover:bg-purple-50 hover:shadow-md transition-all active:scale-95"
            @click="handleLuckyDraw"
          >
            <span class="text-2xl">🎲</span>
            <span class="text-xs text-gray-500">抽奖</span>
          </button>
        </div>

        <button
          class="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          @click="handleSkip"
        >
          跳过
        </button>
      </div>

      <!-- 奖励展示阶段 -->
      <div
        v-else-if="rewardPhase === 'reward'"
        class="bg-white rounded-3xl shadow-2xl mx-4 p-8 max-w-sm w-full text-center animate-bounce-in"
      >
        <div class="text-6xl mb-4 animate-float">
          {{ EXTRA_REWARDS.find(r => r.key === selectedReward)?.emoji || '🎲' }}
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">
          {{ selectedReward === 'lucky' ? '抽中了！' : '奖励送达！' }}
        </h3>
        <p class="text-gray-500">
          {{ EXTRA_REWARDS.find(r => r.key === selectedReward)?.text || '给一个大大的拥抱吧！' }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.achievement-enter-active {
  transition: all 0.3s ease;
}
.achievement-leave-active {
  transition: all 0.2s ease;
}
.achievement-enter-from {
  opacity: 0;
}
.achievement-leave-to {
  opacity: 0;
}

@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.5); }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

.animate-bounce-in {
  animation: bounceIn 0.4s ease-out;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 2s ease-in-out infinite;
}
</style>
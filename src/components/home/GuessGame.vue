<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getItemsByCategory, getRandomItems, CATEGORIES, type GuessItem } from '@/data/guess-game'
import { useToast } from '@/composables/useToast'
import { db } from '@/db/index'
import type { Student } from '@/types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'earn-stars', count: number, studentId: string): void
}>()

const toast = useToast()

// 学生列表
const students = ref<Student[]>([])
const selectedStudentId = ref('')

// 游戏阶段
type Phase = 'select' | 'playing' | 'result'
const phase = ref<Phase>('select')

// 选择分类
const selectedCategory = ref('全部')
const roundCount = 5

// 游戏状态
const currentItems = ref<GuessItem[]>([])
const currentIndex = ref(0)
const correctCount = ref(0)
const wrongIds = ref<Set<number>>(new Set()) // 答错的题目索引

const currentItem = computed(() => {
  if (currentIndex.value < currentItems.value.length) {
    return currentItems.value[currentIndex.value]
  }
  return null
})

const studentName = computed(() => {
  const s = students.value.find(s => s.id === selectedStudentId.value)
  return s?.name || ''
})

const totalRounds = computed(() => currentItems.value.length)
const showHint = ref(false)

function startGame() {
  if (!selectedStudentId.value) {
    toast.warning('请先选择宝贝')
    return
  }
  const items = getItemsByCategory(selectedCategory.value)
  if (items.length === 0) {
    toast.warning('该分类没有题目')
    return
  }
  if (items.length < roundCount) {
    toast.warning('该分类题目不够，改为全部题目')
    currentItems.value = items
  } else {
    currentItems.value = getRandomItems(items, roundCount)
  }
  currentIndex.value = 0
  correctCount.value = 0
  wrongIds.value = new Set()
  showHint.value = false
  phase.value = 'playing'
}

function handleCorrect() {
  correctCount.value++
  nextItem()
}

function handleSkip() {
  wrongIds.value.add(currentIndex.value)
  nextItem()
}

function nextItem() {
  showHint.value = false
  if (currentIndex.value < currentItems.value.length - 1) {
    currentIndex.value++
  } else {
    // 游戏结束
    const stars = correctCount.value
    if (stars > 0) {
      emit('earn-stars', stars, selectedStudentId.value)
    }
    phase.value = 'result'
  }
}

function toggleHint() {
  showHint.value = !showHint.value
}

function restartGame() {
  phase.value = 'select'
  selectedCategory.value = '全部'
}

function closeGame() {
  emit('close')
  // 重置状态
  phase.value = 'select'
  selectedCategory.value = '全部'
  selectedStudentId.value = ''
  students.value = []
}

// 加载学生列表
async function loadStudents() {
  students.value = await db.students.toArray()
  if (students.value.length > 0 && !selectedStudentId.value) {
    selectedStudentId.value = students.value[0].id
  }
}

onMounted(loadStudents)

// 打开弹窗时重新加载学生
watch(() => props.show, (val) => {
  if (val) {
    selectedStudentId.value = ''
    loadStudents()
  }
})
</script>

<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden">
        <!-- 头部 -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-800">🎮 你说我猜</h2>
          <button class="text-gray-400 hover:text-gray-600 text-xl leading-none" @click="closeGame">✕</button>
        </div>

        <!-- 分类选择 -->
        <div v-if="phase === 'select'" class="flex-1 overflow-y-auto px-6 py-6">
          <p class="text-gray-500 text-sm mb-4 text-center">妈妈看图描述，孩子来猜！</p>

          <!-- 宝贝选择 -->
          <div class="mb-5">
            <label class="text-xs text-gray-400 font-medium mb-1.5 block">选择宝贝</label>
            <select
              v-model="selectedStudentId"
              class="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none"
            >
              <option value="" disabled>选择宝贝</option>
              <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>

          <p class="text-gray-500 text-sm mb-3">选择分类</p>

          <div class="grid grid-cols-2 gap-3 mb-6">
            <button
              v-for="cat in ['全部', ...CATEGORIES]"
              :key="cat"
              class="py-3 rounded-2xl text-sm font-medium transition-all border-2"
              :class="selectedCategory === cat
                ? 'border-orange-400 bg-orange-50 text-orange-600'
                : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-orange-200'"
              @click="selectedCategory = cat"
            >
              {{ cat === '全部' ? '🎯 全部混合' : cat === '动物' ? '🐕 ' + cat : cat === '食物' ? '🍎 ' + cat : cat === '日常' ? '🏠 ' + cat : cat === '认知' ? '🔤 ' + cat : '📚 ' + cat }}
            </button>
          </div>

          <button
            class="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold text-lg hover:shadow-lg transition-all active:scale-[0.98]"
            @click="startGame"
          >
            开始游戏 🎮
          </button>
        </div>

        <!-- 游戏进行中 -->
        <div v-if="phase === 'playing' && currentItem" class="flex-1 flex flex-col px-6 py-6">
          <!-- 答题进度：对号/叉号 -->
          <div class="flex items-center justify-center gap-3 mb-4">
            <span
              v-for="i in totalRounds"
              :key="i"
              class="text-xl font-bold transition-all duration-300"
              :class="i < currentIndex + 1 ? (wrongIds.has(i - 1) ? 'text-red-400' : 'text-green-500') : 'text-gray-300'"
            >
              {{ i < currentIndex + 1 ? (wrongIds.has(i - 1) ? '✕' : '✓') : '—' }}
            </span>
          </div>

          <!-- emoji 图片展示 -->
          <div class="flex-1 flex flex-col items-center justify-center min-h-[200px]">
            <div class="text-8xl sm:text-9xl mb-4 animate-float">
              {{ currentItem.emoji }}
            </div>

            <!-- 提示区 -->
            <div class="w-full max-w-xs">
              <button
                class="w-full text-sm text-gray-400 hover:text-orange-500 transition-colors mb-2"
                @click="toggleHint"
              >
                {{ showHint ? '收起提示 ▲' : '需要提示？ ▼' }}
              </button>
              <Transition name="slide">
                <div v-if="showHint" class="bg-orange-50 rounded-2xl p-4 mb-3">
                  <p class="text-sm text-gray-600 mb-1 font-medium">可以这样描述：</p>
                  <ul class="text-sm text-gray-500 space-y-1">
                    <li v-for="(hint, i) in currentItem.hints" :key="i">
                      {{ i + 1 }}. {{ hint }}
                    </li>
                  </ul>
                </div>
              </Transition>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-3 mt-4">
            <button
              class="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 font-medium hover:bg-gray-200 transition-all active:scale-[0.98]"
              @click="handleSkip"
            >
              没猜对
            </button>
            <button
              class="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold hover:shadow-lg transition-all active:scale-[0.98]"
              @click="handleCorrect"
            >
              猜对了！⭐
            </button>
          </div>
        </div>

        <!-- 结果页 -->
        <div v-if="phase === 'result'" class="flex-1 overflow-y-auto px-6 py-8">
          <div class="flex flex-col items-center">
            <div class="text-6xl mb-4 animate-float" v-if="correctCount > 0">🎉</div>
            <div class="text-6xl mb-4 animate-float" v-else>😅</div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">
              {{ correctCount > 0 ? '恭喜' + studentName + '！' : '下次加油！' }}
            </h3>
            <p class="text-gray-500 mb-6">
              {{ correctCount > 0 ? '答对 ' + correctCount + ' 题，获得 ' + correctCount + ' 颗星星 ✨' : '一个都没猜对，再试试吧！' }}
            </p>

            <!-- 五颗星星回顾 -->
            <div class="flex items-center justify-center gap-1 mb-6">
              <span v-for="i in totalRounds" :key="i" class="text-xl">
                {{ i <= correctCount ? '⭐' : '☆' }}
              </span>
            </div>

            <!-- 题目回顾 -->
            <div class="w-full mb-6">
              <p class="text-sm font-medium text-gray-500 mb-2">题目回顾：</p>
              <div class="space-y-2">
                <div
                  v-for="(item, i) in currentItems"
                  :key="i"
                  class="flex items-center gap-3 px-3 py-2 rounded-xl"
                  :class="wrongIds.has(i) ? 'bg-red-50' : 'bg-green-50'"
                >
                  <span class="text-xl">{{ item.emoji }}</span>
                  <span class="flex-1 text-sm font-medium" :class="wrongIds.has(i) ? 'text-gray-500' : 'text-gray-800'">
                    {{ item.answer }}
                  </span>
                  <span>{{ wrongIds.has(i) ? '❌' : '✅' }}</span>
                </div>
              </div>
            </div>

            <div class="flex gap-3 w-full pb-2">
              <button
                class="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 font-medium hover:bg-gray-200 transition-all"
                @click="restartGame"
              >
                再玩一次
              </button>
              <button
                class="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold hover:shadow-lg transition-all"
                @click="closeGame"
              >
              完成
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 2s ease-in-out infinite;
}
</style>
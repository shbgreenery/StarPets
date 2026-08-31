<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { db } from '@/db/index'
import { ACHIEVEMENT_GROUPS, ACHIEVED_KEY, CLAIMED_KEY, type AchievementDef } from '@/data/achievements'
import { useToast } from '@/composables/useToast'
import type { Student } from '@/types'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'claim'): void
}>()

const toast = useToast()

// 学生列表
const students = ref<Student[]>([])
const selectedStudentId = ref<string>('')

// 当前进度
const currentEvals = ref(0)
const currentStars = ref(0)
const currentStreak = ref(0)

// 已达成列表
const achievedSet = ref<Set<string>>(new Set())
const claimedSet = ref<Set<string>>(new Set())

// 加载数据
async function loadData() {
  // 加载学生列表
  students.value = await db.students.toArray()

  // 默认选中第一个学生
  if (!selectedStudentId.value && students.value.length > 0) {
    selectedStudentId.value = students.value[0].id
  }

  // 按学生筛选评价记录
  let records = await db.evaluation_records.toArray()
  if (selectedStudentId.value) {
    records = records.filter(r => r.student_id === selectedStudentId.value)
  }

  // 累计评价次数
  currentEvals.value = records.length

  // 累计星星
  currentStars.value = records.reduce((s, r) => s + (r.points > 0 ? r.points : 0), 0)

  // 最大连续评价天数
  currentStreak.value = computeMaxStreak(records)

  // 已达成成就
  const achieved = await db.settings.get(ACHIEVED_KEY)
  achievedSet.value = new Set<string>((achieved?.value as string[]) || [])

  // 已领取成就
  const claimed = await db.settings.get(CLAIMED_KEY)
  claimedSet.value = new Set<string>((claimed?.value as string[]) || [])
}

// 切换学生时重新加载
watch(selectedStudentId, loadData)

// 计算最大连续天数
function computeMaxStreak(records: { timestamp: number }[]): number {
  if (records.length === 0) return 0
  const days = [...new Set(records.map(r => {
    const d = new Date(r.timestamp)
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
  }))].sort()

  let streak = 1
  let maxStreak = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1])
    const curr = new Date(days[i])
    const diff = (curr.getTime() - prev.getTime()) / 86400000
    if (diff <= 1) {
      streak++
      maxStreak = Math.max(maxStreak, streak)
    } else {
      streak = 1
    }
  }
  return maxStreak
}

// 获取当前进度值
function getProgress(def: AchievementDef): number {
  if (def.type === 'eval') return currentEvals.value
  if (def.type === 'star') return currentStars.value
  return currentStreak.value
}

// 获取成就状态
type AchievementStatus = 'locked' | 'unclaimed' | 'claimed'
function getStatus(def: AchievementDef): AchievementStatus {
  if (claimedSet.value.has(def.key)) return 'claimed'
  if (achievedSet.value.has(def.key)) return 'unclaimed'
  return 'locked'
}

// 领取奖励
async function handleClaim(def: AchievementDef) {
  try {
    // 标记为已领取
    const claimed = await db.settings.get(CLAIMED_KEY)
    const list: string[] = (claimed?.value as string[]) || []
    list.push(def.key)
    await db.settings.put({ key: CLAIMED_KEY, value: list })
    claimedSet.value.add(def.key)

    // 给第一个孩子加星星
    const students = await db.students.toArray()
    if (students.length > 0) {
      await db.students.update(students[0].id, {
        stars: (students[0].stars ?? 0) + def.reward
      })
    }

    toast.success(`领取成功！获得 ✨${def.reward} 星`)
    emit('claim')
  } catch (error) {
    console.error('领取失败:', error)
    toast.error('领取失败')
  }
}

onMounted(loadData)

// 当弹窗打开时刷新数据
watch(() => props.show, (val) => {
  if (val) loadData()
})
</script>

<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col"
        @click.stop
      >
        <!-- 头部 -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 class="text-lg font-bold text-gray-800">🏆 成就</h2>
          <button class="text-gray-400 hover:text-gray-600 text-xl leading-none" @click="emit('close')">✕</button>
        </div>

        <!-- 宝贝选择 -->
        <div class="px-6 py-3 border-b border-gray-50 shrink-0">
          <select
            v-model="selectedStudentId"
            class="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none"
          >
            <option value="" disabled>选择宝贝</option>
            <option v-for="s in students" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <!-- 成就列表 -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div v-for="group in ACHIEVEMENT_GROUPS" :key="group.type" class="mb-6 last:mb-0">
            <h3 class="text-sm font-medium text-gray-500 mb-3">{{ group.label }}</h3>

            <div class="space-y-3">
              <div
                v-for="def in group.items"
                :key="def.key"
                class="rounded-2xl p-4 transition-all"
                :class="getStatus(def) === 'claimed' ? 'bg-green-50' : getStatus(def) === 'unclaimed' ? 'bg-orange-50 ring-1 ring-orange-200' : 'bg-gray-50'"
              >
                <!-- 标题和状态 -->
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-sm" :class="getStatus(def) === 'locked' ? 'text-gray-400' : 'text-gray-800'">
                    {{ def.label }}
                  </span>
                  <span
                    v-if="getStatus(def) === 'claimed'"
                    class="text-xs px-2 py-0.5 rounded-full bg-green-200 text-green-700 font-medium"
                  >已领取</span>
                  <button
                    v-else-if="getStatus(def) === 'unclaimed'"
                    class="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-medium hover:shadow-md transition-all active:scale-95"
                    @click="handleClaim(def)"
                  >领取 ✨{{ def.reward }}</button>
                </div>

                <!-- 描述 + 奖励 -->
                <div class="flex items-center justify-between text-xs mb-2">
                  <span class="text-gray-400">{{ def.description }}</span>
                  <span class="font-medium" :class="getStatus(def) === 'claimed' ? 'text-green-500' : 'text-amber-500'">
                    ✨{{ def.reward }}
                  </span>
                </div>

                <!-- 进度条（未领取/锁定显示进度，已领取不显示进度） -->
                <div v-if="getStatus(def) !== 'claimed'">
                  <div class="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>{{ Math.min(getProgress(def), def.target) }}/{{ def.target }}</span>
                    <span>{{ Math.min(100, Math.round(getProgress(def) / def.target * 100)) }}%</span>
                  </div>
                  <div class="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="getStatus(def) === 'unclaimed' ? 'bg-gradient-to-r from-orange-400 to-pink-500' : 'bg-gray-300'"
                      :style="{ width: `${Math.min(100, getProgress(def) / def.target * 100)}%` }"
                    />
                  </div>
                </div>
              </div>
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
</style>
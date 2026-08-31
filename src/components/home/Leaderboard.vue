<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { db } from '@/db/index'
import type { Student } from '@/types'

const props = defineProps<{
  students: Student[]
}>()

type Tab = 'daily' | 'weekly' | 'monthly'
const activeTab = ref<Tab>('daily')

// 排行榜数据
interface LeaderboardEntry {
  studentId: string
  name: string
  stars: number
  rank: number
}

const leaderboard = ref<LeaderboardEntry[]>([])

// 计算时间范围
function getTimeRange(tab: Tab): number {
  const d = new Date()
  const year = d.getFullYear()
  const month = d.getMonth()
  const date = d.getDate()
  const day = d.getDay() // 0=Sun, 1=Mon, ...

  switch (tab) {
    case 'daily':
      return new Date(year, month, date).getTime() // 今天 00:00
    case 'weekly': {
      // 本周一 00:00 (day=1 是周一)
      const mondayOffset = day === 0 ? 6 : day - 1
      const monday = new Date(year, month, date - mondayOffset)
      return monday.getTime()
    }
    case 'monthly':
      return new Date(year, month, 1).getTime() // 本月 1 号 00:00
  }
}

// 加载排行榜数据
async function loadLeaderboard() {
  const since = getTimeRange(activeTab.value)
  const allRecords = await db.evaluation_records
    .where('timestamp')
    .aboveOrEqual(since)
    .toArray()

  // 按学生分组统计星星
  const starMap = new Map<string, number>()
  for (const r of allRecords) {
    const current = starMap.get(r.student_id) || 0
    starMap.set(r.student_id, current + (r.points > 0 ? r.points : 0))
  }

  // 按星星降序排列
  const entries: LeaderboardEntry[] = props.students
    .filter(s => starMap.has(s.id))
    .map(s => ({
      studentId: s.id,
      name: s.name,
      stars: starMap.get(s.id) || 0,
      rank: 0
    }))
    .sort((a, b) => b.stars - a.stars)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))

  leaderboard.value = entries
}

// 切换 Tab 时重新加载
watch(activeTab, loadLeaderboard)
watch(() => props.students.length, loadLeaderboard)

// 初始化
loadLeaderboard()

// 奖牌展示逻辑
const displayEntries = computed(() => {
  const count = props.students.length
  if (count <= 1) return []
  if (count === 2) return leaderboard.value.slice(0, 1) // 仅第一
  return leaderboard.value.slice(0, 3) // 前三
})

const showLeaderboard = computed(() => {
  return props.students.length >= 2
})

const tabLabels: Record<Tab, string> = {
  daily: '日榜',
  weekly: '周榜',
  monthly: '月榜'
}

function getMedal(rank: number): string {
  switch (rank) {
    case 1: return '🥇'
    case 2: return '🥈'
    case 3: return '🥉'
    default: return ''
  }
}

function getMedalColor(rank: number): string {
  switch (rank) {
    case 1: return 'from-amber-300 to-yellow-500 text-yellow-600'
    case 2: return 'from-slate-300 to-gray-400 text-gray-500'
    case 3: return 'from-amber-600 to-orange-700 text-orange-700'
    default: return ''
  }
}
</script>

<template>
  <div v-if="showLeaderboard" class="mb-3 sm:mb-5">
    <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
      <!-- Tab 切换 -->
      <div class="flex border-b border-gray-100">
        <button
          v-for="(label, tab) in tabLabels"
          :key="tab"
          class="flex-1 py-2.5 text-sm font-medium transition-all relative"
          :class="activeTab === tab ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'"
          @click="activeTab = tab as Tab"
        >
          {{ label }}
          <div
            v-if="activeTab === tab"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full"
          />
        </button>
      </div>

      <!-- 排行榜内容 -->
      <div class="px-4 py-3">
        <div v-if="displayEntries.length === 0" class="text-center text-gray-400 text-sm py-2">
          暂无数据，快去给孩子评价吧～
        </div>

        <div
          v-for="(entry, idx) in displayEntries"
          :key="entry.studentId"
          class="flex items-center justify-between py-2.5"
          :class="idx < displayEntries.length - 1 ? 'border-b border-gray-50' : ''"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl" :class="idx < 3 ? '' : 'text-gray-300'">
              {{ getMedal(entry.rank) }}
            </span>
            <span class="font-medium text-gray-700">{{ entry.name }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-yellow-400">✨</span>
            <span class="font-bold" :class="[getMedalColor(entry.rank), entry.rank > 3 ? 'text-gray-500' : '']">
              {{ entry.stars }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
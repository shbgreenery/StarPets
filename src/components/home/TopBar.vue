<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  studentCount: number
}>()

const emit = defineEmits<{
  (e: 'add-student'): void
  (e: 'delete-students'): void
  (e: 'show-records'): void
  (e: 'show-rules'): void
  (e: 'show-game'): void
  (e: 'show-leaderboard'): void
}>()

// 下拉菜单展开状态
const showStudentMenu = ref(false)
const showMoreMenu = ref(false)
</script>

<template>
  <header class="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 shadow-lg px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-30">
    <!-- Left: logo + menus (左对齐) -->
    <div class="flex items-center gap-1 sm:gap-2 min-w-0">
      <span class="text-2xl animate-bounce-slow shrink-0">🐾</span>
      <span class="text-gradient font-bold hidden sm:inline mr-1 shrink-0">成长伙伴</span>

      <!-- 宝贝菜单 -->
      <div class="relative">
        <button @click="showStudentMenu = !showStudentMenu" class="px-2 sm:px-3 py-1.5 rounded-lg text-sm bg-white/95 hover:bg-white shadow-md transition-all font-medium">
          👶 宝贝 ▾
        </button>
        <div v-if="showStudentMenu" @click="showStudentMenu = false" class="fixed inset-0 z-40"></div>
        <Transition name="dropdown">
          <div v-if="showStudentMenu" class="absolute left-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-36 sm:w-40 z-50 overflow-hidden">
            <button @click="emit('add-student'); showStudentMenu = false" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">➕ 添加</button>
            <button @click="emit('delete-students'); showStudentMenu = false" class="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">🗑️ 删除</button>
          </div>
        </Transition>
      </div>

      <!-- 更多菜单 -->
      <div class="relative">
        <button @click="showMoreMenu = !showMoreMenu" class="px-2 sm:px-3 py-1.5 rounded-lg text-sm bg-white/95 hover:bg-white shadow-md transition-all font-medium">
          ⋯ 更多 ▾
        </button>
        <div v-if="showMoreMenu" @click="showMoreMenu = false" class="fixed inset-0 z-40"></div>
        <Transition name="dropdown">
          <div v-if="showMoreMenu" class="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-36 sm:w-40 z-50 overflow-hidden">
            <router-link to="/preview" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors flex items-center gap-2">
              📖 图鉴
            </router-link>
            <hr class="my-1.5 border-gray-100">
            <button @click="emit('show-records'); showMoreMenu = false" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">📊 记录</button>
            <button @click="emit('show-rules'); showMoreMenu = false" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">⚙️ 规则</button>
            <hr class="my-1.5 border-gray-100">
            <button @click="emit('show-leaderboard'); showMoreMenu = false" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">🏆 光荣榜</button>
            <button @click="emit('show-game'); showMoreMenu = false" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">🎮 游戏</button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Right: 宝贝数徽章 -->
    <span class="text-sm text-white/90 font-medium bg-white/20 px-3 py-1 rounded-full shrink-0">
      {{ studentCount }}<span class="hidden sm:inline"> 个宝贝</span>
    </span>
  </header>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

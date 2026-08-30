<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  studentCount: number
  searchQuery: string
  batchMode: boolean
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'add-student'): void
  (e: 'delete-students'): void
  (e: 'start-batch'): void
  (e: 'show-rank'): void
  (e: 'show-records'): void
  (e: 'show-rules'): void
}>()

// 搜索框 v-model 桥接
const searchInput = computed({
  get: () => props.searchQuery,
  set: (value: string) => emit('update:searchQuery', value)
})

// 下拉菜单展开状态
const showPetMenu = ref(false)
const showStudentMenu = ref(false)
const showEvalMenu = ref(false)
</script>

<template>
  <header class="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 shadow-lg px-4 py-3 flex items-center justify-between sticky top-0 z-30">
    <!-- Left -->
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-bold text-white drop-shadow-lg flex items-center gap-2">
        <span class="text-2xl animate-bounce-slow">🐾</span>
        <span class="text-gradient">成长伙伴</span>
      </h1>
      <span class="text-sm text-white/90 font-medium bg-white/20 px-3 py-1 rounded-full">
        {{ studentCount }} 个宝贝
      </span>
    </div>

    <!-- Right -->
    <div class="flex items-center gap-1.5">
      <!-- Search -->
      <input
        v-model="searchInput"
        type="text"
        placeholder="🔍 搜索..."
        class="border-0 rounded-lg px-3 py-1.5 text-sm w-28 bg-white/95 hover:bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
      />

      <!-- Pet Menu -->
      <div class="relative" v-if="!batchMode">
        <button @click="showPetMenu = !showPetMenu" class="px-3 py-1.5 rounded-lg text-sm bg-white/95 hover:bg-white shadow-md transition-all font-medium">
          🐕 宠物 ▾
        </button>
        <div v-if="showPetMenu" @click="showPetMenu = false" class="fixed inset-0 z-40"></div>
        <Transition name="dropdown">
          <div v-if="showPetMenu" class="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-40 z-50 overflow-hidden">
            <router-link to="/preview" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors flex items-center gap-2">
              📖 图鉴
            </router-link>
          </div>
        </Transition>
      </div>

      <!-- Student Menu -->
      <div class="relative" v-if="!batchMode">
        <button @click="showStudentMenu = !showStudentMenu" class="px-3 py-1.5 rounded-lg text-sm bg-white/95 hover:bg-white shadow-md transition-all font-medium">
          👶 宝贝 ▾
        </button>
        <div v-if="showStudentMenu" @click="showStudentMenu = false" class="fixed inset-0 z-40"></div>
        <Transition name="dropdown">
          <div v-if="showStudentMenu" class="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-40 z-50 overflow-hidden">
            <button @click="emit('add-student'); showStudentMenu = false" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">➕ 添加</button>
            <button @click="emit('delete-students'); showStudentMenu = false" class="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">🗑️ 删除</button>
          </div>
        </Transition>
      </div>

      <!-- Eval Menu -->
      <div class="relative" v-if="!batchMode">
        <button @click="showEvalMenu = !showEvalMenu" class="px-3 py-1.5 rounded-lg text-sm bg-white/95 hover:bg-white shadow-md transition-all font-medium">
          ⭐ 评价 ▾
        </button>
        <div v-if="showEvalMenu" @click="showEvalMenu = false" class="fixed inset-0 z-40"></div>
        <Transition name="dropdown">
          <div v-if="showEvalMenu" class="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-40 z-50 overflow-hidden">
            <button @click="emit('start-batch'); showEvalMenu = false" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">✅ 批量</button>
            <button @click="emit('show-rank'); showEvalMenu = false" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">🏆 排行</button>
            <button @click="emit('show-records'); showEvalMenu = false" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">📋 记录</button>
            <hr class="my-1.5 border-gray-100">
            <button @click="emit('show-rules'); showEvalMenu = false" class="w-full text-left px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-colors">⚙️ 规则</button>
          </div>
        </Transition>
      </div>
    </div>
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
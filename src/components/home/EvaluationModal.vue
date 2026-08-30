<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { EVALUATION_CATEGORIES } from '@/data/categories'
import type { Rule, Student } from '@/types'

const props = defineProps<{
  show: boolean
  rules: Rule[]
  student: Student | null
  selectedCount: number
  initialTab: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', rule: Rule): void
}>()

const tab = ref('学习')

// 打开时切换到对应分类（加分/扣分入口）
watch(() => props.show, (value) => {
  if (value) tab.value = props.initialTab
})

// 当前分类下的规则
const currentRules = computed(() => {
  return props.rules.filter(r => r.category === tab.value)
})
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-8 w-full max-w-3xl max-h-[85vh] overflow-auto shadow-2xl animate-scale-in">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
          <span class="text-2xl">⭐</span>
          <template v-if="student">
            为 <span class="text-gradient">{{ student.name }}</span> 评价
          </template>
          <template v-else>
            批量评价 <span class="text-purple-500">{{ selectedCount }}</span> 个宝贝
          </template>
        </h3>

        <!-- 分类标签 -->
        <div class="flex gap-2 mb-6 flex-wrap">
          <button
            v-for="cat in EVALUATION_CATEGORIES"
            :key="cat"
            @click="tab = cat"
            class="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
            :class="tab === cat
              ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            {{ cat }}
          </button>
        </div>

        <!-- 规则网格 - 固定5行高度，超出显示滚动条 -->
        <div class="h-[590px] overflow-y-auto pr-2 custom-scrollbar">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 content-start">
            <button
              v-for="rule in currentRules"
              :key="rule.id"
              @click="emit('select', rule)"
              class="rounded-2xl p-4 text-left transition-all border-2 hover:scale-105 hover:shadow-lg active:scale-95 h-[110px]"
              :class="rule.points > 0
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-400'
                : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:border-red-400'"
            >
              <div class="flex items-center justify-between mb-2">
                <span
                  class="font-bold text-2xl"
                  :class="rule.points > 0 ? 'text-green-500' : 'text-red-500'"
                >
                  {{ rule.points > 0 ? '+' : '' }}{{ rule.points }}
                </span>
                <span
                  class="text-xs px-2 py-1 rounded-full font-medium"
                  :class="rule.points > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
                >
                  {{ rule.points > 0 ? '加分' : '扣分' }}
                </span>
              </div>
              <div class="text-sm text-gray-700 font-medium leading-tight line-clamp-2">{{ rule.name }}</div>
            </button>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <button @click="emit('close')" class="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors">取消</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9);
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #fb923c, #f472b6);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #f97316, #ec4899);
}
</style>
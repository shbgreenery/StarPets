<script setup lang="ts">
import { ref, watch } from 'vue'
import { getLevelProgress, getPetType } from '@/data/pets'
import { getDisplayLevel, getStudentPetImage } from '@/utils/levelStyle'
import { getDecorBgClass, getDecorPendantEmoji } from '@/data/decorations'
import { EVALUATION_CATEGORIES } from '@/data/categories'
import { METRICS, isSleeping } from '@/data/shop'
import type { EvaluationRecord, Rule, Student } from '@/types'

const props = defineProps<{
  show: boolean
  student: Student | null
  rules: Rule[]
  records: EvaluationRecord[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'changePet'): void
  (e: 'savePetName', name: string): void
  (e: 'quickAdd', rule: Rule): void
  (e: 'openShop'): void
}>()

// 生存指标展示列表
const metricsList = [
  { key: 'hunger' as const, ...METRICS.hunger },
  { key: 'cleanliness' as const, ...METRICS.cleanliness },
  { key: 'happiness' as const, ...METRICS.happiness },
]

// 宠物改名状态
const editingPetName = ref(false)
const editPetNameValue = ref('')

// 当前评价分类
const evalTab = ref('学习')

// 打开时重置状态
watch(() => props.show, (value) => {
  if (value) {
    evalTab.value = '学习'
    editingPetName.value = false
  }
})

function startEditName() {
  if (!props.student) return
  editingPetName.value = true
  editPetNameValue.value = props.student.pet_name || ''
}

function saveName() {
  emit('savePetName', editPetNameValue.value)
  editingPetName.value = false
}

// 记录时间格式化
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show && student" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="emit('close')">
      <div class="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl animate-scale-in">
        <!-- 头部 -->
        <div class="relative bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 p-4 sm:p-6 rounded-t-3xl">
          <!-- 顶部操作按钮 -->
          <div class="absolute top-4 right-4 flex gap-2">
            <button v-if="student.pet_type" @click="startEditName()" class="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-full flex items-center gap-1.5 text-white text-sm transition-colors" title="改名字">
              <span>✏️</span>
              <span class="font-medium hidden sm:inline">改名</span>
            </button>
            <button @click="emit('changePet')" class="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-full flex items-center gap-1.5 text-white text-sm transition-colors" title="更换宠物">
              <span>🐾</span>
              <span class="font-medium hidden sm:inline">换宠物</span>
            </button>
            <button @click="emit('close')" class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl transition-colors" title="关闭">
              ×
            </button>
          </div>
          <div class="flex items-center gap-4">
            <div
              class="relative w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg"
              :class="getDecorBgClass(student.deco_bg) || 'bg-white/20 backdrop-blur-sm'"
            >
              <img
                v-if="student.pet_type"
                :src="getStudentPetImage(student)"
                class="w-16 h-16 object-contain"
              />
              <span v-else class="text-4xl">❓</span>
              <span
                v-if="student.deco_pendants?.length"
                class="absolute top-0.5 left-0.5 flex gap-0.5 text-sm drop-shadow"
              >
                <span
                  v-for="pid in student.deco_pendants.slice(0, 3)"
                  :key="pid"
                >{{ getDecorPendantEmoji(pid) }}</span>
              </span>
            </div>
            <div class="text-white">
              <h3 class="text-2xl font-bold">{{ student.name }}</h3>
              <div v-if="editingPetName" class="flex items-center gap-2 mt-1">
                <input
                  v-model="editPetNameValue"
                  type="text"
                  maxlength="20"
                  placeholder="输入名字"
                  class="px-2 py-1 rounded-lg text-gray-800 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button @click="saveName" class="px-2 py-1 bg-white/30 hover:bg-white/40 rounded-lg text-white text-sm transition-colors">确定</button>
                <button @click="editingPetName = false" class="px-2 py-1 bg-black/20 hover:bg-black/30 rounded-lg text-white text-sm transition-colors">取消</button>
              </div>
              <p v-else class="text-white/80 text-sm">
                {{ student.pet_type ? (student.pet_name || getPetType(student.pet_type)?.name) : '未领养' }}
                · Lv.{{ getDisplayLevel(student) }}
                · ✨ {{ student.stars }}
              </p>
            </div>
          </div>
          <!-- 进度条 -->
          <div class="mt-4">
            <div class="flex justify-between text-white/90 text-sm mb-1">
              <span>成长值</span>
              <span v-if="getLevelProgress(student.pet_exp).isMaxLevel" class="flex items-center gap-1">
                <span class="text-yellow-300 font-medium">🏆 已毕业，获得专属徽章</span>
              </span>
              <span v-else>
                {{ getLevelProgress(student.pet_exp).current }}/{{ getLevelProgress(student.pet_exp).required }}
              </span>
            </div>
            <div class="bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300"
                :style="{ width: `${getLevelProgress(student.pet_exp).percentage}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 宠物状态 -->
        <div class="p-4 sm:p-6 border-b border-gray-100">
          <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>💖</span> 宠物状态
            <span v-if="isSleeping(student)" class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">💤 休眠中</span>
          </h4>
          <div class="space-y-3">
            <div v-for="m in metricsList" :key="m.key">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-600 flex items-center gap-1">
                  <span>{{ m.emoji }}</span> {{ m.label }}
                </span>
                <span class="font-bold" :class="student[m.key] < 30 ? 'text-red-500' : 'text-gray-800'">{{ student[m.key] }}</span>
              </div>
              <div class="bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="m.barClass"
                  :style="{ width: `${student[m.key]}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 快速评分 -->
        <div class="p-4 sm:p-6 border-b border-gray-100">
          <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>⚡</span> 快速评价
          </h4>
          <!-- 分类标签 -->
          <div class="flex gap-2 mb-4 flex-wrap">
            <button
              v-for="cat in EVALUATION_CATEGORIES"
              :key="cat"
              @click="evalTab = cat"
              class="px-4 py-1.5 rounded-xl text-sm font-bold transition-all"
              :class="evalTab === cat
                ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
              {{ cat }}
            </button>
          </div>
          <!-- 规则按钮 - 每行5个，固定5行高度 -->
          <div class="max-h-[45vh] sm:h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            <div class="grid grid-cols-3 sm:grid-cols-5 gap-2 content-start">
              <button
                v-for="rule in rules.filter(r => r.category === evalTab && r.points > 0)"
                :key="rule.id"
                @click="emit('quickAdd', rule)"
                class="rounded-xl p-2 text-center transition-all border-2 hover:scale-105 active:scale-95 h-auto min-h-[60px] sm:h-[70px]"
                :class="rule.points > 0
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-400'
                  : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:border-red-400'"
              >
                <div
                  class="text-base font-bold"
                  :class="rule.points > 0 ? 'text-green-500' : 'text-red-500'"
                >
                  {{ rule.points > 0 ? '+' : '' }}{{ rule.points }}
                </div>
                <div class="text-xs text-gray-600 leading-tight line-clamp-2">{{ rule.name }}</div>
              </button>
            </div>
          </div>
        </div>

        <!-- 商城入口 -->
        <div class="p-4 sm:p-6 border-b border-gray-100">
          <button
            @click="emit('openShop')"
            class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <span class="text-xl">🛒</span> 宠物商城
            <span class="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">✨ {{ student.stars }}</span>
          </button>
        </div>

        <!-- 最近记录 -->
        <div class="p-4 sm:p-6">
          <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>📋</span> 最近记录
          </h4>
          <div v-if="records.length === 0" class="text-center py-8 text-gray-400">
            <div class="text-4xl mb-2">📝</div>
            暂无评价记录
          </div>
          <div v-else class="space-y-2 max-h-60 overflow-auto">
            <div
              v-for="record in records"
              :key="record.id"
              class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                :class="record.points > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
              >
                {{ record.points > 0 ? '+' : '' }}{{ record.points }}
              </div>
              <div class="flex-1">
                <div class="font-medium text-gray-800">{{ record.reason }}</div>
                <div class="text-xs text-gray-400">
                  <span class="px-1.5 py-0.5 bg-gray-200 rounded mr-2">{{ record.category }}</span>
                  {{ formatTime(record.timestamp) }}
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
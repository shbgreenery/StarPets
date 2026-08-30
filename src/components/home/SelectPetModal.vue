<script setup lang="ts">
import { ref, watch } from 'vue'
import { PET_TYPES, getPetLevel1Image } from '@/data/pets'
import type { Student } from '@/types'

const props = defineProps<{
  show: boolean
  student: Student | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: { petId: string; petName: string }): void
}>()

const adoptPetId = ref<string | null>(null)
const adoptPetName = ref('')
const imageLoaded = ref<Record<string, boolean>>({})

// 打开时重置选择并预填宠物名
watch(() => props.show, (value) => {
  if (value) {
    adoptPetId.value = null
    adoptPetName.value = props.student?.pet_name || ''
  }
})

function confirmAdopt() {
  if (!adoptPetId.value) return
  emit('confirm', { petId: adoptPetId.value, petName: adoptPetName.value })
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-auto shadow-2xl animate-scale-in">
        <h3 class="text-2xl font-bold mb-6 flex items-center gap-3">
          <span class="text-3xl">🐾</span>
          <span>为 <span class="text-gradient bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">{{ student?.name }}</span> 选择宠物伙伴</span>
        </h3>

        <!-- 宠物网格 - 所有宠物混合显示 -->
        <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <button
            v-for="pet in PET_TYPES"
            :key="pet.id"
            @click="adoptPetId = pet.id"
            :class="adoptPetId === pet.id
              ? 'border-orange-400 from-orange-50 to-pink-50 ring-2 ring-orange-200'
              : 'border-transparent hover:border-orange-300 hover:from-orange-50 hover:to-pink-50'"
            class="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-3 hover:shadow-xl hover:scale-105 transition-all text-center group border-2 overflow-hidden"
          >
            <!-- 装饰性边框 -->
            <div class="absolute inset-0 rounded-2xl border-2 border-dashed border-gray-200 group-hover:border-orange-200 transition-colors"></div>

            <!-- 图片容器 -->
            <div class="relative w-full aspect-square mx-auto mb-2">
              <!-- 加载动画 - 图片加载完成前显示 -->
              <div
                v-if="!imageLoaded[pet.id]"
                class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100/80 to-pink-100/80 rounded-xl"
              >
                <div class="flex gap-1.5">
                  <span class="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                  <span class="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                  <span class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                </div>
              </div>
              <!-- 宠物图片 - 加载完成后淡入显示 -->
              <img
                :src="getPetLevel1Image(pet.id)"
                class="w-full h-full object-contain group-hover:scale-110 transition-all duration-300 rounded-xl p-1"
                :class="imageLoaded[pet.id] ? 'opacity-100' : 'opacity-0'"
                @load="imageLoaded[pet.id] = true"
              />
            </div>

            <!-- 宠物名称 - 放大 -->
            <div class="text-base font-bold mt-2 text-gray-800 group-hover:text-orange-600 transition-colors leading-tight">{{ pet.name }}</div>
          </button>
        </div>

        <!-- 宠物命名 -->
        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">给宠物起个名字 <span class="text-gray-400">（选填）</span></label>
          <input
            v-model="adoptPetName"
            type="text"
            placeholder="留空则默认用品种名"
            maxlength="20"
            class="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:outline-none transition-colors text-gray-800 placeholder-gray-400"
          />
        </div>

        <div class="mt-6 p-4 bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 rounded-xl text-sm text-gray-600 text-center border border-orange-100">
          <span class="text-lg">💡</span> 先点击选中宠物，再起个名字，最后确认领养！
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="emit('close')" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium transition-colors">取消</button>
          <button
            @click="confirmAdopt"
            :disabled="!adoptPetId"
            :class="adoptPetId ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:shadow-lg' : 'bg-gray-300'"
            class="px-6 py-3 rounded-xl font-medium text-white transition-colors disabled:cursor-not-allowed"
          >
            确认领养
          </button>
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
</style>
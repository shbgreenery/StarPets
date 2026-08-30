<script setup lang="ts">
import { SHOP_ITEMS, SHOP_GROUPS } from '@/data/shop'
import type { ShopItem } from '@/data/shop'
import type { Student } from '@/types'

defineProps<{
  show: boolean
  student: Student | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'buy', item: ShopItem): void
}>()
</script>

<template>
  <Transition name="modal">
    <div v-if="show && student" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="emit('close')">
      <div class="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-auto shadow-2xl animate-scale-in p-4 sm:p-6">
        <!-- 头部 -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold flex items-center gap-2">
            <span class="text-2xl">🛒</span> 宠物商城
          </h3>
          <span class="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full font-bold text-yellow-600">
            ✨ {{ student.stars }}
          </span>
        </div>
        <p class="text-sm text-gray-500 mb-5">为 {{ student.name }} 的宠物挑选补给</p>

        <!-- 三组商品 -->
        <div v-for="group in SHOP_GROUPS" :key="group.target" class="mb-5 last:mb-0">
          <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>{{ group.emoji }}</span> {{ group.label }}
          </h4>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="item in SHOP_ITEMS.filter(i => i.target === group.target)"
              :key="item.id"
              class="bg-gray-50 rounded-2xl p-3 border border-gray-100"
            >
              <div class="text-3xl mb-2">{{ item.emoji }}</div>
              <div class="font-bold text-sm text-gray-800">{{ item.name }}</div>
              <div class="text-xs text-green-600 font-medium mb-3">+{{ item.amount }} {{ group.label }}</div>
              <button
                @click="emit('buy', item)"
                :disabled="student.stars < item.price"
                class="w-full py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1"
                :class="student.stars >= item.price
                  ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
              >
                ✨{{ item.price }} 购买
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6">
          <button @click="emit('close')" class="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">关闭</button>
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

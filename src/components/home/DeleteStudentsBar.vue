<script setup lang="ts">
defineProps<{ count: number }>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <Transition name="slide-up">
    <div class="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-3 sm:p-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 z-40 border border-gray-100 w-[calc(100%-2rem)] sm:w-auto pb-[env(safe-area-inset-bottom)]">
      <span class="text-gray-600 py-3 font-medium">已选 <span class="text-red-500 font-bold">{{ count }}</span> 人</span>
      <button
        @click="emit('confirm')"
        :disabled="count === 0"
        class="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 sm:px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
      >
        <span class="text-xl">🗑️</span> 确认删除
      </button>
      <button
        @click="emit('cancel')"
        class="bg-gray-100 text-gray-700 px-4 sm:px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
      >
        取消
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translate(-50%, 100%);
}
</style>
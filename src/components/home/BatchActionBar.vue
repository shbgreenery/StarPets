<script setup lang="ts">
defineProps<{ count: number }>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'sub'): void
}>()
</script>

<template>
  <Transition name="slide-up">
    <div class="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-3 sm:p-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4 z-40 border border-gray-100 w-[calc(100%-2rem)] sm:w-auto pb-[env(safe-area-inset-bottom)]">
      <button
        @click="emit('add')"
        class="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 sm:px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
      >
        <span class="text-xl">⬆️</span> 统一加分
      </button>
      <button
        @click="emit('sub')"
        class="bg-gradient-to-r from-red-400 to-pink-500 text-white px-4 sm:px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
      >
        <span class="text-xl">⬇️</span> 统一扣分
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
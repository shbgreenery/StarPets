<script setup lang="ts">
import { SHOP_ITEMS, SHOP_GROUPS } from '@/data/shop'
import type { ShopItem } from '@/data/shop'
import { DECOR_ITEMS, DECOR_GROUPS, getDecorBgClass, PENDANT_LIMIT } from '@/data/decorations'
import type { DecorationItem, DecorAction } from '@/data/decorations'
import type { Student } from '@/types'

const props = defineProps<{
  show: boolean
  student: Student | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'buy', item: ShopItem): void
  (e: 'decor', action: DecorAction, item: DecorationItem): void
}>()

// 是否已拥有该装饰
function isOwned(item: DecorationItem): boolean {
  return !!props.student && props.student.deco_owned.includes(item.id)
}

// 是否正在佩戴
function isWearing(item: DecorationItem): boolean {
  if (!props.student) return false
  return item.slot === 'bg' ? props.student.deco_bg === item.id : props.student.deco_pendants.includes(item.id)
}

// 佩戴中文案(背景"使用中" / 挂饰"佩戴中")
function wearingLabel(item: DecorationItem): string {
  return item.slot === 'bg' ? '✅ 使用中' : '✅ 佩戴中'
}

// 戴上操作文案
function wearLabel(item: DecorationItem): string {
  return item.slot === 'bg' ? '使用' : '戴上'
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show && props.student" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="emit('close')">
      <div class="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-auto shadow-2xl animate-scale-in p-4 sm:p-6">
        <!-- 头部 -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold flex items-center gap-2">
            <span class="text-2xl">🛒</span> 宠物商城
          </h3>
          <span class="flex items-center gap-1 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full font-bold text-yellow-600">
            ✨ {{ props.student.stars }}
          </span>
        </div>
        <p class="text-sm text-gray-500 mb-5">为 {{ props.student.name }} 的宠物挑选补给</p>

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
                :disabled="props.student.stars < item.price"
                class="w-full py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1"
                :class="props.student.stars >= item.price
                  ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
              >
                ✨{{ item.price }} 购买
              </button>
            </div>
          </div>
        </div>

        <!-- 装扮装饰:背景 + 挂饰 -->
        <div class="mb-4">
          <p class="text-xs text-gray-400 leading-relaxed">
            🎨 买过一次永久拥有,可随时「戴上 / 卸下」;挂饰最多同时戴 {{ PENDANT_LIMIT }} 个。
          </p>
        </div>
        <div v-for="group in DECOR_GROUPS" :key="group.slot" class="mb-5 last:mb-0">
          <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>{{ group.emoji }}</span> {{ group.label }}
          </h4>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="item in DECOR_ITEMS.filter(i => i.slot === group.slot)"
              :key="item.id"
              class="bg-gray-50 rounded-2xl p-3 border border-gray-100"
            >
              <!-- 背景:渐变预览;挂饰:emoji -->
              <div
                v-if="group.slot === 'bg'"
                class="w-10 h-10 rounded-lg mb-2 border border-gray-200"
                :class="getDecorBgClass(item.id)"
              ></div>
              <div v-else class="text-3xl mb-2">{{ item.emoji }}</div>
              <div class="font-bold text-sm text-gray-800">{{ item.name }}</div>
              <div class="text-xs text-gray-400 font-medium mb-3">装扮</div>
              <!-- 未拥有:购买(买完自动戴上) -->
              <button
                v-if="!isOwned(item)"
                @click="emit('decor', 'buy', item)"
                :disabled="props.student.stars < item.price"
                class="w-full py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1"
                :class="props.student.stars >= item.price
                  ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'"
              >
                ✨{{ item.price }} 购买
              </button>
              <!-- 已拥有:戴上 / 佩戴中+卸下 -->
              <template v-else>
                <button
                  v-if="!isWearing(item)"
                  @click="emit('decor', 'wear', item)"
                  class="w-full py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:shadow-lg active:scale-95 transition-all"
                >
                  {{ wearLabel(item) }}
                </button>
                <div v-else class="flex items-center gap-2">
                  <span class="flex-1 text-center py-2 rounded-xl text-sm font-bold bg-green-100 text-green-600 cursor-default">
                    {{ wearingLabel(item) }}
                  </span>
                  <button
                    @click="emit('decor', 'takeOff', item)"
                    class="px-3 py-2 rounded-xl text-sm font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                    title="卸下"
                  >
                    卸下
                  </button>
                </div>
              </template>
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

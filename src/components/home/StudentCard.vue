<script setup lang="ts">
import { getLevelProgress, getPetType } from '@/data/pets'
import PetImage from '@/components/PetImage.vue'
import { getDisplayLevel, getLevelBgClass, getLevelBorderClass, getStudentPetImage } from '@/utils/levelStyle'
import type { Student } from '@/types'

interface ScoreAnimation {
  points: number
  show: boolean
}

defineProps<{
  student: Student
  batchMode: boolean
  deleteMode: boolean
  selected: boolean
  markedForDelete: boolean
  scoreAnimation: ScoreAnimation | null
}>()

const emit = defineEmits<{
  (e: 'click', student: Student): void
}>()
</script>

<template>
  <div
    class="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer relative group card-hover"
    :class="[getLevelBorderClass(getDisplayLevel(student)), {
      'ring-2 ring-purple-400 ring-offset-2': batchMode && selected,
      'ring-2 ring-red-400 ring-offset-2': deleteMode && markedForDelete
    }]"
    @click="emit('click', student)"
  >
    <!-- 评分动效 -->
    <Transition name="score-pop">
      <div
        v-if="scoreAnimation"
        class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
      >
        <div
          class="text-4xl font-bold animate-bounce-in"
          :class="scoreAnimation.points > 0 ? 'text-green-500' : 'text-red-500'"
        >
          {{ scoreAnimation.points > 0 ? '+' : '' }}{{ scoreAnimation.points }}
        </div>
        <div class="absolute inset-0 overflow-hidden">
          <span v-for="i in 6" :key="i" class="absolute text-2xl animate-sparkle" :style="{ left: `${Math.random() * 80 + 10}%`, top: `${Math.random() * 80 + 10}%`, animationDelay: `${i * 100}ms` }">
            {{ scoreAnimation.points > 0 ? '⭐' : '💫' }}
          </span>
        </div>
      </div>
    </Transition>

    <!-- 选中标记 -->
    <Transition name="pop">
      <div
        v-if="batchMode || deleteMode"
        class="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center z-10 shadow-md transition-all"
        :class="batchMode
          ? (selected ? 'bg-gradient-to-r from-purple-400 to-pink-400' : 'bg-white border-2 border-gray-300')
          : (markedForDelete ? 'bg-gradient-to-r from-red-400 to-pink-400' : 'bg-white border-2 border-gray-300')
        "
      >
        <span v-if="(batchMode && selected) || (deleteMode && markedForDelete)" class="text-white text-sm font-bold">✓</span>
      </div>
    </Transition>

    <!-- 宠物图片区域 -->
    <div class="aspect-square flex items-center justify-center relative rounded-t-2xl"
      :class="student.pet_type ? 'bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100' : 'bg-gradient-to-br from-gray-100 via-slate-50 to-gray-100'"
    >
      <!-- 有宠物时使用 PetImage 组件 -->
      <template v-if="student.pet_type">
        <div class="w-full h-full overflow-hidden" style="border-radius: 14px 14px 0 0; margin: -1px -1px 0 -1px; width: calc(100% + 2px);">
          <PetImage
            :src="getStudentPetImage(student)"
            :alt="getPetType(student.pet_type)?.name"
            size="full"
            :rounded="false"
            :show-loading="true"
            class="w-full h-full"
          />
        </div>
      </template>
      <!-- 未领养宠物 -->
      <div v-else class="flex flex-col items-center">
        <span class="text-6xl pet-unknown">❓</span>
        <span class="text-xs text-gray-400 mt-2 group-hover:text-orange-400 transition-colors">点击领养</span>
      </div>

      <!-- 等级徽章 -->
      <div
        class="absolute bottom-3 right-3 font-bold px-3 py-1 rounded-full shadow-lg text-white text-sm"
        :class="`bg-gradient-to-r ${getLevelBgClass(getDisplayLevel(student))}`"
      >
        <span v-if="getDisplayLevel(student) >= 10">👑</span>
        <span v-else>Lv.</span>{{ getDisplayLevel(student) }}
      </div>
    </div>

    <!-- 信息区域 -->
    <div class="p-3 sm:p-4">
      <!-- 学生姓名 + 宠物名 -->
      <div class="flex items-center justify-between mb-2">
        <span class="font-bold text-lg text-gray-800 group-hover:text-orange-500 transition-colors">{{ student.name }}</span>
        <span class="text-xs px-2 py-1 rounded-full"
          :class="student.pet_type ? 'bg-gradient-to-r from-orange-100 to-pink-100 text-orange-600' : 'bg-gray-100 text-gray-400'">
          {{ student.pet_type ? (student.pet_name || getPetType(student.pet_type)?.name) : '未领养' }}
        </span>
      </div>

      <!-- 成长值 + 积分 -->
      <div class="flex items-center justify-between text-sm mb-3">
        <span class="text-gray-500 flex items-center gap-1">
          <template v-if="getLevelProgress(student.pet_exp).isMaxLevel">
            <span class="text-xs text-amber-500 font-medium">🏆 已毕业</span>
          </template>
          <template v-else>
            <span class="text-purple-400">💜</span>
            <span class="font-medium text-purple-600">{{ getLevelProgress(student.pet_exp).current }}</span>
            <span class="text-gray-300">/</span>
            <span>{{ getLevelProgress(student.pet_exp).required }}</span>
          </template>
        </span>
        <span class="font-bold text-lg flex items-center gap-1">
          <span class="text-yellow-400">⭐</span>
          <span class="text-orange-500">{{ student.total_points }}</span>
        </span>
      </div>

      <!-- 进度条 -->
      <div class="bg-gray-100 rounded-full h-2.5 overflow-hidden progress-glow">
        <div
          class="rounded-full h-2.5 transition-all duration-500"
          :class="getDisplayLevel(student) >= 5 ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400' : 'bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400'"
          :style="{ width: `${getLevelProgress(student.pet_exp).percentage}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 评分动效 */
.score-pop-enter-active {
  animation: scorePopIn 0.5s ease-out;
}

.score-pop-leave-active {
  transition: all 0.3s ease;
}

.score-pop-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

@keyframes scorePopIn {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes sparkle {
  0% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.5) rotate(180deg);
  }
  100% {
    opacity: 0;
    transform: scale(0) rotate(360deg);
  }
}

.animate-sparkle {
  animation: sparkle 0.8s ease-out forwards;
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-bounce-in {
  animation: bounceIn 0.5s ease-out;
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.2s ease;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
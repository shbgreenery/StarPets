<script setup lang="ts">
// 宠物特效粒子层。按特效 id 查 FX_CONFIG 的粒子数与动画类型,渲染一组无限循环的 emoji 粒子。
import { DECOR_ITEMS, FX_CONFIG } from '@/data/decorations'

const props = defineProps<{
  fx: string
}>()

interface Particle {
  emoji: string
  left: number   // 初始水平位置(%)
  top: number    // 初始垂直位置(%)(fall/rise 由动画控制,sparkle 固定于此)
  size: number   // 字号(px)
  delay: number  // 动画延迟(负值 = 动画已进行到中途,粒子分散)
  duration: number // 单次动画时长(s)
}

// 组件随 v-if 重建(切换特效会重新生成),故顶层一次性生成稳定粒子,避免重渲染抖动
const style = FX_CONFIG[props.fx]
const particles: Particle[] = (() => {
  const cfg = FX_CONFIG[props.fx]
  if (!cfg) return []
  const emoji = DECOR_ITEMS.find(i => i.id === props.fx)?.emoji || '✨'
  return Array.from({ length: cfg.count }, () => ({
    emoji,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 14 + Math.random() * 18,
    delay: -Math.random() * 8,
    duration: 6 + Math.random() * 5,
  }))
})()

function particleStyle(p: Particle) {
  return {
    left: `${p.left}%`,
    top: `${p.top}%`,
    fontSize: `${p.size}px`,
    animationDelay: `${p.delay}s`,
    animationDuration: `${p.duration}s`,
  }
}
</script>

<template>
  <div v-if="style && particles.length" class="absolute inset-0 overflow-hidden pointer-events-none">
    <span
      v-for="(p, i) in particles"
      :key="i"
      class="fx-particle"
      :class="`fx-${style.anim}`"
      :style="particleStyle(p)"
    >{{ p.emoji }}</span>
  </div>
</template>

<style scoped>
.fx-particle {
  position: absolute;
  line-height: 1;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
}

/* 下落:自上而下带旋转 */
.fx-fall {
  animation-name: fxFall;
}

@keyframes fxFall {
  0% {
    transform: translateY(-15vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(115vh) rotate(360deg);
    opacity: 0;
  }
}

/* 上升:自下而上带反向旋转 */
.fx-rise {
  animation-name: fxRise;
}

@keyframes fxRise {
  0% {
    transform: translateY(115vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(-15vh) rotate(-360deg);
    opacity: 0;
  }
}

/* 原地闪烁 */
.fx-sparkle {
  animation-name: fxSparkle;
}

@keyframes fxSparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0.4);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
  }
}
</style>

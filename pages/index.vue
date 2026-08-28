<script setup lang="ts">
// 宠物主展示页（task-007 / req-005，数值系统 v2）
interface Pet {
  id: number
  name: string
  species: string
  level: number
  exp: number
  satiety: number
  cleanliness: number
  happiness: number
  cap: number
}

interface StarTx {
  id: number
  amount: number
  reason: string
  created_at: string
}

const { data: petsData, refresh } = await useFetch<{ ok: boolean; data: Pet[] }>('/api/pets')
const { data: balanceData } = await useFetch<{ ok: boolean; data: { balance: number } }>('/api/stars/balance')
const { data: starsData } = await useFetch<{ ok: boolean; data: StarTx[] }>('/api/stars')

const pet = computed(() => petsData.value?.data?.[0])
const balance = computed(() => balanceData.value?.data?.balance ?? 0)
const transactions = computed(() => starsData.value?.data ?? [])

const showDetail = ref(false)
const REASON_LABEL: Record<string, string> = {
  task_reward: '任务奖励',
  shop_purchase: '购买道具',
}

// 首次启动无宠物 → 领养页
if (!pet.value) {
  await navigateTo('/adopt')
}

// 每 30 秒刷新，实时看到衰减扣减
onMounted(() => {
  const timer = setInterval(() => { refresh() }, 30_000)
  onUnmounted(() => clearInterval(timer))
})

const SPECIES_EMOJI: Record<string, string> = { 小恐龙: '🦕', 小猫咪: '🐱', 小企鹅: '🐧' }
const speciesEmoji = computed(() => SPECIES_EMOJI[pet.value?.species ?? ''] ?? '🐱')

// 三维状态（点数制，附上限）
const stats = computed(() => {
  const p = pet.value
  if (!p) return []
  const cap = p.cap
  return [
    { key: 'satiety', icon: '🍗', label: '饱腹', value: p.satiety, cap },
    { key: 'cleanliness', icon: '🧼', label: '清洁', value: p.cleanliness, cap },
    { key: 'happiness', icon: '🎈', label: '快乐', value: p.happiness, cap },
  ]
})

// 状态表情分级（基于占上限比例）
function getMood(value: number, cap: number) {
  const ratio = cap > 0 ? value / cap : 0
  if (ratio <= 0) return '😴'
  if (ratio < 0.3) return '😢'
  if (ratio < 0.5) return '😕'
  if (ratio < 0.8) return '🙂'
  return '😄'
}

const overallMood = computed(() => {
  const p = pet.value
  if (!p) return '😄'
  const avg = (p.satiety + p.cleanliness + p.happiness) / 3
  return getMood(avg, p.cap)
})

// 宠物动作：高兴弹跳，冬眠睡觉
const petAnimClass = computed(() => {
  const mood = overallMood.value
  if (mood === '😴') return 'anim-sleep'
  if (mood === '😄') return 'anim-bounce'
  return ''
})

// 成长值进度：升级所需经验 = 等级 × 20
const expToNext = computed(() => (pet.value ? pet.value.level * 20 : 0))
const expPercent = computed(() => {
  if (!pet.value || expToNext.value === 0) return 0
  return Math.min(100, Math.round((pet.value.exp / expToNext.value) * 100))
})

function barWidth(value: number, cap: number) {
  return cap > 0 ? Math.min(100, Math.round((value / cap) * 100)) : 0
}
</script>

<template>
  <section v-if="pet" class="pet-page">
    <header class="pet-header">
      <button class="nav-arrow" disabled aria-label="上一只">←</button>
      <div class="pet-title">
        <span class="text-display">{{ pet?.name }}</span>
        <span class="level-badge">Lv.{{ pet?.level }}</span>
      </div>
      <button class="nav-arrow" disabled aria-label="下一只">→</button>
    </header>

    <div class="pet-stage">
      <span class="pet-emoji" :class="petAnimClass">{{ speciesEmoji }}</span>
      <span class="pet-mood">{{ overallMood }}</span>
    </div>

    <div class="stats">
      <div v-for="s in stats" :key="s.key" class="stat-row">
        <span class="stat-icon">{{ s.icon }}</span>
        <div class="stat-bar">
          <div class="stat-fill" :style="{ width: `${barWidth(s.value, s.cap)}%` }"></div>
        </div>
        <span class="stat-value">{{ s.value }}/{{ s.cap }}</span>
        <span class="stat-mood">{{ getMood(s.value, s.cap) }}</span>
      </div>
    </div>

    <div class="info-row">
      <span class="text-large">⭐ 星星：{{ balance }} 颗</span>
      <span class="text-muted">🌱 成长值：{{ pet?.exp }}/{{ expToNext }}（Lv.{{ pet?.level }} → Lv.{{ (pet?.level ?? 0) + 1 }}）</span>
    </div>

    <button class="btn-touch btn-ghost" @click="showDetail = !showDetail">
      {{ showDetail ? '收起星星明细' : '查看星星明细' }}
    </button>
    <ul v-if="showDetail" class="tx-list">
      <li v-for="tx in transactions" :key="tx.id" class="tx-item">
        <span class="tx-reason">{{ REASON_LABEL[tx.reason] ?? tx.reason }}</span>
        <span class="tx-amount" :class="tx.amount > 0 ? 'pos' : 'neg'">
          {{ tx.amount > 0 ? `+${tx.amount}` : tx.amount }} 星
        </span>
      </li>
    </ul>

    <div class="exp-bar">
      <div class="exp-fill" :style="{ width: `${expPercent}%` }"></div>
    </div>

    <div class="page-actions">
      <NuxtLink to="/shop" class="btn-touch btn-primary">🏪 商店</NuxtLink>
      <NuxtLink to="/tasks" class="btn-touch btn-primary">📋 任务</NuxtLink>
      <NuxtLink to="/record" class="btn-touch btn-primary">📊 成长记录</NuxtLink>
    </div>
  </section>

  <section v-else class="page">
    <p class="text-muted">正在前往领养…</p>
  </section>
</template>

<style scoped>
.pet-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}
.pet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pet-title {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}
.level-badge {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
  padding: 2px 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-small);
}
.nav-arrow {
  width: var(--touch-target);
  height: var(--touch-target);
  border: none;
  background: transparent;
  font-size: var(--font-large);
  color: var(--color-text-muted);
}
.nav-arrow:disabled {
  opacity: 0.3;
}
.pet-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-5);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
}
.pet-emoji {
  font-size: 96px;
  line-height: 1;
}
.pet-mood {
  font-size: var(--font-large);
}
.stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.stat-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.stat-icon {
  font-size: var(--font-large);
  width: 32px;
  text-align: center;
}
.stat-bar {
  flex: 1;
  height: 14px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.stat-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}
.stat-value {
  min-width: 64px;
  text-align: right;
  font-size: var(--font-base);
  font-weight: 600;
}
.stat-mood {
  font-size: var(--font-large);
}
.info-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.exp-bar {
  height: 18px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.exp-fill {
  height: 100%;
  background: var(--color-success);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}
.tx-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.tx-item {
  display: flex;
  justify-content: space-between;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
}
.tx-reason {
  font-size: var(--font-base);
}
.tx-amount {
  font-weight: 700;
}
.tx-amount.pos {
  color: var(--color-success);
}
.tx-amount.neg {
  color: var(--color-danger);
}
</style>

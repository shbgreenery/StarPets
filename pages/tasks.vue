<script setup lang="ts">
// 任务页：创建表单 + 今日看板 + 星级评价（task-005 / task-006）
import confetti from 'canvas-confetti'

interface Task {
  id: number
  title: string
  description: string | null
  type: 'once' | 'daily'
  due_time: string | null
  status: 'pending' | 'done'
  stars: number | null
  overdue: boolean
}

const { data, refresh } = await useFetch<{ ok: boolean; data: Task[] }>('/api/tasks')
const tasks = computed(() => data.value?.data ?? [])

const showForm = ref(false)
const form = reactive({ title: '', description: '', type: 'once' as 'once' | 'daily', due_time: '' })

async function createTask() {
  if (!form.title.trim()) return
  await $fetch('/api/tasks', {
    method: 'POST',
    body: {
      title: form.title,
      description: form.description || null,
      type: form.type,
      due_time: form.type === 'daily' ? form.due_time : null,
    },
  })
  form.title = ''
  form.description = ''
  form.due_time = ''
  showForm.value = false
  refresh()
}

const pendingTasks = computed(() => tasks.value.filter((t) => t.status !== 'done'))
const doneTasks = computed(() => tasks.value.filter((t) => t.status === 'done'))

// —— 星级评价 ——
const RATING_HINTS = [
  '',
  '⭐ 勉强完成，需多次催促',
  '⭐⭐ 按时完成，质量一般',
  '⭐⭐⭐ 顺利完成，态度端正（基准线）',
  '⭐⭐⭐⭐ 完成得很好，超出预期',
  '⭐⭐⭐⭐⭐ 表现惊艳，有明显进步',
]

const ratingTask = ref<Task | null>(null)
const selectedStars = ref(0)
const celebrating = ref(false)
const celebrateStars = ref(0)

function openRating(task: Task) {
  ratingTask.value = task
  selectedStars.value = 0
}

async function submitRating() {
  if (!ratingTask.value || selectedStars.value === 0) return
  const taskId = ratingTask.value.id
  const stars = selectedStars.value
  ratingTask.value = null

  celebrateStars.value = stars
  celebrating.value = true

  confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } })

  await $fetch(`/api/tasks/${taskId}/complete`, { method: 'POST', body: { stars } })
  refresh()

  setTimeout(() => { celebrating.value = false }, 3000)
}
</script>

<template>
  <section class="page">
    <header class="page-header">
      <h1 class="text-display">📋 任务</h1>
      <button class="btn-touch btn-primary add-btn" aria-label="添加任务" @click="showForm = !showForm">＋</button>
    </header>

    <!-- 创建表单 -->
    <form v-if="showForm" class="task-form" @submit.prevent="createTask">
      <input v-model="form.title" class="input" maxlength="20" placeholder="任务标题（必填，≤20 字）" />
      <input v-model="form.description" class="input" placeholder="描述（选填）" />
      <div class="form-row">
        <label class="radio"><input v-model="form.type" type="radio" value="once" /> 一次性</label>
        <label class="radio"><input v-model="form.type" type="radio" value="daily" /> 每日</label>
      </div>
      <label v-if="form.type === 'daily'" class="form-row">
        生效时间
        <input v-model="form.due_time" class="input" type="time" />
      </label>
      <button class="btn-touch btn-primary" type="submit" :disabled="!form.title.trim()">添加任务</button>
    </form>

    <!-- 今日待办 -->
    <h2 class="section-title">今日待办</h2>
    <div v-if="pendingTasks.length === 0" class="empty">今天没有待办任务 🎉</div>
    <ul v-else class="task-list">
      <li v-for="t in pendingTasks" :key="t.id" class="task-item">
        <span v-if="t.overdue" class="dot dot-overdue" title="已逾期"></span>
        <span v-else class="dot dot-pending"></span>
        <span class="task-title">{{ t.title }}</span>
        <span class="task-badge">{{ t.type === 'daily' ? '每日' : '一次性' }}</span>
        <button class="btn-touch btn-done" @click="openRating(t)">确认完成</button>
      </li>
    </ul>

    <!-- 已完成 -->
    <h2 class="section-title">已完成</h2>
    <div v-if="doneTasks.length === 0" class="empty">还没有完成的任务</div>
    <ul v-else class="task-list">
      <li v-for="t in doneTasks" :key="t.id" class="task-item done">
        <span class="check">✓</span>
        <span class="task-title">{{ t.title }}</span>
        <span class="task-stars">+{{ t.stars }}星</span>
      </li>
    </ul>

    <!-- 星级评价弹窗 -->
    <div v-if="ratingTask" class="rating-overlay" @click.self="ratingTask = null">
      <div class="rating-card">
        <h2 class="rating-title">给「{{ ratingTask.title }}」打几星？</h2>
        <div class="stars-row">
          <button v-for="n in 5" :key="n" class="star-btn" @click="selectedStars = n">
            <span :class="{ lit: n <= selectedStars }">⭐</span>
          </button>
        </div>
        <p class="rating-hint">{{ RATING_HINTS[selectedStars] || '点击星星打分' }}</p>
        <div class="rating-actions">
          <button class="btn-touch btn-primary" :disabled="selectedStars === 0" @click="submitRating">确认发放</button>
          <button class="btn-touch btn-ghost" @click="ratingTask = null">取消</button>
        </div>
      </div>
    </div>

    <!-- 庆祝动画 -->
    <div v-if="celebrating" class="celebrate-overlay">
      <div class="celebrate-content">
        <span class="celebrate-emoji">🎉</span>
        <span class="celebrate-text">+{{ celebrateStars }} 星！</span>
        <span class="celebrate-pet">🐱 😄</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.add-btn {
  font-size: var(--font-large);
  padding: 0 var(--space-4);
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
.input {
  font-size: var(--font-base);
  padding: var(--space-3);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  outline: none;
}
.input:focus {
  border-color: var(--color-primary);
}
.form-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.radio {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.section-title {
  font-size: var(--font-large);
  margin-top: var(--space-4);
}
.empty {
  color: var(--color-text-muted);
  padding: var(--space-4);
  text-align: center;
}
.task-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.task-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  min-height: var(--touch-target);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-pending {
  background: var(--color-border);
}
.dot-overdue {
  background: var(--color-warning);
}
.task-title {
  flex: 1;
  font-size: var(--font-base);
}
.task-badge {
  font-size: var(--font-small);
  color: var(--color-text-muted);
}
.btn-done {
  background: var(--color-success);
  color: #fff;
  min-height: 40px;
  font-size: var(--font-small);
  padding: 0 var(--space-3);
}
.task-item.done .task-title {
  color: var(--color-text-muted);
  text-decoration: line-through;
}
.check {
  color: var(--color-success);
  font-weight: 700;
}
.task-stars {
  color: var(--color-primary);
  font-weight: 600;
  font-size: var(--font-small);
}

/* 星级评价弹窗 */
.rating-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.rating-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6) var(--space-5);
  width: 90%;
  max-width: 420px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.rating-title {
  font-size: var(--font-large);
}
.stars-row {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}
.star-btn {
  background: none;
  border: none;
  font-size: 48px;
  cursor: pointer;
  padding: 0;
  filter: grayscale(1) opacity(0.4);
  transition: filter 0.1s ease, transform 0.1s ease;
}
.star-btn .lit {
  filter: grayscale(0) opacity(1);
}
.star-btn:active {
  transform: scale(1.15);
}
.rating-hint {
  color: var(--color-text-muted);
  font-size: var(--font-small);
  min-height: 20px;
}
.rating-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* 庆祝动画 */
.celebrate-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
}
.celebrate-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}
.celebrate-emoji {
  font-size: 80px;
  animation: bounce 0.6s ease infinite alternate;
}
.celebrate-text {
  font-size: var(--font-display);
  color: #fff;
  font-weight: 700;
}
.celebrate-pet {
  font-size: var(--font-large);
}
@keyframes bounce {
  from { transform: translateY(0) scale(1); }
  to { transform: translateY(-20px) scale(1.2); }
}
</style>

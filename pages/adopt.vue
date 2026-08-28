<script setup lang="ts">
// 领养流程：选宠物 → 命名 → 确认（task-004 / req-001）
definePageMeta({ layout: false })

const SPECIES = [
  { name: '小恐龙', emoji: '🦕' },
  { name: '小猫咪', emoji: '🐱' },
  { name: '小企鹅', emoji: '🐧' },
]

type Step = 'select' | 'name' | 'confirm'

const step = ref<Step>('select')
const selected = ref('')
const petName = ref('')
const submitting = ref(false)

// 2-6 个中文字符
const nameValid = computed(() => /^[一-龥]{2,6}$/.test(petName.value))

function pick(name: string) {
  selected.value = name
  step.value = 'name'
}

async function adopt() {
  if (!nameValid.value) return
  submitting.value = true
  try {
    await $fetch('/api/pets', {
      method: 'POST',
      body: { name: petName.value, species: selected.value },
    })
    await navigateTo('/')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="adopt">
    <div class="stars" aria-hidden="true">
      <span
        v-for="i in 12"
        :key="i"
        class="star"
        :style="{ left: `${(i * 8.3) % 100}%`, animationDelay: `${(i * 0.7) % 5}s` }"
      >✦</span>
    </div>

    <div class="adopt-card">
      <template v-if="step === 'select'">
        <h1 class="adopt-title">选一只宠物伙伴吧</h1>
        <p class="adopt-sub">孩子选，家长点</p>
        <div class="species-grid">
          <button v-for="s in SPECIES" :key="s.name" class="species-card" @click="pick(s.name)">
            <span class="species-emoji">{{ s.emoji }}</span>
            <span class="species-name">{{ s.name }}</span>
          </button>
        </div>
      </template>

      <template v-else-if="step === 'name'">
        <h1 class="adopt-title">给它起个名字</h1>
        <p class="adopt-sub">{{ selected }} 期待一个独一无二的名字</p>
        <input v-model="petName" class="name-input" maxlength="6" placeholder="2-6 个中文字符" />
        <p class="name-hint" :class="{ ok: nameValid }">
          {{ petName.length === 0 ? '念给孩子听，它叫什么？' : nameValid ? '✓ 好名字！' : '需要 2-6 个中文字符' }}
        </p>
        <button class="btn-touch btn-primary" :disabled="!nameValid" @click="step = 'confirm'">下一步</button>
        <button class="btn-touch btn-ghost" @click="step = 'select'">返回重选</button>
      </template>

      <template v-else>
        <h1 class="adopt-title">确认仪式</h1>
        <p class="confirm-text">「{{ petName }}」将成为你独一无二的伙伴，确定吗？</p>
        <button class="btn-touch btn-primary" :disabled="submitting" @click="adopt">
          {{ submitting ? '正在领养…' : '确定' }}
        </button>
        <button class="btn-touch btn-ghost" @click="step = 'name'">再想想</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.adopt {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
  background: linear-gradient(180deg, #fff7ed, var(--color-bg));
  position: relative;
  overflow: hidden;
}

.stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.star {
  position: absolute;
  top: -5%;
  font-size: 16px;
  color: var(--color-primary);
  opacity: 0;
  animation: fall 5s linear infinite;
}
@keyframes fall {
  0% { transform: translateY(-5vh); opacity: 0; }
  10% { opacity: 0.8; }
  100% { transform: translateY(105vh); opacity: 0; }
}

.adopt-card {
  position: relative;
  z-index: 1;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6) var(--space-5);
  width: 100%;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.adopt-title {
  font-size: var(--font-display);
  font-weight: 700;
}
.adopt-sub {
  color: var(--color-text-muted);
  font-size: var(--font-base);
}

.species-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}
.species-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-5) var(--space-2);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}
.species-card:hover,
.species-card:active {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}
.species-emoji {
  font-size: 44px;
}
.species-name {
  font-size: var(--font-base);
  font-weight: 600;
}

.name-input {
  font-size: var(--font-large);
  text-align: center;
  padding: var(--space-3);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  outline: none;
  caret-color: var(--color-primary);
}
.name-input:focus {
  border-color: var(--color-primary);
}

.name-hint {
  color: var(--color-text-muted);
  font-size: var(--font-small);
  min-height: 20px;
}
.name-hint.ok {
  color: var(--color-success);
}

.confirm-text {
  font-size: var(--font-large);
  line-height: 1.5;
}
</style>

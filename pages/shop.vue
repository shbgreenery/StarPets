<script setup lang="ts">
// 商店页：消耗品购买（task-009 / req-008）
interface ShopItem {
  id: string
  category: 'food' | 'clean' | 'toy'
  name: string
  emoji: string
  effect: string
  amount: number
  price: number
}

interface Pet {
  id: number
  name: string
  cap: number
}

const { data: shopData } = await useFetch<{ ok: boolean; data: ShopItem[] }>('/api/shop')
const { data: petsData, refresh: refreshPet } = await useFetch<{ ok: boolean; data: Pet[] }>('/api/pets')
const { data: balanceData, refresh: refreshBalance } = await useFetch<{ ok: boolean; data: { balance: number } }>('/api/stars/balance')

const items = computed(() => shopData.value?.data ?? [])
const pet = computed(() => petsData.value?.data?.[0])
const balance = computed(() => balanceData.value?.data?.balance ?? 0)

if (!pet.value) {
  await navigateTo('/adopt')
}

const categories = [
  { key: 'food', label: '🍗 食物' },
  { key: 'clean', label: '🧼 清洁' },
  { key: 'toy', label: '🎈 玩具' },
] as const

const pendingItem = ref<ShopItem | null>(null)
const usingItem = ref<string | null>(null)
const usingAnim = ref('')
const purchasing = ref(false)

function canAfford(item: ShopItem) {
  return balance.value >= item.price
}

async function purchase() {
  if (!pendingItem.value || !pet.value) return
  purchasing.value = true
  try {
    await $fetch('/api/shop/purchase', {
      method: 'POST',
      body: { itemId: pendingItem.value.id, petId: pet.value.id },
    })
    const itemName = pendingItem.value.name
    const category = pendingItem.value.category
    pendingItem.value = null
    usingItem.value = itemName
    usingAnim.value = category === 'food' ? 'anim-wiggle' : category === 'clean' ? 'anim-spin' : 'anim-bounce'
    await Promise.all([refreshPet(), refreshBalance()])
    setTimeout(() => { usingItem.value = null }, 2000)
  } finally {
    purchasing.value = false
  }
}
</script>

<template>
  <section class="page">
    <h1 class="text-display">🏪 商店</h1>
    <p class="text-large">⭐ 星星余额：{{ balance }} 颗</p>

    <template v-for="cat in categories" :key="cat.key">
      <h2 class="section-title">{{ cat.label }}</h2>
      <div class="item-grid">
        <button
          v-for="item in items.filter((i) => i.category === cat.key)"
          :key="item.id"
          class="item-card"
          :disabled="!canAfford(item)"
          @click="pendingItem = item"
        >
          <span class="item-emoji">{{ item.emoji }}</span>
          <span class="item-name">{{ item.name }}</span>
          <span class="item-price">⭐ {{ item.price }}</span>
        </button>
      </div>
    </template>

    <!-- 购买确认弹窗 -->
    <div v-if="pendingItem" class="overlay" @click.self="pendingItem = null">
      <div class="card">
        <h2 class="card-title">确定要花 {{ pendingItem.price }} 颗星买「{{ pendingItem.name }}」吗？</h2>
        <p class="card-sub">效果：+{{ pendingItem.amount }} 点</p>
        <button class="btn-touch btn-primary" :disabled="purchasing" @click="purchase">
          {{ purchasing ? '购买中…' : '确定' }}
        </button>
        <button class="btn-touch btn-ghost" @click="pendingItem = null">取消</button>
      </div>
    </div>

    <!-- 使用动画 -->
    <div v-if="usingItem" class="overlay use-overlay">
      <div class="use-content">
        <span class="use-emoji" :class="usingAnim">🐱</span>
        <span class="use-text">正在使用「{{ usingItem }}」…</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-title {
  font-size: var(--font-large);
  margin-top: var(--space-4);
}
.item-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}
.item-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-2);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
}
.item-card:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.item-emoji {
  font-size: 36px;
}
.item-name {
  font-size: var(--font-base);
  font-weight: 600;
}
.item-price {
  font-size: var(--font-small);
  color: var(--color-primary);
  font-weight: 600;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.card {
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
.card-title {
  font-size: var(--font-large);
}
.card-sub {
  color: var(--color-text-muted);
}

.use-overlay {
  background: rgba(0, 0, 0, 0.5);
}
.use-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}
.use-emoji {
  font-size: 80px;
}
.use-text {
  color: #fff;
  font-size: var(--font-large);
}
@keyframes use-bounce {
  from { transform: translateY(0) scale(1); }
  to { transform: translateY(-15px) scale(1.15); }
}
</style>

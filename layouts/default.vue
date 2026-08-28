<template>
  <div class="app-shell">
    <main class="app-main">
      <slot />
    </main>

    <!-- 底部 Tab：宠物 / 任务 / 我的（PRD 3.2、3.4、3.8 的主入口） -->
    <nav class="tab-bar">
      <NuxtLink to="/" class="tab-item">🐱 宠物</NuxtLink>
      <NuxtLink to="/tasks" class="tab-item">📋 任务</NuxtLink>
      <NuxtLink to="/settings" class="tab-item">⚙️ 我的</NuxtLink>
    </nav>
  </div>
</template>

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-08-28',
  devtools: { enabled: true },

  // SSR 保持默认开启（不设 ssr: false）
  modules: ['@pinia/nuxt'],

  css: ['~/assets/css/main.css', '~/assets/css/animations.css'],

  app: {
    head: {
      title: '成长伙伴',
      // 移动端优先；不阻止缩放，保留无障碍（支持系统字体放大）
      viewport: 'width=device-width, initial-scale=1.0',
    },
  },
})

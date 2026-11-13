import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/cards' },
  { path: '/cards', component: () => import('@/pages/CardsPage.vue') },
  { path: '/quiz', component: () => import('@/pages/QuizPage.vue') },
  { path: '/pdf', component: () => import('@/pages/PDFPage.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/cards' },
]

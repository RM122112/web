import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/games' },
    { path: '/games', component: () => import('@/pages/GamesHome.vue') },
    { path: '/games/sudoku', component: () => import('@/games/sudoku/SudokuGame.vue') },
    {
      path: '/games/guess-the-number',
      component: () => import('@/games/guess-the-number/GuessTheNumberGame.vue'),
    },
    {
      path: '/games/mental-math',
      component: () => import('@/games/mental-math/MentalMathGame.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/games' },
  ],
})

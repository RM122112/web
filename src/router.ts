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
      path: '/pdfs',
      component: () => import('@/pages/SectionPage.vue'),
      props: { title: 'PDFs', description: 'Deine PDF-Sammlung und Lesezeichen.' },
    },
    {
      path: '/cards',
      component: () => import('@/pages/SectionPage.vue'),
      props: { title: 'Karteikarten', description: 'Deine Stapel und dein Lernfortschritt.' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/games' },
  ],
})

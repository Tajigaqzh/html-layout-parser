import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/basic',
      name: 'basic',
      component: () => import('../views/BasicDemo.vue')
    },
    {
      path: '/multi-font',
      name: 'multi-font',
      component: () => import('../views/MultiFontDemo.vue')
    },
    {
      path: '/css-separation',
      name: 'css-separation',
      component: () => import('../views/CssSeparationDemo.vue')
    },
    {
      path: '/output-modes',
      name: 'output-modes',
      component: () => import('../views/OutputModesDemo.vue')
    },

    {
      path: '/worker',
      name: 'worker',
      component: () => import('../views/WorkerDemo.vue')
    }
  ]
})

export default router

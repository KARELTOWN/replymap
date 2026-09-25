import { createRouter, createWebHistory, useRoute } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    //Authentification
    {
      path: '/',
      name: 'Signin',
      component: () => import('../views/Auth/Signin.vue'),
      meta: {
        title: 'Connexion',
      },
    },
  ],
})

export default router

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} | BugReveal`
  return next()
})

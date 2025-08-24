import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'Dashboard.vue',
      component: () => import('../views/Dashboard.vue'),
      meta: {
        title: 'Dashboard',
        requiredAuth: true,
      },
    },
    {
      path: '/projets',
      name: 'Projets',
      component: () => import('../views/Pages/Project/Project.vue'),
      meta: {
        title: 'Projets',
        requiredAuth: true,
      },
    },
    // Sessions
    {
      path: '/sessions',
      name: 'Sessions',
      component: () => import('../views/Pages/Session/Session.vue'),
      meta: {
        title: 'Sessions',
        requiredAuth: true,
      },
    },
    {
      path: '/session/detail',
      name: 'Session-detail',
      component: () => import('../views/Pages/Session/SessionDetail.vue'),
      meta: {
        title: 'Session Detail',
        requiredAuth: true,
      },
    },
    // Feedback
    {
      path: '/feedbacks',
      name: 'Feedbacks',
      component: () => import('../views/Pages/Feedback/Feedback.vue'),
      meta: {
        title: 'Feedbacks',
        requiredAuth: true,
      },
    },
    // Evénements
    {
      path: '/evenements',
      name: 'Evenements',
      component: () => import('../views/Pages/Event/Event.vue'),
      meta: {
        title: 'Evénements',
        requiredAuth: true,
      },
    },
    // Profile
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/Pages/Profile/UserProfile.vue'),
      meta: {
        title: 'Profile',
        requiredAuth: true,
      },
    },
    // Autres pages
    {
      path: '/error-404',
      name: '404 Error',
      component: () => import('../views/Errors/FourZeroFour.vue'),
      meta: {
        title: '404 Error',
        requiredAuth: true,
      },
    },
    //Authentification
    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/Auth/Signin.vue'),
      meta: {
        title: 'Signin',
      },
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/Auth/Signup.vue'),
      meta: {
        title: 'Signup',
      },
    },
    {
      path: '/confirmation',
      name: 'Confirmation',
      component: () => import('../views/Auth/ConfirmationCode.vue'),
      meta: {
        title: 'Confirmation',
      },
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('../views/Auth/ResetPassword.vue'),
      meta: {
        title: 'ResetPassword',
      },
    },
    {
      path: '/new-password',
      name: 'NewPassword',
      component: () => import('../views/Auth/NewPassword.vue'),
      meta: {
        title: 'NewPassword',
      },
    },
  ],
})

export default router

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} | Replay MAP`
  const replay_map_token = localStorage.getItem('replay_map_token')
  const data = replay_map_token !== null ? JSON.parse(replay_map_token) : null

  const token = data?.token

  if (to.meta.requiredAuth && !token) {
    return next('/signin')
  } else if (!to.meta.requiredAuth && token) {
    return next('/')
  }
  return next()
})

import { createRouter, createWebHistory, useRoute } from 'vue-router'
import { getSession, hasSessionCookie, refreshAccessToken } from '@/composables/request'

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
        title: "Vue d'ensemble",
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
        title: 'Détail de session',
        requiredAuth: true,
      },
    },
    // Feedback
    // The route was commented out while the side menu pointed to it: the
    // "Feedbacks" entry led nowhere.
    {
      path: '/feedbacks',
      name: 'Feedbacks',
      component: () => import('../views/Pages/Feedback/Feedback.vue'),
      meta: {
        title: 'Feedbacks',
        requiredAuth: true,
      },
    },
    // Events
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
        title: 'Page introuvable',
        requiredAuth: true,
      },
    },
    //Authentification
    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/Auth/Signin.vue'),
      meta: {
        title: 'Connexion',
      },
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/Auth/Signup.vue'),
      meta: {
        title: 'Créer un compte',
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
        title: 'Mot de passe oublié',
      },
    },
    {
      path: '/new-password',
      name: 'NewPassword',
      component: () => import('../views/Auth/NewPassword.vue'),
      meta: {
        title: 'Nouveau mot de passe',
      },
    },
    {
      path: '/integration-finalize/:project_id/:integration',
      name: 'IntegrationFinalize',
      component: () => import('../views/Pages/Integration/Finalize.vue'),
      meta: {
        title: 'Intégration finalisée',
        requiredAuth: true,
      },
    },

    {
      path: '/integration-configuration',
      name: 'IntegrationConfiguration',
      component: () => import('../views/Pages/Integration/Configuration.vue'),
      meta: {
        title: "Configuration de l'intégration",
        requiredAuth: true,
      },
    },
  ],
})

export default router

// No access token but a session cookie (for instance a session opened in the
// SSO window): the session is renewed silently instead of asking to sign in.
router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title} | BugReveal`
  let token = getSession()?.token
  if (!token && hasSessionCookie()) {
    token = (await refreshAccessToken()) ?? undefined
  }

  if (to.meta.requiredAuth && !token) {
    return next('/signin')
  } else if (!to.meta.requiredAuth && token) {
    return next('/')
  }
  return next()
})

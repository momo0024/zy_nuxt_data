export default defineNuxtRouteMiddleware((to) => {
  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/register']

  const authStore = useAuthStore()
  authStore.loadFromStorage()

  const isPublic = publicRoutes.includes(to.path)

  if (!authStore.isLoggedIn && !isPublic) {
    return navigateTo('/login')
  }

  if (authStore.isLoggedIn && isPublic) {
    return navigateTo('/')
  }
})

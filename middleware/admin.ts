export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  authStore.loadFromStorage()

  if (authStore.user?.role !== 'admin') {
    return navigateTo('/')
  }
})

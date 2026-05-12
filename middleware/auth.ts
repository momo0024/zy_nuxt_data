export default defineNuxtRouteMiddleware((to) => {
  // 服务端跳过（无法访问 localStorage），认证在客户端处理
  if (import.meta.server) return

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

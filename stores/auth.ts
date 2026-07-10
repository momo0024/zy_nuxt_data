import { defineStore } from 'pinia'
import { clearPageInit } from '~/composables/usePageInit'
import { MOCK_USERS, ROLE_PERMISSIONS } from '~/data/mock'

interface User {
  id: string
  username: string
  name: string
  role: string
  roleName: string
  tenant: string
  avatar: string
  allowedCategories: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function loadFromStorage() {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('zhizhi_user')
      if (stored) {
        const parsed = JSON.parse(stored) as User
        const valid = MOCK_USERS.some(u => u.id === parsed.id && u.role === parsed.role)
        user.value = valid ? parsed : null
        if (!valid) {
          localStorage.removeItem('zhizhi_user')
        }
      }
    } catch {
      user.value = null
    }
  }

  function login(username: string, password: string): { success: boolean; error?: string } {
    const found = MOCK_USERS.find(u => u.username === username && u.password === password)
    if (!found) {
      return { success: false, error: '用户名或密码错误' }
    }
    const loggedUser: User = {
      id: found.id,
      username: found.username,
      name: found.name,
      role: found.role,
      roleName: found.roleName,
      tenant: found.tenant,
      avatar: found.avatar,
      allowedCategories: ROLE_PERMISSIONS[found.role] || ROLE_PERMISSIONS.user
    }
    user.value = loggedUser
    localStorage.setItem('zhizhi_user', JSON.stringify(loggedUser))
    return { success: true }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('zhizhi_user')
    clearPageInit()
  }

  return { user, isLoggedIn, isAdmin, loadFromStorage, login, logout }
})

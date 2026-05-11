import { defineStore } from 'pinia'
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

  function loadFromStorage() {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('zhizhi_user')
      if (stored) {
        user.value = JSON.parse(stored)
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

  function register(name: string, username: string, password: string): { success: boolean; error?: string } {
    // Check duplicates in mock + any registered users
    const existing = MOCK_USERS.find(u => u.username === username)
    const storedExtra = JSON.parse(localStorage.getItem('zhizhi_extra_users') || '[]')
    const dupExtra = storedExtra.find((u: any) => u.username === username)
    if (existing || dupExtra) {
      return { success: false, error: '用户名已存在，请换一个' }
    }
    const newUser = {
      id: `u${Date.now()}`,
      username,
      password,
      name,
      role: 'user',
      roleName: '普通用户',
      tenant: '智知云',
      avatar: name.slice(0, 2).toUpperCase()
    }
    storedExtra.push(newUser)
    localStorage.setItem('zhizhi_extra_users', JSON.stringify(storedExtra))

    const loggedUser: User = {
      ...newUser,
      allowedCategories: ROLE_PERMISSIONS.user
    }
    user.value = loggedUser
    localStorage.setItem('zhizhi_user', JSON.stringify(loggedUser))
    return { success: true }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('zhizhi_user')
  }

  return { user, isLoggedIn, loadFromStorage, login, register, logout }
})

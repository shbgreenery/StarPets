import { ref, computed } from 'vue'
import type { User } from '@/types'
import { login as dbLogin, register as dbRegister } from '@/db/auth'

// 全局状态（模块级别单例）
const user = ref<User | null>(null)

// 初始化用户状态
const savedUser = localStorage.getItem('user')
if (savedUser) {
  try {
    user.value = JSON.parse(savedUser)
  } catch {
    localStorage.removeItem('user')
  }
}

// 如果没有用户，自动设置为游客
if (!user.value) {
  const guestUser: User = { id: 'guest', username: '游客', isGuest: true }
  user.value = guestUser
  localStorage.setItem('user', JSON.stringify(guestUser))
}

const isLoggedIn = computed(() => !!user.value && !user.value.isGuest)
const isGuest = computed(() => user.value?.isGuest ?? true)
const username = computed(() => user.value?.username || '游客')

function setUser(userData: User) {
  user.value = userData
  localStorage.setItem('user', JSON.stringify(userData))
}

function logout() {
  const guestUser: User = { id: 'guest', username: '游客', isGuest: true }
  user.value = guestUser
  localStorage.setItem('user', JSON.stringify(guestUser))
}

async function login(username: string, password: string): Promise<User> {
  const u = await dbLogin(username, password)
  setUser(u)
  return u
}

async function register(username: string, password: string): Promise<User> {
  const u = await dbRegister(username, password)
  setUser(u)
  return u
}

export function useAuth() {
  return {
    user,
    isLoggedIn,
    isGuest,
    username,
    setUser,
    logout,
    login,
    register
  }
}

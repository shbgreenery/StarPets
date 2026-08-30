import { db } from './index'
import type { UserRow } from './index'
import { hashPassword, verifyPassword } from '@/utils/password'
import type { User } from '@/types'

function toUser(row: UserRow): User {
  return { id: row.id, username: row.username, isGuest: !!row.is_guest }
}

export async function register(username: string, password: string): Promise<User> {
  if (!username || !password) throw new Error('用户名和密码不能为空')
  if (username.length < 3 || username.length > 20) throw new Error('用户名长度3-20字符')
  if (password.length < 6) throw new Error('密码至少6位')

  const existing = await db.users.where('username').equals(username).first()
  if (existing) throw new Error('用户名已存在')

  const id = crypto.randomUUID()
  const row: UserRow = {
    id, username, password_hash: await hashPassword(password), is_guest: 0, created_at: Date.now()
  }
  await db.users.add(row)
  return toUser(row)
}

export async function login(username: string, password: string): Promise<User> {
  if (!username || !password) throw new Error('用户名和密码不能为空')
  const row = await db.users.where('username').equals(username).first()
  if (!row) throw new Error('用户名或密码错误')
  if (!(await verifyPassword(password, row.password_hash))) throw new Error('用户名或密码错误')
  return toUser(row)
}

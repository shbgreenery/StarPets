import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'
import { register, login } from './auth'

beforeEach(async () => {
  await db.open()
  await clearAll()
  await initDb()
})

describe('认证', () => {
  it('注册成功返回用户', async () => {
    const u = await register('teacher', 'secret6')
    expect(u.username).toBe('teacher')
    expect(u.isGuest).toBe(false)
  })

  it('登录成功', async () => {
    await register('teacher', 'secret6')
    const u = await login('teacher', 'secret6')
    expect(u.username).toBe('teacher')
  })

  it('密码错误登录失败', async () => {
    await register('teacher', 'secret6')
    await expect(login('teacher', 'wrong!')).rejects.toThrow()
  })

  it('用户名重复注册失败', async () => {
    await register('teacher', 'secret6')
    await expect(register('teacher', 'secret6')).rejects.toThrow()
  })

  it('用户名太短注册失败', async () => {
    await expect(register('ab', 'secret6')).rejects.toThrow()
  })
})

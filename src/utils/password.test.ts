import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password 哈希', () => {
  it('相同密码产生相同哈希', async () => {
    const h1 = await hashPassword('abc123')
    const h2 = await hashPassword('abc123')
    expect(h1).toBe(h2)
  })

  it('哈希是 64 位 hex 字符串', async () => {
    const h = await hashPassword('abc123')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
  })

  it('不同密码产生不同哈希', async () => {
    const h1 = await hashPassword('abc123')
    const h2 = await hashPassword('abc124')
    expect(h1).not.toBe(h2)
  })

  it('verifyPassword 正确校验', async () => {
    const h = await hashPassword('secret6')
    expect(await verifyPassword('secret6', h)).toBe(true)
    expect(await verifyPassword('wrong', h)).toBe(false)
  })
})

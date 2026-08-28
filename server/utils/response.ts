import type { H3Event } from 'h3'

/** 统一成功响应体：{ ok: true, data } */
export function ok<T>(data: T) {
  return { ok: true as const, data }
}

/** 统一失败响应体：设置 HTTP 状态码并返回结构化错误 { ok: false, error } */
export function fail(event: H3Event, statusCode: number, message: string, code?: string) {
  setResponseStatus(event, statusCode)
  return { ok: false as const, error: { message, code } }
}

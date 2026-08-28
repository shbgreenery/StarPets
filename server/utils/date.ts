// 本地日期工具（避免 UTC 时区偏移）

/** 本地日期字符串 YYYY-MM-DD */
export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

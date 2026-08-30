// 评价分类（多个组件共享）
export const EVALUATION_CATEGORIES = ['学习', '行为', '健康', '其他'] as const

// 分类图标（用于规则管理页）
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    '学习': '📚',
    '行为': '🎯',
    '健康': '💪',
    '其他': '📌'
  }
  return icons[category] || '📌'
}
import { calculateLevel, getPetLevelImage } from '@/data/pets'
import type { Student } from '@/types'

// 等级徽章背景渐变
export function getLevelBgClass(level: number): string {
  if (level >= 10) return 'from-yellow-400 via-amber-400 to-orange-400'
  if (level >= 7) return 'from-pink-400 via-rose-400 to-red-400'
  if (level >= 5) return 'from-purple-400 via-violet-400 to-indigo-400'
  if (level >= 3) return 'from-blue-400 via-cyan-400 to-teal-400'
  return 'from-gray-400 via-slate-400 to-zinc-400'
}

// 等级边框样式 - 每个等级都不同
export function getLevelBorderClass(level: number): string {
  const borders: Record<number, string> = {
    1: 'border border-gray-200', // 浅灰色细边框
    2: 'border-2 border-gray-300', // 灰色
    3: 'border-2 border-blue-400 shadow-md shadow-blue-400/10', // 蓝色
    4: 'border-2 border-cyan-400 shadow-md shadow-cyan-400/15', // 青色
    5: 'border-2 border-purple-400 shadow-lg shadow-purple-400/20', // 紫色
    6: 'border-2 border-pink-400 shadow-lg shadow-pink-400/25', // 粉色
    7: 'border-2 border-rose-400 shadow-xl shadow-rose-400/30', // 红色
    8: 'border-3 border-yellow-400 shadow-xl shadow-yellow-400/40', // 金色
  }
  return borders[level] || ''
}

// 计算显示等级（基于经验值实时计算，修复数据不一致问题）
export function getDisplayLevel(student: Student): number {
  return calculateLevel(student.pet_exp)
}

// 根据学生当前等级显示对应等级的宠物图片
export function getStudentPetImage(student: Student): string {
  if (!student.pet_type) return ''
  return getPetLevelImage(student.pet_type, student.pet_level)
}
// 宝贝（基于 db 层 StudentRow，保持一致）
import type { StudentRow } from '@/db/index'
export type Student = StudentRow

// 评价规则
export interface Rule {
  id: string
  name: string
  points: number
  category: string
  is_custom?: number
  created_at?: number
}

// 评价记录
export interface EvaluationRecord {
  id: string
  student_id: string
  points: number
  reason: string
  category: string
  timestamp: number
  student_name?: string
}

// 徽章
export interface Badge {
  id: string
  student_id: string
  pet_type: string
  earned_at: number
}

// 分页响应
export interface PaginatedResponse<T> {
  records: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
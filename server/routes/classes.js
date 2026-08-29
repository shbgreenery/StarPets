import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// 获取班级列表（只返回当前用户的班级）
router.get('/', authMiddleware, (req, res) => {
  const classes = db.prepare('SELECT * FROM classes WHERE user_id = ? ORDER BY created_at DESC').all(req.userId)
  res.json({ classes })
})

// 获取班级学生列表
router.get('/:id/students', authMiddleware, (req, res) => {
  const classInfo = db.prepare('SELECT user_id FROM classes WHERE id = ?').get(req.params.id)

  if (!classInfo) {
    return res.status(404).json({ error: '班级不存在' })
  }
  if (classInfo.user_id !== req.userId) {
    return res.status(403).json({ error: '无权访问此班级' })
  }

  const students = db.prepare('SELECT * FROM students WHERE class_id = ? ORDER BY name').all(req.params.id)
  res.json({ students })
})

// 创建班级（关联当前用户）
router.post('/', authMiddleware, (req, res) => {
  const { name } = req.body
  const id = uuidv4()
  const now = Date.now()

  db.prepare('INSERT INTO classes (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.userId, name, now, now)

  res.json({ id, user_id: req.userId, name, created_at: now, updated_at: now })
})

// 更新班级
router.put('/:id', authMiddleware, (req, res) => {
  const { name } = req.body
  const classInfo = db.prepare('SELECT user_id FROM classes WHERE id = ?').get(req.params.id)

  if (!classInfo) {
    return res.status(404).json({ error: '班级不存在' })
  }
  if (classInfo.user_id !== req.userId) {
    return res.status(403).json({ error: '无权修改' })
  }

  const now = Date.now()
  db.prepare('UPDATE classes SET name = ?, updated_at = ? WHERE id = ?').run(name, now, req.params.id)
  res.json({ success: true })
})

// 删除班级
router.delete('/:id', authMiddleware, (req, res) => {
  const classInfo = db.prepare('SELECT user_id FROM classes WHERE id = ?').get(req.params.id)

  if (!classInfo) {
    return res.status(404).json({ error: '班级不存在' })
  }
  if (classInfo.user_id !== req.userId) {
    return res.status(403).json({ error: '无权删除' })
  }

  // 先删除该班级下所有学生的徽章和评价记录
  db.prepare('DELETE FROM badges WHERE student_id IN (SELECT id FROM students WHERE class_id = ?)').run(req.params.id)
  db.prepare('DELETE FROM evaluation_records WHERE class_id = ?').run(req.params.id)
  // 删除学生
  db.prepare('DELETE FROM students WHERE class_id = ?').run(req.params.id)
  // 删除班级
  db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

export default router

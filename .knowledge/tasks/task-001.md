---
id: task-001
type: task
status: done
title: 后端：students 加 pet_name 字段 + 领养/改名接口
created: 2026-08-29
updated: 2026-08-29
requirement: req-001
depends_on: []
tags: [后端, 数据库, API]
---

# 任务: 后端宠物命名支持

## 描述
1. `students` 表新增 `pet_name TEXT` 字段（db.js initDb 迁移，兼容已有表）
2. `PUT /students/:id/pet` 接收 `{ petType, petName? }`，写入 pet_name（空则 NULL）
3. 新增改名接口 `PUT /students/:id/pet/name`，接收 `{ petName }`，不影响 level/exp

## 验收标准
- 领养后 pet_name 正确落库
- 改名接口能更新 pet_name 且不重置 pet_level/pet_exp

## 实现记录
- 2026-08-29: 完成数据库迁移（pet_name 字段）、领养接口接收 petName、新增改名接口 `PUT /:id/pet/name`，端到端验证通过

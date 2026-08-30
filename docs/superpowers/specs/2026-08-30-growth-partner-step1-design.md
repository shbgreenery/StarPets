# 成长伙伴 · 第一步改造设计（去掉班级/登录，学生→宝贝）

- **日期**：2026-08-30
- **状态**：待评审
- **主题**：将「班级宠物园」瘦身为「成长伙伴」家长单机版的第一步——去掉班级管理与登录，把「学生」概念转为「宝贝」

---

## 1. 背景与目标

产品从「教师班级管理工具」转向「家长亲子习惯养成工具」（见 `docs/成长伙伴.html` PRD）。这一步只做**瘦身 + 概念转换**，不引入 PRD 的新功能（任务系统、星级评价、三维状态、商店、冬眠等后续逐步做）。

三个明确改动：
1. 去掉班级管理 —— 宝贝直接是平铺列表，无班级分组。
2. 去掉登录 —— 单机使用，直接进入，无账号。
3. 学生 → 宝贝 —— 概念从「教师的学生」转为「家长的孩子」。

## 2. 数据模型变化（`src/db/index.ts`）

| 操作 | 内容 |
|------|------|
| 删表 | `classes`、`users` |
| 删类型 | `ClassRow`、`UserRow` |
| 改 | `StudentRow` 去掉 `class_id`、`student_no` |
| 改 | `EvaluationRecordRow` 去掉 `class_id` |
| 改 | `initDb()` 去掉「游客用户」初始化 |

改后 schema（5 张表）：

```
students: 'id, name, total_points'
badges: 'id, student_id, pet_type'
evaluation_rules: 'id, category, is_custom'
evaluation_records: 'id, student_id, timestamp'
settings: 'key'
```

## 3. 数据访问层变化

### 3.1 `src/db/classes.ts`

删除：`getClasses`、`createClass`、`updateClass`、`deleteClass`。

保留并调整签名：
- `getStudents(): Promise<StudentRow[]>`（无参数，返回全部宝贝，按 name 排序）
- `addStudent(name: string): Promise<StudentRow>`（去 classId、studentNo）
- `updateStudent(id: string, name: string): Promise<void>`（去 studentNo）
- `importStudents(list: { name: string }[]): Promise<{ imported: number }>`（去 classId、studentNo）
- `deleteStudent(id)`、`updateStudentPet(id, petType, petName?)`、`updateStudentPetName(id, petName)` 保留不变

### 3.2 `src/db/evaluations.ts`

- `addEvaluation`：入参去 `classId`，仅 `{ studentId, points, reason, category }`；`evaluation_records.add` 去掉 `class_id` 字段
- `getClassEvaluations` → `getEvaluations(page, pageSize)`：全局分页（所有宝贝的评价，按 timestamp 倒序）
- `deleteLatestEvaluation()`：去 classId，撤回全局最新一条

### 3.3 `src/db/auth.ts`

整个文件删除（含 `auth.test.ts`）。

## 4. 认证与 UI

- 删除 `src/composables/useAuth.ts`、`src/components/AuthModal.vue`
- `src/types/index.ts`：删 `Class`、`User`；`Student` 去掉 `class_id`/`student_no`；`EvaluationRecord` 去掉 `class_id`
- `Home.vue`：
  - 删班级状态（`classes`/`currentClass`/`newClassName`/`editingClass`/`showClassModal`）、班级函数（`loadClasses`/`selectClass`/`handleCreateClass`/`handleUpdateClass`/`handleDeleteClass`/`openCreateClassModal`/`openEditClassModal`）及对应模板 UI
  - 删用户认证（`useAuth` 引用、`showAuthModal`、用户菜单、`AuthModal` 组件）
  - `loadStudents()` 改为无班级：`students.value = await getStudents()`
  - 文案「学生」→「宝贝」、「添加学生」→「添加宝贝」、学号相关文案删除
  - 评价记录分页从「按班级」改为「全局」（`getEvaluations`）
  - `undoLastEvaluation` 的「撤回最新」改为 `deleteLatestEvaluation()`（无参数）

## 5. 关键决策

1. **内部表名 `students` 保留**，仅界面文案改「宝贝」。后续引入任务系统时再决定是否整体改名。
2. **评价记录全局化**：宝贝平铺后，评价记录按时间倒序全局展示（符合家长单机使用直觉）。

## 6. 测试

- 删 `src/db/auth.test.ts`
- 改 `src/db/classes.test.ts`（去 classId/studentNo）、`src/db/evaluations.test.ts`（去 classId）、`src/db/index.test.ts`（去 classes/users 断言）
- 测试 helper 同步调整（不再创建班级）

## 7. 验收标准

- [ ] `pnpm test:run` 全部通过
- [ ] `pnpm run build` 成功（vue-tsc 类型检查通过）
- [ ] 本地 `pnpm dev` 启动后：无班级选择、无登录入口，直接是「宝贝」列表
- [ ] 添加宝贝、评价加减分、换宠物、排行榜、撤回评价等核心流程正常
- [ ] 代码中无 `classes`/`users`/`classId`/`class_id`/`useAuth`/`AuthModal` 残留引用

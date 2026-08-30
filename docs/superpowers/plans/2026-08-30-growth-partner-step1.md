# 成长伙伴 · 第一步改造 实现计划

> **For agentic workers:** 本计划由 controller 直接执行（改动机械：删除 + 改参数 + 改文案，强耦合，不适合拆分 subagent）。Steps 用 checkbox 语法跟踪。

**Goal:** 去掉班级管理与登录，把「学生」概念转为「宝贝」，将班级宠物园瘦身为家长单机版。

**Architecture:** 数据层删 `classes`/`users` 两张表与相关函数，`students` 表去掉 `class_id`/`student_no` 变平铺宝贝；评价记录去掉 `class_id` 变全局；删认证（useAuth/AuthModal）；Home.vue 删班级/登录 UI，文案「学生」→「宝贝」。

**Tech Stack:** Vue 3 + TypeScript、Dexie、Vitest、pnpm。

**Spec:** `docs/superpowers/specs/2026-08-30-growth-partner-step1-design.md`

## Global Constraints

- 表名 `students` 保留不变，仅界面文案改「宝贝」。
- 评价记录全局化：`getClassEvaluations` → `getEvaluations`（全局分页），`deleteLatestEvaluation` 无参数。
- 宝贝去掉 `student_no`（学号）字段。
- 包管理器 pnpm（命令用 `pnpm`，不要用 `npm`）。
- 完成后代码中不得残留 `classes`/`users`/`classId`/`class_id`/`useAuth`/`AuthModal` 引用（`src/db` 里的 `classes.ts`/`class_id` 等作为文件名/字段名已在各任务明确删除，最终以 Task 5 的 grep 校验为准）。

---

## Task 1: 数据模型瘦身（db/index.ts + types/index.ts + 测试）

**Files:**
- Modify: `src/db/index.ts`
- Modify: `src/types/index.ts`
- Modify: `src/db/index.test.ts`

**改动：**

`src/db/index.ts`：
- 删 `ClassRow`、`UserRow` 接口
- `StudentRow` 去掉 `class_id`、`student_no` 字段（保留 name/total_points/pet_type/pet_name/pet_level/pet_exp/created_at）
- `EvaluationRecordRow` 去掉 `class_id` 字段
- 删 `classes`、`users` 两个 Table 声明
- `this.version(1).stores(...)` 删 `classes`、`users` 两行；`students` 改为 `'id, name, total_points'`；`evaluation_records` 改为 `'id, student_id, timestamp'`
- `initDb()` 删掉「游客用户」初始化块（`db.users.get('guest')` 那段）

`src/types/index.ts`：
- 删 `Class`、`User` 接口
- `Student` 去掉 `class_id`、`student_no`
- `EvaluationRecord` 去掉 `class_id`
- 删 `ApiResponse`、`PaginatedResponse`（若已无引用；保留亦可，以 grep 为准）

`src/db/index.test.ts`：
- 删「有 7 张表」断言中的 `classes`/`users`，改为 5 张表
- 删「初始化游客用户」测试

- [ ] **Step 1:** 改 `src/db/index.ts`、`src/types/index.ts`、`src/db/index.test.ts`
- [ ] **Step 2:** 跑 `pnpm test:run src/db/index.test.ts`（此时 classes.ts 等仍引用已删表，会有类型错误，属预期，仅确认 index 本身逻辑）
- [ ] **Step 3:** 提交（与 Task 2 一起提交，见下）

## Task 2: 数据访问层重构（classes.ts + evaluations.ts + 删 auth.ts + 测试）

**Files:**
- Modify: `src/db/classes.ts`
- Modify: `src/db/evaluations.ts`
- Delete: `src/db/auth.ts`、`src/db/auth.test.ts`
- Modify: `src/db/classes.test.ts`、`src/db/evaluations.test.ts`

**改动：**

`src/db/classes.ts`：
- 删 `getClasses`/`createClass`/`updateClass`/`deleteClass` 四个函数
- `getStudents()` 无参数：`db.students.orderBy('name').toArray()`（或 `sortBy('name')`）
- `addStudent(name: string)`：去 classId/studentNo，构造 `StudentRow` 时不再有 `class_id`/`student_no`
- `updateStudent(id, name)`：去 studentNo，`db.students.update(id, { name })`
- `importStudents(list: { name: string }[])`：去 classId/studentNo
- `deleteStudent`/`updateStudentPet`/`updateStudentPetName` 不变

`src/db/evaluations.ts`：
- `AddEvaluationInput` 去 `classId`
- `addEvaluation` 的 `evaluation_records.add` 去掉 `class_id` 字段
- `getClassEvaluations` 重命名为 `getEvaluations(page, pageSize)`：全局 `db.evaluation_records.toArray()`，按 timestamp 倒序，分页返回 `{ records, total, page, pageSize, totalPages }`（student_name 仍从 students 表映射）
- `deleteLatestEvaluation()` 无参数：全局最新一条

删除 `src/db/auth.ts`、`src/db/auth.test.ts`。

测试：
- `classes.test.ts`：删班级相关测试块（创建/获取/更新/删除班级），改学生测试（`addStudent('张三')` 无 classId/studentNo、`getStudents()` 无参数、`importStudents([{name}])` 等）
- `evaluations.test.ts`：去 classId，`createStudentWithPet` helper 去掉班级创建逻辑，直接 add 宝贝；`getClassEvaluations` → `getEvaluations`；`deleteLatestEvaluation()` 无参数

- [ ] **Step 1:** 改 `classes.ts`、`evaluations.ts`，删 `auth.ts`/`auth.test.ts`
- [ ] **Step 2:** 改 `classes.test.ts`、`evaluations.test.ts`
- [ ] **Step 3:** 跑 `pnpm test:run src/db/`，确认数据层测试通过
- [ ] **Step 4:** 提交 `refactor(db): 去掉班级/登录，学生改为宝贝`

## Task 3: 认证删除（useAuth.ts + AuthModal.vue）

**Files:**
- Delete: `src/composables/useAuth.ts`
- Delete: `src/components/AuthModal.vue`

- [ ] **Step 1:** 删 `useAuth.ts`、`AuthModal.vue`
- [ ] **Step 2:** 提交（与 Task 4 一起，见下）

## Task 4: UI 重构（Home.vue）

**Files:**
- Modify: `src/pages/Home.vue`

**改动（script 部分）：**
- 删 `import AuthModal`、`import { useAuth }` 两行
- `import { getClasses, createClass, ... }` 改为只保留宝贝相关：`getStudents, addStudent, importStudents, updateStudentPet, updateStudentPetName, deleteStudent`；`getClassEvaluations` → `getEvaluations`
- 删内联 `interface Class`、`interface Student` 里的 `class_id`/`student_no`
- 删 `const { isGuest, username, logout } = useAuth()`、`showAuthModal`、`showUserMenu`
- 删班级状态：`classes`、`currentClass`、`newClassName`、`editingClass`、`showClassModal`、`showClassMenu`
- 删班级函数：`loadClasses`/`selectClass`/`handleCreateClass`/`handleUpdateClass`/`handleDeleteClass`/`openCreateClassModal`/`openEditClassModal`
- `loadStudents()` 改为 `students.value = await getStudents()`（无 currentClass）
- `onMounted` 里去掉 `loadClasses()`，改为 `loadStudents()` + `loadRules()`
- 评价相关：`getClassEvaluations(currentClass.value.id, ...)` → `getEvaluations(...)`；`deleteLatestEvaluation(currentClass.value!.id)` → `deleteLatestEvaluation()`；`addEvaluation({ classId: currentClass.value?.id!, ... })` → 去 classId
- 删学生号（`newStudentNo`）相关状态与逻辑

**改动（template 部分）：**
- 删班级选择下拉/切换 UI、班级管理菜单、用户菜单、`<AuthModal>` 组件
- 删「学号」输入框/显示
- 文案：「学生」→「宝贝」、「添加学生」→「添加宝贝」、「批量导入学生」→「批量导入宝贝」、学号相关文案删除

- [ ] **Step 1:** 改 `Home.vue` script 部分
- [ ] **Step 2:** 改 `Home.vue` template 部分（班级/登录 UI 删除 + 文案）
- [ ] **Step 3:** 跑 `pnpm run build`（vue-tsc 类型检查），确认无类型错误
- [ ] **Step 4:** 提交 `refactor(ui): Home.vue 去掉班级/登录，学生改为宝贝`

## Task 5: 验证与残留检查

- [ ] **Step 1:** `pnpm test:run` 全量测试通过
- [ ] **Step 2:** `pnpm run build` 构建成功
- [ ] **Step 3:** `grep -rn "classes\|users\|classId\|class_id\|useAuth\|AuthModal\|studentNo\|student_no" src/ --include="*.ts" --include="*.vue"` 确认无残留（`students` 表名、`student_id` 字段名、`evaluation_records` 等保留是预期的）
- [ ] **Step 4:** 本地 `pnpm dev` 冒烟测试：无班级选择、无登录，直接宝贝列表，添加宝贝/评价/换宠物/撤回正常
- [ ] **Step 5:** 提交（如有遗留改动）

---

## Self-Review

1. **Spec 覆盖**：数据模型（Task 1）、数据访问（Task 2）、认证删除（Task 3）、UI（Task 4）、测试与验收（Task 5）全覆盖。
2. **占位符**：无 TBD/TODO，改动逐项列出。
3. **类型一致**：`getStudents()` 无参、`addStudent(name)`、`getEvaluations(page,pageSize)`、`deleteLatestEvaluation()` 的签名在各任务一致。

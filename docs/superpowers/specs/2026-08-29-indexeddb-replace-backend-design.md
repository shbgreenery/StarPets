# IndexedDB 替换后端 — 设计文档

- **日期**：2026-08-29
- **状态**：待评审
- **主题**：移除 Node.js + Express + SQLite 后端，改用浏览器 IndexedDB（Dexie），实现纯前端应用

---

## 1. 背景与目标

当前项目是前后端分离架构：Vue 3 前端通过 axios 调用 Express REST API，后端用 SQLite 存储数据。

使用场景确认为「**一人、固定一台设备**」，数据可重建、不要求备份。部署目标为「**本地开发调试 + GitHub Pages 托管**」。

GitHub Pages 只能托管纯静态文件，无法运行 Node 进程，因此后端必须移除。目标是把数据存储与全部业务逻辑迁入浏览器 IndexedDB，产出一个零后端、纯静态部署的应用。

---

## 2. 架构对比

### 改造前

```
Vue3 前端 (axios) ──HTTP──> Express 后端 (端口 3002) ──> SQLite (pet-garden.db)
```

### 改造后

```
Vue3 前端 ──直接调用──> src/db.ts 数据层 (Dexie) ──> IndexedDB (浏览器内)
```

关键变化：数据访问从「跨网络请求」变为「进程内函数调用」，后端路由、CORS、nginx 反代、token 认证全部消失。

---

## 3. 关键决策与理由

| 决策 | 选择 | 理由 |
|------|------|------|
| 存储库 | Dexie（IndexedDB 封装） | 相比手写原生 IndexedDB，Promise 链式查询、schema 版本管理、事务、TS 类型都开箱即用；相比 sql.js，无需手动持久化 |
| 部署 | GitHub Pages（纯静态） | 场景决定，无法跑 Node |
| 认证 | 保留 UI，验证本地化 | 用户希望保留登录/菜单功能；无服务器后 token 失去意义，密码校验在浏览器内完成 |
| 数据备份/恢复 | 移除 | 代码中已被 `TODO` 屏蔽，页面无入口，属死代码 |
| 批量导入学生 | 保留并迁移 | 活跃功能（`POST /students/import`），页面可见，与数据备份无关 |

---

## 4. 数据层设计

### 4.1 Dexie Schema

新增 `src/db.ts`，数据库名 `pet-garden`，7 张表（6 张业务表 + 1 张用户表）：

```ts
import Dexie, { type Table } from 'dexie'
import type { Class, Student, Badge, Rule, EvaluationRecord } from '@/types'

interface UserRow { id: string; username: string; password_hash: string; is_guest: number; created_at: number }
interface SettingRow { key: string; value: unknown }

export class PetGardenDB extends Dexie {
  classes!: Table<Class, string>
  students!: Table<Student, string>
  badges!: Table<Badge, string>
  evaluation_rules!: Table<Rule, string>
  evaluation_records!: Table<EvaluationRecord, string>
  settings!: Table<SettingRow, string>
  users!: Table<UserRow, string>

  constructor() {
    super('pet-garden')
    this.version(1).stores({
      classes: 'id, name',
      students: 'id, class_id, name, student_no, total_points',
      badges: 'id, student_id, pet_type',
      evaluation_rules: 'id, category, is_custom',
      evaluation_records: 'id, class_id, student_id, timestamp',
      settings: 'key',
      users: 'id, username'
    })
  }
}

export const db = new PetGardenDB()
```

Dexie schema 约定：主键列不加前缀，逗号分隔的其余字段为可查询索引（对应后端 SQL 的 `WHERE` 子句）。`class_id`、`student_id` 建索引支撑「按班级查学生」「按学生查评价记录」等查询。

**主键生成**：后端使用 `uuid` 包，前端改用浏览器原生 `crypto.randomUUID()`（现代浏览器均支持），移除 `uuid` 依赖。

**类型补充**：`src/types/index.ts` 的 `Student` 接口需补 `pet_name?: string` 字段（后端 `db.js` 已含该字段，来自「宠物命名」功能）。

### 4.2 数据访问接口

`src/db.ts` 导出命名函数（与后端路由一一对应），供组件替换 axios 调用：

**班级**
- `getClasses(): Promise<Class[]>`
- `createClass(name: string): Promise<Class>`
- `updateClass(id: string, name: string): Promise<void>`
- `deleteClass(id: string): Promise<void>`（级联删除该班学生、评价记录、徽章）

**学生**
- `getStudents(classId: string): Promise<Student[]>`
- `addStudent(data): Promise<Student>`
- `updateStudent(id, data): Promise<void>`
- `deleteStudent(id: string): Promise<void>`
- `importStudents(classId, list): Promise<{ imported: number }>`
- `updateStudentPet(id, petType, petName?): Promise<void>`
- `updateStudentPetName(id, petName): Promise<void>`

**评价规则**
- `getRules(): Promise<Rule[]>`
- `addRule(data): Promise<Rule>`
- `deleteRule(id: string): Promise<void>`

**评价记录**
- `addEvaluation(data): Promise<void>`（含积分/等级/徽章联动，见 §5.2）
- `getStudentEvaluations(studentId, pageSize): Promise<...>`
- `getClassEvaluations(classId, page, pageSize): Promise<PaginatedResponse<EvaluationRecord>>`
- `deleteEvaluation(id: string): Promise<void>`
- `deleteLatestEvaluation(classId): Promise<void>`

**设置**
- `getSettings(key): Promise<unknown>`
- `updateSettings(key, value): Promise<void>`

**认证**
- `register(username, password): Promise<User>`
- `login(username, password): Promise<User>`
- `getCurrentUser(): User`（从 localStorage 读取）

---

## 5. 业务逻辑搬运

### 5.1 等级计算

等级计算**前端已存在**：`src/data/pets.ts` 已有 `calculateLevel`、`getLevelProgress` 与 `LEVEL_CONFIG`（含完整测试 `pets.test.ts`），与后端 `level.js` 逻辑一致。**不新建 `level.ts`**，直接复用前端实现。后端 `server/utils/level.js` 与 `server/level.test.js` 随 `server/` 目录整体删除。

注意一处差异：前端 `getLevelProgress` 返回 `{ current, required, percentage, isMaxLevel }`（不含 `level`），后端返回含 `level`。前端 `Home.vue` 用 `calculateLevel(student.pet_exp)` 独立计算显示等级，因此迁移后统一使用前端版本即可，无兼容问题。

### 5.2 评价加分事务（关键）

后端加分是「更新学生积分/等级 + 插入评价记录 + 达到 Lv.8 时插入徽章」的多表事务。前端用 Dexie 事务保证原子性：

```ts
async function addEvaluation(record) {
  await db.transaction('rw', [db.students, db.evaluation_records, db.badges], async () => {
    const student = await db.students.get(record.student_id)
    const newExp = student.pet_exp + record.points
    const newLevel = calculateLevel(newExp)
    await db.students.update(student.id, {
      total_points: student.total_points + record.points,
      pet_exp: newExp,
      pet_level: newLevel
    })
    await db.evaluation_records.add(record)
    if (newLevel >= 8 && student.pet_level < 8) {
      await db.badges.add({ id: crypto.randomUUID(), student_id: student.id, pet_type: student.pet_type, earned_at: Date.now() })
    }
  })
}
```

要点：跨表操作放在 `db.transaction('rw', [三张表], fn)` 内，任一操作抛错则整体回滚，语义与后端 SQLite 事务一致。迁移前需精读 `server/routes/evaluations.js` 确认扣分、撤回、分页等边界行为的原始语义，逐条对齐。

### 5.3 批量导入学生

`POST /students/import` 的逻辑迁到 `importStudents()`：解析传入的学生名单，批量写入 `students` 表，返回导入数量。需核对 `server/routes/students.js` 中导入的校验规则（姓名/学号去重等）原样保留。

---

## 6. 认证本地化

保留用户菜单、登录/注册弹窗等全部 UI，仅替换验证实现。

| 项 | 现在 | 改造后 |
|----|------|--------|
| 用户表 | 后端 SQLite `users` | Dexie `users` 表 |
| 密码哈希 | `crypto.createHmac('sha256', SALT)`（Node） | `src/utils/password.ts` 用 Web Crypto HMAC-SHA256 |
| 登录/注册 | `api.post('/auth/login'|'/auth/register')` | `db.login()` / `db.register()` |
| Token | 后端签发 + 校验 | 移除；登录态存 localStorage |
| `/auth/me` | 后端查询 | 直接从 localStorage 读当前用户 |

**密码哈希**：Node 的 HMAC-SHA256 与 Web Crypto 的 HMAC-SHA256 是同一标准算法，输出一致。`src/utils/password.ts` 实现 `hashPassword`（异步，用 `crypto.subtle.importKey` + `sign`，输出 hex）与 `verifyPassword`，SALT 沿用 `'pet-garden-secret-salt-2024'`。

**注册校验**原样保留：用户名 3–20 字符、密码 ≥6 位、用户名唯一（查 `users` 表）。

**登录态**：登录成功后 `localStorage.setItem('user', JSON.stringify(user))`；游客模式下 user 为 `{ id: 'guest', username: '游客', isGuest: true }`。`token.js` 与 `middleware/auth.js` 整体删除。

---

## 7. 前端改造

### 7.1 `useAuth.ts` 重写

- 移除 axios 实例、请求/响应拦截器、token 逻辑、`fetchUserInfo`
- 保留 `user` / `isLoggedIn` / `isGuest` / `username` 响应式状态与 `setUser` / `logout`
- `login` / `register` 改为调用 `db` 的本地函数

### 7.2 `Home.vue` 调用替换

18 处 `api.xxx(...)` 调用替换为 `db` 层函数，`res.data` 取值改为直接返回。需逐处核对返回结构（后端 `res.json(...)` 的包装与前端 `res.data` 解包）。

### 7.3 删除项

- `src/components/AuthModal.vue` 中 `api.post` 改本地调用（组件本身保留）
- `Home.vue` 中 `exportBackup` / `importBackup` 死函数（822–861 行）与已注释的备份 UI 删除
- `server/` 目录整体删除
- 根目录 `deploy.sh`、`start-server.sh`、`health-check.sh`、`nginx-cdn.conf` 删除（`index.html` 是 Vite 构建入口，**保留**）

### 7.4 `package.json` 变更

- 移除依赖：`axios`、`concurrently`；新增依赖：`dexie`
- 移除脚本：`server`、`start`（`dev` / `build` / `preview` / `test` 保留）
- 新增部署脚本：`deploy`（构建并发布到 gh-pages，可选，配合 Actions 或 `gh-pages` 包）

---

## 8. GitHub Pages 部署

三个必须处理的点：

1. **base path**：`vite.config.ts` 的 `base` 由 `/pet-garden/` 改为 `/StarPets/`（仓库名，GitHub Pages 地址为 `https://shbgreenery.github.io/StarPets/`）。
2. **路由改 hash 模式**：`src/router/index.ts` 由 `createWebHistory('/pet-garden/')` 改为 `createWebHashHistory()`，URL 形如 `...#/preview`，刷新不 404。
3. **自动部署**：新增 `.github/workflows/deploy.yml`，在 push 到 `main` 时执行 `npm ci` + `npm run build`，将 `dist/` 发布到 `gh-pages` 分支（使用 `actions/deploy-pages` 或 `peaceiris/actions-gh-pages`）。

---

## 9. 改动清单

| 动作 | 文件 |
|------|------|
| 新增 | `src/db.ts`、`src/utils/password.ts`、`src/data/evaluation-rules.ts`（83 条默认规则）、`.github/workflows/deploy.yml` |
| 重写 | `src/composables/useAuth.ts`、`src/pages/Home.vue`（18 处调用）、`src/components/AuthModal.vue`（登录改本地）、`src/types/index.ts`（补 `pet_name`） |
| 修改 | `vite.config.ts`（base）、`src/router/index.ts`（hash）、`package.json`（依赖与脚本）、`src/data/pets.ts`（图片路径 `/pet-garden/` → `/StarPets/`） |
| 删除 | `server/` 全部、`deploy.sh`、`start-server.sh`、`health-check.sh`、`nginx-cdn.conf` |

---

## 10. 风险与注意事项

1. **评价加分事务**是最高风险点：多表原子性与边界语义（扣分、撤回、Lv.8 徽章去重）必须与后端逐条对齐，迁移时以 `server/routes/evaluations.js` 为准。
2. **`Home.vue` 是 2070 行巨型文件**，18 处调用需逐处核对返回结构，避免「改了调用、漏了解包」。
3. **数据不迁移**：现有 `server/pet-garden.db` 中的数据不会自动进入 IndexedDB（全新存储），用户接受数据重建。
4. **IndexedDB 数据易失**：清浏览器数据/换设备即丢失，用户已明确接受，暂不做备份。
5. **`crypto.subtle` 仅 HTTPS 或 localhost 可用**：GitHub Pages 为 HTTPS、本地为 localhost，均满足；若通过非安全协议访问会失败。

---

## 11. 验收标准

- [ ] 本地 `npm run dev` 无需后端进程，完整跑通「登录/注册 → 建班 → 加学生 → 批量导入 → 评价加分升级 → 换宠物 → 排行榜」主流程
- [ ] 评价加分后等级、积分、徽章正确联动（含 Lv.8 徽章）
- [ ] 刷新页面数据不丢失（IndexedDB 持久化）
- [ ] 认证本地化后：注册、登录、退出、游客模式均正常
- [ ] `npm run build` 成功，产物可部署到 GitHub Pages，hash 路由刷新不 404
- [ ] 原有单元测试（`pets.test.ts`、`level.test.ts`）通过
- [ ] `server/` 目录与 4 个 shell 脚本已移除，`package.json` 无 axios/concurrently 依赖

# IndexedDB 替换后端 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除 Node.js + Express + SQLite 后端，改用浏览器 IndexedDB（Dexie）实现纯前端应用，部署到 GitHub Pages。

**Architecture:** 前端所有数据访问由 axios HTTP 调用改为直接调用一个 Dexie 数据层（`src/db/` 目录）。数据层用 Dexie 管理 7 张表，业务逻辑（等级计算、评价加分事务、认证）全部在浏览器内完成。等级计算直接复用前端已有的 `src/data/pets.ts` 中的 `calculateLevel` / `getLevelProgress`。

**Tech Stack:** Vue 3 + TypeScript、Vite、Dexie（IndexedDB 封装）、Web Crypto API（密码哈希）、Vitest + happy-dom + fake-indexeddb（测试）、GitHub Actions（部署）。

**Spec:** `docs/superpowers/specs/2026-08-29-indexeddb-replace-backend-design.md`

## Global Constraints

- Node.js 版本 22（better-sqlite3 在删除前仍需 Node 22 编译；`crypto.subtle` 在 Node 18+ 全局可用）。
- GitHub 仓库名 `StarPets`，base path 为 `/StarPets/`，GitHub Pages 地址 `https://shbgreenery.github.io/StarPets/`。
- 路由必须用 hash 模式（`createWebHashHistory`），否则 GitHub Pages 刷新深层路由 404。
- 数据不迁移：现有 `server/pet-garden.db` 数据不进入 IndexedDB，全新开始。
- 认证保留 UI（登录/注册/游客），验证本地化；token 机制整体移除。
- 数据备份/恢复功能移除（原代码已被 TODO 屏蔽，删除 `exportBackup` / `importBackup` 死函数）。
- 批量导入学生（`POST /students/import`）是活跃功能，必须保留并迁移。
- 所有数据访问函数返回结构与原 axios `res.data` 消费方式完全对齐（见各任务 Interfaces）。
- 项目 commit message 使用中文，风格参考现有 git log（如 `feat(server): ...`）。

---

## File Structure

改造后的数据层采用目录拆分（相比 spec 的单文件 `db.ts`，拆成目录避免再产生一个巨型文件，本项目已有 `Home.vue` 2070 行的问题）：

```
src/
├── db/
│   ├── index.ts          # Dexie 类定义、schema、db 实例、initDb()、行类型
│   ├── classes.ts        # 班级 + 学生数据访问函数
│   ├── evaluations.ts    # 评价数据访问函数（含加分事务、撤回/删除）
│   ├── rules.ts          # 评价规则 + 设置数据访问函数
│   └── auth.ts           # 认证数据访问函数（register/login）
├── utils/
│   └── password.ts       # Web Crypto HMAC-SHA256 密码哈希
├── data/
│   └── evaluation-rules.ts  # 83 条默认评价规则数据
├── composables/
│   └── useAuth.ts        # 重写：去 axios，登录走本地
├── components/
│   └── AuthModal.vue     # 改造：api.post 改本地调用
└── pages/
    └── Home.vue          # 18 处 api 调用替换
```

**依赖关系**：`index.ts`（schema）→ 各领域函数文件 → `useAuth.ts` / `Home.vue`。测试用 `fake-indexeddb` 模拟 IndexedDB，在 Node 环境跑。

---

## Task 1: 安装 Dexie 与 fake-indexeddb

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: 后续所有任务依赖 `dexie`（运行）与 `fake-indexeddb`（测试）。

- [ ] **Step 1: 安装依赖**

Run:
```bash
npm install dexie
npm install -D fake-indexeddb
```

- [ ] **Step 2: 验证安装**

Run:
```bash
npm ls dexie fake-indexeddb
```
Expected: 两个包均列出且无 `missing` / `invalid` 报错。

- [ ] **Step 3: 提交**

```bash
git add package.json package-lock.json
git commit -m "chore: 添加 dexie 与 fake-indexeddb 依赖"
```

---

## Task 2: 修正 pets.ts 图片路径

**Files:**
- Modify: `src/data/pets.ts:13,23`
- Test: `src/data/pets.test.ts:145`

**Interfaces:**
- Produces: 宠物图片路径统一为 `/StarPets/pets/<id>/lv<level>.png`，供 `getPetLevelImage` 等使用。

- [ ] **Step 1: 写失败测试（改断言）**

修改 `src/data/pets.test.ts` 中 `getPetLevelImage` 的第一个断言：

```ts
it('应该返回正确等级的图片路径', () => {
  const image = getPetLevelImage('corgi', 1)
  expect(image).toBe('/StarPets/pets/corgi/lv1.png')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/data/pets.test.ts`
Expected: 失败，实际值仍为 `/pet-garden/pets/corgi/lv1.png`。

- [ ] **Step 3: 改实现**

修改 `src/data/pets.ts` 两处硬编码：

```ts
// 第 13 行 generateLevelImages 内
const basePath = `/StarPets/pets/${petId}`
// 第 23 行 getDefaultImage 内
return `/StarPets/pets/${petId}/lv1.png`
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/data/pets.test.ts`
Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add src/data/pets.ts src/data/pets.test.ts
git commit -m "chore: 宠物图片路径改为 /StarPets/ 前缀"
```

---

## Task 3: 默认评价规则数据

**Files:**
- Create: `src/data/evaluation-rules.ts`
- Test: `src/data/evaluation-rules.test.ts`

**Interfaces:**
- Produces: `DEFAULT_RULES: Rule[]`，`Rule` 类型为 `{ id: string; name: string; points: number; category: string; is_custom: number; created_at: number }`。被 `src/db/index.ts` 的 `initDb()` 消费（见 Task 5）。

- [ ] **Step 1: 写失败测试**

`src/data/evaluation-rules.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { DEFAULT_RULES } from './evaluation-rules'

describe('默认评价规则', () => {
  it('应该有 83 条默认规则', () => {
    expect(DEFAULT_RULES).toHaveLength(83)
  })

  it('每条规则字段完整', () => {
    for (const rule of DEFAULT_RULES) {
      expect(rule.id).toBeTruthy()
      expect(rule.name).toBeTruthy()
      expect(typeof rule.points).toBe('number')
      expect(rule.points).not.toBe(0)
      expect(['学习', '行为', '健康', '其他']).toContain(rule.category)
      expect(rule.is_custom).toBe(0)
    }
  })

  it('覆盖四个分类', () => {
    const cats = new Set(DEFAULT_RULES.map(r => r.category))
    expect(cats.size).toBe(4)
  })

  it('同时包含加分和扣分项', () => {
    expect(DEFAULT_RULES.some(r => r.points > 0)).toBe(true)
    expect(DEFAULT_RULES.some(r => r.points < 0)).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/data/evaluation-rules.test.ts`
Expected: 失败，`DEFAULT_RULES` 未定义。

- [ ] **Step 3: 实现**

`src/data/evaluation-rules.ts` —— 数据源为 `server/index.js` 的 `initDefaultRules()`（74–175 行）中的 `defaultRules` 数组。为每条规则生成固定 ID（`default_1` … `default_83`，按数组顺序），`is_custom` 固定为 `0`，`created_at` 用固定值 `1704067200000`（与后端 db.js 默认规则一致）：

```ts
import type { Rule } from '@/types'

// 数据来自后端 server/index.js 的 initDefaultRules()
const rawRules: Array<{ name: string; points: number; category: string }> = [
  // 学习类 - 加分
  { name: '作业完成优秀', points: 1, category: '学习' },
  { name: '平时测验满分', points: 3, category: '学习' },
  { name: '平时测验达优秀', points: 2, category: '学习' },
  { name: '默写全对', points: 1, category: '学习' },
  { name: '订正态度认真', points: 1, category: '学习' },
  { name: '优秀作业,值得表扬', points: 1, category: '学习' },
  { name: '近期学习状态进步', points: 1, category: '学习' },
  { name: '被老师点名表扬', points: 1, category: '学习' },
  { name: '单元测验显著进步', points: 2, category: '学习' },
  // 学习类 - 扣分
  { name: '不交作业', points: -1, category: '学习' },
  { name: '未完成作业', points: -2, category: '学习' },
  { name: '作业潦草', points: -1, category: '学习' },
  { name: '订正不认真', points: -2, category: '学习' },
  { name: '抄袭作业', points: -5, category: '学习' },
  { name: '考试作弊', points: -5, category: '学习' },
  { name: '学习显著退步', points: -2, category: '学习' },
  // 行为类 - 加分
  { name: '早读认真专注', points: 1, category: '行为' },
  { name: '课前准备充分', points: 1, category: '行为' },
  { name: '眼保健操全程认真', points: 1, category: '行为' },
  { name: '升旗仪式安静整齐', points: 1, category: '行为' },
  { name: '守纪表现优秀(被表扬)', points: 2, category: '行为' },
  { name: '主动帮助同学', points: 2, category: '行为' },
  { name: '拾金不昧(一般物品)', points: 2, category: '行为' },
  { name: '拾金不昧(贵重物品)', points: 5, category: '行为' },
  { name: '主动帮助生病同学', points: 3, category: '行为' },
  { name: '主动调解同学矛盾、化解冲突', points: 3, category: '行为' },
  { name: '做好人好事被学校提出表扬', points: 3, category: '行为' },
  { name: '积极参与校内外志愿服务', points: 3, category: '行为' },
  { name: '犯错主动认错,积极协商', points: 1, category: '行为' },
  // 行为类 - 扣分
  { name: '无故迟到或早退', points: -1, category: '行为' },
  { name: '未佩戴红领巾,不穿校服', points: -1, category: '行为' },
  { name: '私自旷课或课间操', points: -3, category: '行为' },
  { name: '上课讲话、开小差', points: -1, category: '行为' },
  { name: '扰乱课堂', points: -3, category: '行为' },
  { name: '课间追逐打闹', points: -3, category: '行为' },
  { name: '追逐打闹(酿成事故)', points: -3, category: '行为' },
  { name: '中午自习说话、随意走动', points: -1, category: '行为' },
  { name: '私自带玩具或零食或危险物品', points: -3, category: '行为' },
  { name: '排队时说话或小动作不停,被点名', points: -1, category: '行为' },
  { name: '传播脏话或不良歌谣', points: -5, category: '行为' },
  { name: '撒谎、隐瞒真实情况', points: -2, category: '行为' },
  { name: '说脏话,骂人,起绰号', points: -2, category: '行为' },
  { name: '欺负、推搡、伤害同学', points: -10, category: '行为' },
  { name: '挑拨离间、拉帮结派', points: -3, category: '行为' },
  { name: '不尊重同学、孤立他人', points: -3, category: '行为' },
  { name: '为私欲包庇犯错者', points: -3, category: '行为' },
  { name: '恶意举报、诬陷他人', points: -3, category: '行为' },
  { name: '破坏校园设施', points: -5, category: '行为' },
  // 健康类 - 加分
  { name: '认真完成包干区值日', points: 1, category: '健康' },
  { name: '主动为班级擦黑板', points: 1, category: '健康' },
  { name: '主动整理讲台', points: 1, category: '健康' },
  { name: '主动整理黑板粉笔槽', points: 1, category: '健康' },
  { name: '主动倒垃圾并套垃圾袋', points: 2, category: '健康' },
  { name: '座位整洁无涂画,桌椅干净', points: 1, category: '健康' },
  { name: '座位周围无垃圾', points: 1, category: '健康' },
  // 健康类 - 扣分
  { name: '打扫包干区时间玩耍,不认真', points: -2, category: '健康' },
  { name: '个人座位卫生不合格', points: -1, category: '健康' },
  { name: '校园内乱扔垃圾', points: -1, category: '健康' },
  { name: '桌洞脏乱、物品杂乱', points: -1, category: '健康' },
  { name: '破坏卫生、乱涂乱画', points: -2, category: '健康' },
  { name: '浪费粮食', points: -2, category: '健康' },
  { name: '破坏班级绿植、把玩绿植', points: -3, category: '健康' },
  // 其他类 - 加分
  { name: '主动整理图书、摆放整齐', points: 2, category: '其他' },
  { name: '主动帮同学更换桌椅', points: 2, category: '其他' },
  { name: '主动承担班级任务', points: 2, category: '其他' },
  { name: '积极参加班级墙面布置', points: 2, category: '其他' },
  { name: '积极参加班级或学校活动', points: 1, category: '其他' },
  { name: '活动中表现优秀', points: 2, category: '其他' },
  { name: '代表班级参赛', points: 3, category: '其他' },
  { name: '校级比赛:一等奖', points: 5, category: '其他' },
  { name: '校级比赛:二等奖', points: 4, category: '其他' },
  { name: '校级比赛:三等奖', points: 3, category: '其他' },
  { name: '区级及以上:一等奖', points: 8, category: '其他' },
  { name: '区级及以上:二等奖', points: 6, category: '其他' },
  { name: '区级及以上:三等奖', points: 4, category: '其他' },
  { name: '联欢会或文艺汇演积极参与', points: 2, category: '其他' },
  { name: '为班级争得荣誉', points: 5, category: '其他' },
  { name: '小组全周无违纪、全员交作业', points: 2, category: '其他' },
  // 其他类 - 扣分
  { name: '损坏公物、乱刻乱画', points: -1, category: '其他' },
  { name: '浪费水电、屡教不改', points: -1, category: '其他' },
  { name: '故意玩弄损坏公共电器', points: -3, category: '其他' },
  { name: '故意损坏卫生工具', points: -2, category: '其他' },
  { name: '扣分严重/打架/作弊/严重违纪', points: -8, category: '其他' },
]

export const DEFAULT_RULES: Rule[] = rawRules.map((r, i) => ({
  id: `default_${i + 1}`,
  name: r.name,
  points: r.points,
  category: r.category,
  is_custom: 0,
  created_at: 1704067200000
}))
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/data/evaluation-rules.test.ts`
Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add src/data/evaluation-rules.ts src/data/evaluation-rules.test.ts
git commit -m "feat: 新增 83 条默认评价规则数据"
```

---

## Task 4: 密码哈希工具

**Files:**
- Create: `src/utils/password.ts`
- Test: `src/utils/password.test.ts`

**Interfaces:**
- Produces: `hashPassword(password: string): Promise<string>` 与 `verifyPassword(password: string, hash: string): Promise<boolean>`。被 `src/db/auth.ts` 消费（Task 9）。SALT 固定为 `'pet-garden-secret-salt-2024'`，算法 HMAC-SHA256，输出 hex。

- [ ] **Step 1: 写失败测试**

`src/utils/password.test.ts`：

```ts
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password 哈希', () => {
  it('相同密码产生相同哈希', async () => {
    const h1 = await hashPassword('abc123')
    const h2 = await hashPassword('abc123')
    expect(h1).toBe(h2)
  })

  it('哈希是 64 位 hex 字符串', async () => {
    const h = await hashPassword('abc123')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
  })

  it('不同密码产生不同哈希', async () => {
    const h1 = await hashPassword('abc123')
    const h2 = await hashPassword('abc124')
    expect(h1).not.toBe(h2)
  })

  it('verifyPassword 正确校验', async () => {
    const h = await hashPassword('secret6')
    expect(await verifyPassword('secret6', h)).toBe(true)
    expect(await verifyPassword('wrong', h)).toBe(false)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/utils/password.test.ts`
Expected: 失败，模块未定义。

- [ ] **Step 3: 实现**

`src/utils/password.ts` —— 用 Web Crypto HMAC-SHA256，与后端 `crypto.createHmac('sha256', SALT)` 输出一致：

```ts
const SALT = 'pet-garden-secret-salt-2024'

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SALT),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(password))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return (await hashPassword(password)) === hash
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/utils/password.test.ts`
Expected: 全部通过（Node 22 的 `globalThis.crypto.subtle` 可用）。

- [ ] **Step 5: 提交**

```bash
git add src/utils/password.ts src/utils/password.test.ts
git commit -m "feat: 密码哈希工具（Web Crypto HMAC-SHA256）"
```

---

## Task 5: Dexie schema 与初始化

**Files:**
- Create: `src/db/index.ts`
- Test: `src/db/index.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_RULES`（Task 3）。
- Produces: `db`（Dexie 实例，含 7 张表）、`initDb(): Promise<void>`。行类型 `ClassRow`、`StudentRow`、`BadgeRow`、`RuleRow`、`EvaluationRecordRow`、`SettingRow`、`UserRow` 从本文件导出，供后续任务 import。

- [ ] **Step 1: 写失败测试**

`src/db/index.test.ts`：

```ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'

beforeEach(async () => {
  await db.open()
  await clearAll()
  await initDb()
})

describe('db schema 与初始化', () => {
  it('有 7 张表', () => {
    expect(db.tables.map(t => t.name).sort()).toEqual([
      'badges', 'classes', 'evaluation_records', 'evaluation_rules',
      'settings', 'students', 'users'
    ])
  })

  it('initDb 幂等：重复调用不重复插入默认规则', async () => {
    await initDb()
    const count = await db.evaluation_rules.count()
    expect(count).toBe(83)
  })

  it('初始化默认设置 levelConfig', async () => {
    const s = await db.settings.get('levelConfig')
    expect(s?.value).toEqual([40, 60, 80, 100, 120, 140, 160])
  })

  it('初始化游客用户', async () => {
    const guest = await db.users.get('guest')
    expect(guest?.is_guest).toBe(1)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/db/index.test.ts`
Expected: 失败，模块未定义。

- [ ] **Step 3: 实现**

`src/db/index.ts` —— 先补 `src/types/index.ts` 的 `Student` 加 `pet_name`（见下方 Step 3a），再写本文件：

```ts
import Dexie, { type Table } from 'dexie'
import { DEFAULT_RULES } from '@/data/evaluation-rules'

// 表行类型
export interface ClassRow { id: string; user_id: string; name: string; created_at: number; updated_at: number }
export interface StudentRow {
  id: string; class_id: string; name: string; student_no: string | null;
  total_points: number; pet_type: string | null; pet_name: string | null;
  pet_level: number; pet_exp: number; created_at: number
}
export interface BadgeRow { id: string; student_id: string; pet_type: string; earned_at: number }
export interface RuleRow { id: string; name: string; points: number; category: string; is_custom: number; created_at: number }
export interface EvaluationRecordRow { id: string; class_id: string; student_id: string; points: number; reason: string; category: string; timestamp: number }
export interface SettingRow { key: string; value: unknown }
export interface UserRow { id: string; username: string; password_hash: string; is_guest: number; created_at: number }

class PetGardenDB extends Dexie {
  classes!: Table<ClassRow, string>
  students!: Table<StudentRow, string>
  badges!: Table<BadgeRow, string>
  evaluation_rules!: Table<RuleRow, string>
  evaluation_records!: Table<EvaluationRecordRow, string>
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

// 清空所有表（测试用）
export async function clearAll() {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map(t => t.clear()))
  })
}

// 初始化默认数据（幂等）
export async function initDb() {
  // 默认规则
  const ruleCount = await db.evaluation_rules.count()
  if (ruleCount === 0) {
    await db.evaluation_rules.bulkPut(DEFAULT_RULES)
  }

  // 等级配置
  const levelConfig = await db.settings.get('levelConfig')
  if (!levelConfig) {
    await db.settings.put({ key: 'levelConfig', value: [40, 60, 80, 100, 120, 140, 160] })
  }

  // 游客用户
  const guest = await db.users.get('guest')
  if (!guest) {
    await db.users.put({ id: 'guest', username: 'guest', password_hash: '', is_guest: 1, created_at: Date.now() })
  }
}
```

- [ ] **Step 3a: 补充类型**

`src/types/index.ts` 的 `Student` 接口加一行（在 `pet_type` 之后）：

```ts
  pet_name?: string | null
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/db/index.test.ts`
Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add src/db/index.ts src/db/index.test.ts src/types/index.ts
git commit -m "feat(db): Dexie schema 与初始化（7 张表 + 默认数据）"
```

---

## Task 6: 班级 + 学生数据访问函数

**Files:**
- Create: `src/db/classes.ts`
- Test: `src/db/classes.test.ts`

**Interfaces:**
- Consumes: `db`、`ClassRow`、`StudentRow`（Task 5）。
- Produces: 以下函数供 `Home.vue`（Task 12）使用，返回结构与原 axios `res.data` 对齐：

| 函数 | 返回 |
|------|------|
| `getClasses(): Promise<ClassRow[]>` | 班级数组（按 `created_at` 降序） |
| `createClass(name: string): Promise<ClassRow>` | 新班级对象 |
| `updateClass(id: string, name: string): Promise<void>` | — |
| `deleteClass(id: string): Promise<void>` | —（级联删学生/记录/徽章） |
| `getStudents(classId: string): Promise<StudentRow[]>` | 学生数组（按 `name` 升序） |
| `addStudent(classId: string, name: string, studentNo: string \| null): Promise<StudentRow>` | 新学生对象 |
| `updateStudent(id: string, name: string, studentNo: string \| null): Promise<void>` | — |
| `deleteStudent(id: string): Promise<void>` | —（级联删记录/徽章） |
| `importStudents(classId: string, list: { name: string; studentNo: string }[]): Promise<{ imported: number }>` | 导入数量 |
| `updateStudentPet(id: string, petType: string, petName?: string): Promise<void>` | — |
| `updateStudentPetName(id: string, petName: string \| null): Promise<void>` | — |

主键一律用 `crypto.randomUUID()`。所有函数不校验用户归属（本地单用户，游客为唯一用户；原后端的 `user_id` 校验在本架构下无意义，班级仍存 `user_id: 'guest'` 字段以兼容 schema）。

- [ ] **Step 1: 写失败测试**

`src/db/classes.test.ts`（覆盖班级 CRUD 级联与学生 CRUD）：

```ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'
import { getClasses, createClass, updateClass, deleteClass, getStudents, addStudent, deleteStudent, importStudents, updateStudentPet, updateStudentPetName } from './classes'

let classId: string

beforeEach(async () => {
  await db.open()
  await clearAll()
  await initDb()
  const cls = await createClass('测试班级')
  classId = cls.id
})

describe('班级', () => {
  it('创建并获取班级', async () => {
    const classes = await getClasses()
    expect(classes).toHaveLength(1)
    expect(classes[0].name).toBe('测试班级')
  })

  it('更新班级名称', async () => {
    await updateClass(classId, '新名字')
    const classes = await getClasses()
    expect(classes[0].name).toBe('新名字')
  })

  it('删除班级级联删除学生', async () => {
    await addStudent(classId, '张三', null)
    await deleteClass(classId)
    expect(await db.classes.count()).toBe(0)
    expect(await db.students.count()).toBe(0)
  })
})

describe('学生', () => {
  it('添加学生默认字段正确', async () => {
    const s = await addStudent(classId, '张三', '001')
    expect(s.name).toBe('张三')
    expect(s.student_no).toBe('001')
    expect(s.total_points).toBe(0)
    expect(s.pet_level).toBe(1)
    expect(s.pet_exp).toBe(0)
  })

  it('getStudents 按名字排序', async () => {
    await addStudent(classId, '李四', null)
    await addStudent(classId, '张三', null)
    const students = await getStudents(classId)
    expect(students.map(s => s.name)).toEqual(['张三', '李四'])
  })

  it('批量导入跳过空名字', async () => {
    const res = await importStudents(classId, [
      { name: ' 王五 ', studentNo: ' 003 ' },
      { name: '   ', studentNo: '' },
      { name: '赵六', studentNo: '' }
    ])
    expect(res.imported).toBe(2)
    const students = await getStudents(classId)
    expect(students).toHaveLength(2)
    expect(students.find(s => s.name === '王五')?.student_no).toBe('003')
  })

  it('删除学生级联删除评价记录', async () => {
    const s = await addStudent(classId, '张三', null)
    await db.evaluation_records.add({ id: 'r1', class_id: classId, student_id: s.id, points: 1, reason: 'x', category: '学习', timestamp: Date.now() })
    await deleteStudent(s.id)
    expect(await db.evaluation_records.count()).toBe(0)
  })

  it('换宠物保留等级经验', async () => {
    const s = await addStudent(classId, '张三', null)
    await db.students.update(s.id, { total_points: 50, pet_exp: 50, pet_level: 2, pet_type: 'corgi' })
    await updateStudentPet(s.id, 'bichon', '小白')
    const updated = await db.students.get(s.id)
    expect(updated?.pet_type).toBe('bichon')
    expect(updated?.pet_name).toBe('小白')
    expect(updated?.pet_exp).toBe(50)
    expect(updated?.pet_level).toBe(2)
  })

  it('改宠物名', async () => {
    const s = await addStudent(classId, '张三', null)
    await updateStudentPetName(s.id, '旺财')
    expect((await db.students.get(s.id))?.pet_name).toBe('旺财')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/db/classes.test.ts`
Expected: 失败，函数未定义。

- [ ] **Step 3: 实现**

`src/db/classes.ts`：

```ts
import { db } from './index'
import type { ClassRow, StudentRow } from './index'

export async function getClasses(): Promise<ClassRow[]> {
  return db.classes.orderBy('created_at').reverse().toArray()
}

export async function createClass(name: string): Promise<ClassRow> {
  const now = Date.now()
  const cls: ClassRow = { id: crypto.randomUUID(), user_id: 'guest', name, created_at: now, updated_at: now }
  await db.classes.add(cls)
  return cls
}

export async function updateClass(id: string, name: string): Promise<void> {
  await db.classes.update(id, { name, updated_at: Date.now() })
}

export async function deleteClass(id: string): Promise<void> {
  const studentIds = (await db.students.where('class_id').equals(id).toArray()).map(s => s.id)
  await db.transaction('rw', [db.classes, db.students, db.evaluation_records, db.badges], async () => {
    await db.badges.where('student_id').anyOf(studentIds).delete()
    await db.evaluation_records.where('class_id').equals(id).delete()
    await db.students.where('class_id').equals(id).delete()
    await db.classes.delete(id)
  })
}

export async function getStudents(classId: string): Promise<StudentRow[]> {
  return db.students.where('class_id').equals(classId).sortBy('name')
}

export async function addStudent(classId: string, name: string, studentNo: string | null): Promise<StudentRow> {
  const s: StudentRow = {
    id: crypto.randomUUID(), class_id: classId, name, student_no: studentNo || null,
    total_points: 0, pet_type: null, pet_name: null, pet_level: 1, pet_exp: 0, created_at: Date.now()
  }
  await db.students.add(s)
  return s
}

export async function updateStudent(id: string, name: string, studentNo: string | null): Promise<void> {
  await db.students.update(id, { name, student_no: studentNo || null })
}

export async function deleteStudent(id: string): Promise<void> {
  await db.transaction('rw', [db.students, db.evaluation_records, db.badges], async () => {
    await db.evaluation_records.where('student_id').equals(id).delete()
    await db.badges.where('student_id').equals(id).delete()
    await db.students.delete(id)
  })
}

export async function importStudents(classId: string, list: { name: string; studentNo: string }[]): Promise<{ imported: number }> {
  const now = Date.now()
  const rows: StudentRow[] = []
  for (const s of list) {
    const name = s.name?.trim()
    if (!name) continue
    rows.push({
      id: crypto.randomUUID(), class_id: classId, name,
      student_no: s.studentNo?.trim() || null,
      total_points: 0, pet_type: null, pet_name: null, pet_level: 1, pet_exp: 0, created_at: now
    })
  }
  await db.students.bulkAdd(rows)
  return { imported: rows.length }
}

export async function updateStudentPet(id: string, petType: string, petName?: string): Promise<void> {
  await db.students.update(id, { pet_type: petType, pet_name: petName?.trim() || null })
}

export async function updateStudentPetName(id: string, petName: string | null): Promise<void> {
  await db.students.update(id, { pet_name: petName?.trim() || null })
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/db/classes.test.ts`
Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add src/db/classes.ts src/db/classes.test.ts
git commit -m "feat(db): 班级与学生数据访问函数"
```

---

## Task 7: 规则 + 设置数据访问函数

**Files:**
- Create: `src/db/rules.ts`
- Test: `src/db/rules.test.ts`

**Interfaces:**
- Consumes: `db`、`RuleRow`（Task 5）。
- Produces:

| 函数 | 返回 |
|------|------|
| `getRules(): Promise<RuleRow[]>` | 规则数组（按 `category`、`points` 降序） |
| `addRule(name: string, points: number, category: string): Promise<RuleRow>` | 新规则（`is_custom=1`） |
| `deleteRule(id: string): Promise<void>` | —（仅删 `is_custom=1`） |
| `getSettings(key: string): Promise<unknown>` | 设置值（JSON 解析后） |
| `updateSettings(key: string, value: unknown): Promise<void>` | — |

- [ ] **Step 1: 写失败测试**

`src/db/rules.test.ts`：

```ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'
import { getRules, addRule, deleteRule, getSettings, updateSettings } from './rules'

beforeEach(async () => {
  await db.open()
  await clearAll()
  await initDb()
})

describe('规则', () => {
  it('getRules 返回 83 条默认规则', async () => {
    const rules = await getRules()
    expect(rules).toHaveLength(83)
  })

  it('添加自定义规则 is_custom=1', async () => {
    const r = await addRule('测试规则', 5, '其他')
    expect(r.is_custom).toBe(1)
    expect(await getRules()).toHaveLength(84)
  })

  it('删除自定义规则', async () => {
    const r = await addRule('测试规则', 5, '其他')
    await deleteRule(r.id)
    expect(await getRules()).toHaveLength(83)
  })

  it('不能删除默认规则', async () => {
    const rules = await getRules()
    await deleteRule(rules[0].id)
    expect(await getRules()).toHaveLength(83)
  })
})

describe('设置', () => {
  it('getSettings 读取 levelConfig', async () => {
    const v = await getSettings('levelConfig')
    expect(v).toEqual([40, 60, 80, 100, 120, 140, 160])
  })

  it('updateSettings 写入并读回', async () => {
    await updateSettings('levelConfig', [10, 20, 30])
    expect(await getSettings('levelConfig')).toEqual([10, 20, 30])
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/db/rules.test.ts`
Expected: 失败。

- [ ] **Step 3: 实现**

`src/db/rules.ts`：

```ts
import { db } from './index'
import type { RuleRow } from './index'

export async function getRules(): Promise<RuleRow[]> {
  const rules = await db.evaluation_rules.toArray()
  return rules.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category, 'zh')
    return b.points - a.points
  })
}

export async function addRule(name: string, points: number, category: string): Promise<RuleRow> {
  const rule: RuleRow = {
    id: crypto.randomUUID(), name, points, category, is_custom: 1, created_at: Date.now()
  }
  await db.evaluation_rules.add(rule)
  return rule
}

export async function deleteRule(id: string): Promise<void> {
  const rule = await db.evaluation_rules.get(id)
  if (rule && rule.is_custom === 1) {
    await db.evaluation_rules.delete(id)
  }
}

export async function getSettings(key: string): Promise<unknown> {
  const s = await db.settings.get(key)
  return s?.value
}

export async function updateSettings(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value })
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/db/rules.test.ts`
Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add src/db/rules.ts src/db/rules.test.ts
git commit -m "feat(db): 规则与设置数据访问函数"
```

---

## Task 8: 评价数据访问函数（含加分事务）

**Files:**
- Create: `src/db/evaluations.ts`
- Test: `src/db/evaluations.test.ts`

**Interfaces:**
- Consumes: `db`、`StudentRow`、`EvaluationRecordRow`（Task 5）、`calculateLevel`（`@/data/pets`）。
- Produces:

| 函数 | 返回 |
|------|------|
| `addEvaluation(data: { classId: string; studentId: string; points: number; reason: string; category: string }): Promise<{ id: string; timestamp: number; petLevel?: number; petExp?: number; levelUp?: boolean; levelDown?: boolean; graduated?: boolean }>` | 与后端 `res.data` 完全对齐；无宠物时仅返回 `{ id, timestamp }` |
| `getStudentEvaluations(studentId: string, pageSize?: number): Promise<EvaluationRecordRow[]>` | 记录数组（含 `student_name`） |
| `getClassEvaluations(classId: string, page: number, pageSize: number): Promise<{ records: EvaluationRecordRow[]; total: number; page: number; pageSize: number; totalPages: number }>` | 分页结果 |
| `deleteEvaluation(id: string): Promise<{ success: true; undone: EvaluationRecordRow & { student_name: string } }>` | 撤回指定记录 |
| `deleteLatestEvaluation(classId: string): Promise<{ success: true; undone: EvaluationRecordRow & { student_name: string } }>` | 撤回最新记录 |

**关键语义（必须精确复刻后端 `server/routes/evaluations.js`）**：
- 加分时 `pet_exp` 始终等于 `Math.max(0, total_points)`（不是累加）。
- `levelUp = newLevel > 旧pet_level`，`levelDown = newLevel < 旧pet_level`。
- 毕业判定：`newLevel === 8 && 旧pet_level < 8` 时插入徽章。
- 撤回时 `expChange = Math.abs(record.points)`，`newExp = Math.max(0, 旧pet_exp - expChange)`，`total_points = 旧total_points - record.points`，重算等级。
- 撤回返回的 `undone` 需附 `student_name`（本计划修复原后端缺失该字段导致 toast 显示 undefined 的问题）。

- [ ] **Step 1: 写失败测试**

`src/db/evaluations.test.ts`：

```ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'
import { addEvaluation, deleteEvaluation, deleteLatestEvaluation, getStudentEvaluations, getClassEvaluations } from './evaluations'
import { calculateLevel } from '@/data/pets'

let classId: string
let studentId: string

async function createStudentWithPet(exp = 0) {
  const cls = await db.classes.add({ id: crypto.randomUUID(), user_id: 'guest', name: '班', created_at: Date.now(), updated_at: Date.now() })
  classId = cls
  studentId = crypto.randomUUID()
  await db.students.add({ id: studentId, class_id: classId, name: '张三', student_no: null, total_points: exp, pet_type: 'corgi', pet_name: null, pet_level: calculateLevel(exp), pet_exp: exp, created_at: Date.now() })
}

beforeEach(async () => {
  await db.open()
  await clearAll()
  await initDb()
})

describe('addEvaluation', () => {
  it('加分升级：exp 与 total_points 同步，返回 levelUp', async () => {
    await createStudentWithPet(0)
    const res = await addEvaluation({ classId, studentId, points: 40, reason: 'x', category: '学习' })
    expect(res.petLevel).toBe(2)
    expect(res.petExp).toBe(40)
    expect(res.levelUp).toBe(true)
    const s = await db.students.get(studentId)
    expect(s?.total_points).toBe(40)
    expect(s?.pet_exp).toBe(40)
    expect(s?.pet_level).toBe(2)
  })

  it('扣分不升反降', async () => {
    await createStudentWithPet(50)
    const res = await addEvaluation({ classId, studentId, points: -20, reason: 'x', category: '行为' })
    expect(res.levelDown).toBe(true)
    const s = await db.students.get(studentId)
    expect(s?.total_points).toBe(30)
    expect(s?.pet_exp).toBe(30)
  })

  it('达到 8 级发徽章', async () => {
    await createStudentWithPet(690)
    const res = await addEvaluation({ classId, studentId, points: 10, reason: 'x', category: '学习' })
    expect(res.graduated).toBe(true)
    expect(await db.badges.count()).toBe(1)
  })

  it('无宠物学生不返回等级字段', async () => {
    const cls = await db.classes.add({ id: crypto.randomUUID(), user_id: 'guest', name: '班', created_at: Date.now(), updated_at: Date.now() })
    const sid = crypto.randomUUID()
    await db.students.add({ id: sid, class_id: cls, name: '李四', student_no: null, total_points: 0, pet_type: null, pet_name: null, pet_level: 1, pet_exp: 0, created_at: Date.now() })
    const res = await addEvaluation({ classId: cls, studentId: sid, points: 1, reason: 'x', category: '学习' })
    expect(res.petLevel).toBeUndefined()
  })
})

describe('撤回', () => {
  it('deleteLatestEvaluation 撤回加分并回滚经验', async () => {
    await createStudentWithPet(0)
    await addEvaluation({ classId, studentId, points: 40, reason: 'x', category: '学习' })
    const res = await deleteLatestEvaluation(classId)
    expect(res.success).toBe(true)
    expect(res.undone.student_name).toBe('张三')
    const s = await db.students.get(studentId)
    expect(s?.total_points).toBe(0)
    expect(s?.pet_exp).toBe(0)
    expect(s?.pet_level).toBe(1)
  })

  it('deleteEvaluation 撤回指定记录', async () => {
    await createStudentWithPet(0)
    const r = await addEvaluation({ classId, studentId, points: 10, reason: 'x', category: '学习' })
    await deleteEvaluation(r.id)
    expect(await db.evaluation_records.count()).toBe(0)
  })
})

describe('查询', () => {
  it('getStudentEvaluations 返回含 student_name 的记录', async () => {
    await createStudentWithPet(0)
    await addEvaluation({ classId, studentId, points: 10, reason: 'x', category: '学习' })
    const records = await getStudentEvaluations(studentId)
    expect(records).toHaveLength(1)
    expect(records[0].student_name).toBe('张三')
  })

  it('getClassEvaluations 分页正确', async () => {
    await createStudentWithPet(0)
    for (let i = 0; i < 5; i++) {
      await addEvaluation({ classId, studentId, points: 1, reason: `r${i}`, category: '学习' })
    }
    const page = await getClassEvaluations(classId, 1, 2)
    expect(page.total).toBe(5)
    expect(page.records).toHaveLength(2)
    expect(page.totalPages).toBe(3)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/db/evaluations.test.ts`
Expected: 失败。

- [ ] **Step 3: 实现**

`src/db/evaluations.ts`：

```ts
import { db } from './index'
import type { EvaluationRecordRow } from './index'
import { calculateLevel } from '@/data/pets'

export interface AddEvaluationInput {
  classId: string
  studentId: string
  points: number
  reason: string
  category: string
}

export async function addEvaluation(input: AddEvaluationInput) {
  const id = crypto.randomUUID()
  const now = Date.now()

  return db.transaction('rw', [db.evaluation_records, db.students, db.badges], async () => {
    await db.evaluation_records.add({
      id, class_id: input.classId, student_id: input.studentId,
      points: input.points, reason: input.reason, category: input.category, timestamp: now
    })

    const student = await db.students.get(input.studentId)
    if (!student) return { id, timestamp: now }

    const newTotalPoints = student.total_points + input.points
    await db.students.update(input.studentId, { total_points: newTotalPoints })

    if (student.pet_type) {
      const newExp = Math.max(0, newTotalPoints)
      const newLevel = calculateLevel(newExp)
      let graduated = false
      if (newLevel === 8 && student.pet_level < 8) {
        await db.badges.add({ id: crypto.randomUUID(), student_id: input.studentId, pet_type: student.pet_type, earned_at: now })
        graduated = true
      }
      await db.students.update(input.studentId, { pet_exp: newExp, pet_level: newLevel })
      return {
        id, timestamp: now, petLevel: newLevel, petExp: newExp,
        levelUp: newLevel > student.pet_level, levelDown: newLevel < student.pet_level, graduated
      }
    }

    return { id, timestamp: now }
  })
}

export async function getStudentEvaluations(studentId: string, pageSize = 20): Promise<Array<EvaluationRecordRow & { student_name: string }>> {
  const student = await db.students.get(studentId)
  const records = await db.evaluation_records.where('student_id').equals(studentId)
    .reverse().sortBy('timestamp')
  return records.slice(0, pageSize).map(r => ({ ...r, student_name: student?.name || '' }))
}

export async function getClassEvaluations(classId: string, page: number, pageSize: number) {
  const all = await db.evaluation_records.where('class_id').equals(classId).toArray()
  const total = all.length
  const sorted = all.sort((a, b) => b.timestamp - a.timestamp)
  const offset = (page - 1) * pageSize
  const students = await db.students.where('class_id').equals(classId).toArray()
  const nameMap = new Map(students.map(s => [s.id, s.name]))
  const records = sorted.slice(offset, offset + pageSize).map(r => ({ ...r, student_name: nameMap.get(r.student_id) || '' }))
  return { records, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

async function undoRecord(record: EvaluationRecordRow): Promise<{ success: true; undone: EvaluationRecordRow & { student_name: string } }> {
  const student = await db.students.get(record.student_id)
  return db.transaction('rw', [db.students, db.evaluation_records], async () => {
    const expChange = Math.abs(record.points)
    const newExp = Math.max(0, (student?.pet_exp ?? 0) - expChange)
    const newLevel = calculateLevel(newExp)
    if (student) {
      await db.students.update(student.id, {
        total_points: student.total_points - record.points,
        pet_exp: newExp,
        pet_level: newLevel
      })
    }
    await db.evaluation_records.delete(record.id)
    return { success: true, undone: { ...record, student_name: student?.name || '' } }
  })
}

export async function deleteEvaluation(id: string) {
  const record = await db.evaluation_records.get(id)
  if (!record) throw new Error('Record not found')
  return undoRecord(record)
}

export async function deleteLatestEvaluation(classId: string) {
  const records = await db.evaluation_records.where('class_id').equals(classId).toArray()
  const latest = records.sort((a, b) => b.timestamp - a.timestamp)[0]
  if (!latest) throw new Error('No record found')
  return undoRecord(latest)
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/db/evaluations.test.ts`
Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add src/db/evaluations.ts src/db/evaluations.test.ts
git commit -m "feat(db): 评价数据访问函数（加分事务与撤回）"
```

---

## Task 9: 认证数据访问函数

**Files:**
- Create: `src/db/auth.ts`
- Test: `src/db/auth.test.ts`

**Interfaces:**
- Consumes: `db`、`UserRow`（Task 5）、`hashPassword` / `verifyPassword`（Task 4）。
- Produces:

| 函数 | 返回 |
|------|------|
| `register(username: string, password: string): Promise<{ id: string; username: string; isGuest: boolean }>` | 新用户（校验：用户名 3–20 字符、密码 ≥6、用户名唯一） |
| `login(username: string, password: string): Promise<{ id: string; username: string; isGuest: boolean }>` | 登录用户（校验失败抛错） |

`User` 类型复用 `src/types/index.ts` 的 `User`（`{ id, username, isGuest }`）。

- [ ] **Step 1: 写失败测试**

`src/db/auth.test.ts`：

```ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db, initDb, clearAll } from './index'
import { register, login } from './auth'

beforeEach(async () => {
  await db.open()
  await clearAll()
  await initDb()
})

describe('认证', () => {
  it('注册成功返回用户', async () => {
    const u = await register('teacher', 'secret6')
    expect(u.username).toBe('teacher')
    expect(u.isGuest).toBe(false)
  })

  it('登录成功', async () => {
    await register('teacher', 'secret6')
    const u = await login('teacher', 'secret6')
    expect(u.username).toBe('teacher')
  })

  it('密码错误登录失败', async () => {
    await register('teacher', 'secret6')
    await expect(login('teacher', 'wrong!')).rejects.toThrow()
  })

  it('用户名重复注册失败', async () => {
    await register('teacher', 'secret6')
    await expect(register('teacher', 'secret6')).rejects.toThrow()
  })

  it('用户名太短注册失败', async () => {
    await expect(register('ab', 'secret6')).rejects.toThrow()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run src/db/auth.test.ts`
Expected: 失败。

- [ ] **Step 3: 实现**

`src/db/auth.ts`：

```ts
import { db } from './index'
import type { UserRow } from './index'
import { hashPassword, verifyPassword } from '@/utils/password'
import type { User } from '@/types'

function toUser(row: UserRow): User {
  return { id: row.id, username: row.username, isGuest: !!row.is_guest }
}

export async function register(username: string, password: string): Promise<User> {
  if (!username || !password) throw new Error('用户名和密码不能为空')
  if (username.length < 3 || username.length > 20) throw new Error('用户名长度3-20字符')
  if (password.length < 6) throw new Error('密码至少6位')

  const existing = await db.users.where('username').equals(username).first()
  if (existing) throw new Error('用户名已存在')

  const id = crypto.randomUUID()
  const row: UserRow = {
    id, username, password_hash: await hashPassword(password), is_guest: 0, created_at: Date.now()
  }
  await db.users.add(row)
  return toUser(row)
}

export async function login(username: string, password: string): Promise<User> {
  if (!username || !password) throw new Error('用户名和密码不能为空')
  const row = await db.users.where('username').equals(username).first()
  if (!row) throw new Error('用户名或密码错误')
  if (!(await verifyPassword(password, row.password_hash))) throw new Error('用户名或密码错误')
  return toUser(row)
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx vitest run src/db/auth.test.ts`
Expected: 全部通过。

- [ ] **Step 5: 提交**

```bash
git add src/db/auth.ts src/db/auth.test.ts
git commit -m "feat(db): 认证数据访问函数（本地注册登录）"
```

---

## Task 10: 重写 useAuth.ts

**Files:**
- Modify: `src/composables/useAuth.ts`

**Interfaces:**
- Consumes: `login`、`register`（Task 9）。
- Produces: `useAuth()` 返回 `{ user, isLoggedIn, isGuest, username, setUser, logout, login, register, fetchUserInfo }`。移除 `api`、`token`。`Home.vue`（Task 12）与 `AuthModal.vue`（Task 11）依赖此接口。

- [ ] **Step 1: 重写文件**

完整替换 `src/composables/useAuth.ts` 为：

```ts
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { login as dbLogin, register as dbRegister } from '@/db/auth'

// 全局状态（模块级别单例）
const user = ref<User | null>(null)

// 初始化用户状态
const savedUser = localStorage.getItem('user')
if (savedUser) {
  try {
    user.value = JSON.parse(savedUser)
  } catch {
    localStorage.removeItem('user')
  }
}

// 如果没有用户，自动设置为游客
if (!user.value) {
  const guestUser: User = { id: 'guest', username: '游客', isGuest: true }
  user.value = guestUser
  localStorage.setItem('user', JSON.stringify(guestUser))
}

const isLoggedIn = computed(() => !!user.value && !user.value.isGuest)
const isGuest = computed(() => user.value?.isGuest ?? true)
const username = computed(() => user.value?.username || '游客')

function setUser(userData: User) {
  user.value = userData
  localStorage.setItem('user', JSON.stringify(userData))
}

function logout() {
  const guestUser: User = { id: 'guest', username: '游客', isGuest: true }
  user.value = guestUser
  localStorage.setItem('user', JSON.stringify(guestUser))
}

async function login(username: string, password: string): Promise<User> {
  const u = await dbLogin(username, password)
  setUser(u)
  return u
}

async function register(username: string, password: string): Promise<User> {
  const u = await dbRegister(username, password)
  setUser(u)
  return u
}

function fetchUserInfo() {
  // 本地场景：用户信息已在 localStorage，无需请求
  return user.value
}

export function useAuth() {
  return {
    user,
    isLoggedIn,
    isGuest,
    username,
    setUser,
    logout,
    login,
    register,
    fetchUserInfo
  }
}
```

- [ ] **Step 2: 运行类型检查确认无引用错误**

Run: `npx vue-tsc --noEmit`
Expected: 报错集中在 `Home.vue`、`AuthModal.vue` 仍引用 `api`（属预期，Task 11/12 修复）。`useAuth.ts` 本身无错误。

- [ ] **Step 3: 提交**

```bash
git add src/composables/useAuth.ts
git commit -m "refactor(auth): useAuth 去 axios，登录走本地 Dexie"
```

---

## Task 11: 改造 AuthModal.vue

**Files:**
- Modify: `src/components/AuthModal.vue:15,56-78`

**Interfaces:**
- Consumes: `useAuth()` 的 `login` / `register`（Task 10）。
- Produces: 登录/注册弹窗功能不变，验证本地化。

- [ ] **Step 1: 改造 script**

修改 `src/components/AuthModal.vue`：

把第 15 行的：
```ts
const { api, setUser } = useAuth()
```
改为：
```ts
const { login, register } = useAuth()
```

把 `handleSubmit` 中第 55–78 行的 try/catch 块改为：

```ts
  loading.value = true

  try {
    const user = mode.value === 'login'
      ? await login(username.value.trim(), password.value)
      : await register(username.value.trim(), password.value)

    emit('login', user)
    emit('close')

    username.value = ''
    password.value = ''
    confirmPassword.value = ''
  } catch (err: any) {
    error.value = err.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
```

（保留 `handleSubmit` 开头的本地校验逻辑不变；`endpoint` 变量删除；`setUser` 不再需要，因为 `login`/`register` 内部已调用 `setUser`。）

- [ ] **Step 2: 运行类型检查**

Run: `npx vue-tsc --noEmit`
Expected: `AuthModal.vue` 无错误。

- [ ] **Step 3: 提交**

```bash
git add src/components/AuthModal.vue
git commit -m "refactor(auth): AuthModal 登录改本地 Dexie"
```

---

## Task 12: Home.vue 18 处调用替换

**Files:**
- Modify: `src/pages/Home.vue`

**Interfaces:**
- Consumes: 所有数据访问函数（Task 6–9）、`useAuth()` 新接口（Task 10）。
- Produces: `Home.vue` 不再使用 `api`。

按下面 5 组替换（每组替换后可运行 `vue-tsc` 检查）。导入区（第 3 行附近）需新增：

```ts
import { getClasses, createClass, updateClass, deleteClass, getStudents, addStudent, importStudents, updateStudentPet, updateStudentPetName } from '@/db/classes'
import { getRules, addRule, deleteRule } from '@/db/rules'
import { addEvaluation, getStudentEvaluations, getClassEvaluations, deleteEvaluation, deleteLatestEvaluation } from '@/db/evaluations'
```

同时把第 33 行 `const { isGuest, username, logout, api } = useAuth()` 改为 `const { isGuest, username, logout } = useAuth()`。

### 组 1：班级（5 处）

| 位置 | 原代码 | 新代码 |
|------|--------|--------|
| `loadClasses`（240 行） | `const res = await api.get('/classes'); classes.value = res.data.classes` | `classes.value = await getClasses()` |
| `loadStudents`（268 行） | `const res = await api.get(\`/classes/${currentClass.value.id}/students\`); students.value = res.data.students` | `students.value = await getStudents(currentClass.value.id)` |
| `createClass`（283 行） | `await api.post('/classes', { name: newClassName.value.trim() })` | `await createClass(newClassName.value.trim())` |
| `updateClass`（303 行） | `await api.put(\`/classes/${classToEdit.id}\`, { name: newName })` | `await updateClass(classToEdit.id, newName)` |
| `deleteClass`（339 行） | `await api.delete(\`/classes/${id}\`)` | `await deleteClass(id)` |

### 组 2：学生（5 处）

| 位置 | 原代码 | 新代码 |
|------|--------|--------|
| `addStudent`（353 行） | `await api.post('/students', { classId, name, studentNo })` | `await addStudent(currentClass.value.id, newStudentName.value.trim(), newStudentNo.value.trim() \|\| null)` |
| `importStudents`（397 行） | `const res = await api.post('/students/import', { classId, students }); toast.success(\`成功导入 ${res.data.imported} 名学生\`)` | `const res = await importStudents(currentClass.value.id, students); toast.success(\`成功导入 ${res.imported} 名学生\`)` |
| `confirmAdopt`（426 行） | `await api.put(\`/students/${selectedStudent.value.id}/pet\`, { petType: adoptPetId.value, petName })` | `await updateStudentPet(selectedStudent.value.id, adoptPetId.value, petName)` |
| `savePetName`（454 行） | `await api.put(\`/students/${detailStudent.value.id}/pet/name\`, { petName })` | `await updateStudentPetName(detailStudent.value.id, petName)` |
| `batchDeleteStudents`（558 行） | `await api.delete(\`/students/${studentId}\`)` | `await deleteStudent(studentId)` |

### 组 3：规则（3 处）

| 位置 | 原代码 | 新代码 |
|------|--------|--------|
| `loadRules`（273 行） | `const res = await api.get('/rules'); rules.value = res.data.rules` | `rules.value = await getRules()` |
| `addRule`（785 行） | `await api.post('/rules', { name, points, category })` | `await addRule(newRuleName.value.trim(), newRulePoints.value, newRuleCategory.value)` |
| `deleteRule`（809 行） | `await api.delete(\`/rules/${id}\`)` | `await deleteRule(id)` |

### 组 4：评价（6 处）

| 位置 | 原代码 | 新代码 |
|------|--------|--------|
| `detailQuickAdd`（601 行） | `const res = await api.post('/evaluations', { classId, studentId, points, reason, category })` | `const res = await addEvaluation({ classId: currentClass.value?.id!, studentId: student.id, points: rule.points, reason: rule.name, category: rule.category })` |
| `quickAdd` 批量（649 行） | `await api.post('/evaluations', {...})` | `await addEvaluation({ classId: currentClass.value?.id!, studentId, points: rule.points, reason: rule.name, category: rule.category })` |
| `quickAdd` 单个（672 行） | `const res = await api.post('/evaluations', {...})` | `const res = await addEvaluation({ classId: currentClass.value?.id!, studentId: student.id, points: rule.points, reason: rule.name, category: rule.category })` |
| `loadStudentRecords`（496 行） | `const res = await api.get(\`/evaluations?studentId=${studentId}&pageSize=20\`); studentRecords.value = res.data.records \|\| []` | `studentRecords.value = await getStudentEvaluations(studentId)` |
| `loadEvaluationRecords`（712 行） | `const res = await api.get(\`/evaluations?classId=${currentClass.value.id}&page=${recordsPage.value}&pageSize=${recordsPageSize}\`); evaluationRecords.value = res.data.records; totalRecords.value = res.data.total` | `const res = await getClassEvaluations(currentClass.value.id, recordsPage.value, recordsPageSize); evaluationRecords.value = res.records; totalRecords.value = res.total` |
| `undoLastEvaluation`（760 行） | `res = await api.delete(\`/evaluations/${recordId}\`)` 与 `res = await api.delete(\`/evaluations/latest?classId=${currentClass.value!.id}\`)` | `res = await deleteEvaluation(recordId)` 与 `res = await deleteLatestEvaluation(currentClass.value!.id)` |

注：`quickAdd` / `detailQuickAdd` 中 `res.data.levelUp` / `res.data.petLevel` / `res.data.graduated` 改为 `res.levelUp` / `res.petLevel` / `res.graduated`（因为 `addEvaluation` 直接返回对象，不再有 `.data` 包裹）。`undoLastEvaluation` 中 `res.data.success` / `res.data.undone` 同理改为 `res.success` / `res.undone`。

### 组 5：删除死代码

删除 `Home.vue` 第 820–867 行被注释的 `exportBackup` / `importBackup` 函数块（连同 `// TODO: 导入导出功能暂时屏蔽...` 注释）。模板中已注释的备份 UI（1059–1064 行附近）一并删除。

- [ ] **Step 1: 按组 1–5 逐组替换**

每完成一组，运行 `npx vue-tsc --noEmit` 确认该组无新增类型错误。

- [ ] **Step 2: 全文检查无 api 残留**

Run: `grep -n "api\." src/pages/Home.vue src/components/AuthModal.vue src/composables/useAuth.ts`
Expected: 无输出（`api` 已全部移除）。

- [ ] **Step 3: 提交**

```bash
git add src/pages/Home.vue
git commit -m "refactor: Home.vue 数据访问改为 Dexie 本地调用"
```

---

## Task 13: 配置变更（vite base、路由 hash、package.json）

**Files:**
- Modify: `vite.config.ts:10`
- Modify: `src/router/index.ts:1,6`
- Modify: `package.json`

**Interfaces:**
- Produces: 构建产物资源路径为 `/StarPets/`，路由用 hash 模式，`npm run build` 成功。

- [ ] **Step 1: 改 vite base**

`vite.config.ts` 第 10 行 `base: '/pet-garden/'` 改为 `base: '/StarPets/'`。

- [ ] **Step 2: 改路由为 hash 模式**

`src/router/index.ts`：

```ts
import { createRouter, createWebHashHistory } from 'vue-router'
// ...
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/preview', name: 'preview', component: PetPreview }
  ]
})
```

- [ ] **Step 3: 改 package.json**

- 移除 `dependencies` 中的 `axios`、`devDependencies` 中的 `concurrently`
- 移除 `scripts` 中的 `server` 与 `start`
- `dev` 脚本由 `vite` 保持不变（不再需要后端）

- [ ] **Step 4: 移除 axios 依赖**

Run:
```bash
npm uninstall axios concurrently
```
Expected: `package.json` 与 `package-lock.json` 更新，无报错。

- [ ] **Step 5: 构建验证**

Run: `npm run build`
Expected: 构建成功，`dist/index.html` 中资源路径以 `/StarPets/` 开头。

- [ ] **Step 6: 提交**

```bash
git add vite.config.ts src/router/index.ts package.json package-lock.json
git commit -m "chore: 配置 base 路径、hash 路由，移除 axios/concurrently"
```

---

## Task 14: GitHub Actions 部署工作流

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: push 到 `main` 时自动构建并发布到 `gh-pages` 分支。

- [ ] **Step 1: 创建工作流**

`.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main, master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 验证 YAML 语法**

Run: `npx prettier --check .github/workflows/deploy.yml`（若无 prettier 可跳过，人工核对缩进）

- [ ] **Step 3: 提交**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: GitHub Pages 自动部署工作流"
```

---

## Task 15: 删除后端与脚本

**Files:**
- Delete: `server/`（整个目录）
- Delete: `deploy.sh`、`start-server.sh`、`health-check.sh`、`nginx-cdn.conf`

**Interfaces:**
- Produces: 仓库不再含后端代码。

- [ ] **Step 1: 删除后端与脚本**

Run:
```bash
git rm -r server
git rm deploy.sh start-server.sh health-check.sh nginx-cdn.conf
```

- [ ] **Step 2: 更新 vitest 配置**

`vitest.config.ts` 的 coverage `exclude` 中删除 `'server/index.js', // 入口文件` 这一行（`server/` 已不存在）。

- [ ] **Step 3: 运行测试确认无引用残留**

Run: `npx vitest run`
Expected: 所有测试通过，无报错引用 `server/`。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "refactor: 删除后端与部署脚本，纯前端化"
```

---

## Task 16: 完整验证

**Files:**
- 无新增文件

- [ ] **Step 1: 全量测试**

Run: `npm test`
Expected: 全部通过（含 `pets.test.ts`、`evaluation-rules.test.ts`、`password.test.ts`、`db/*.test.ts`）。

- [ ] **Step 2: 生产构建**

Run: `npm run build`
Expected: `vue-tsc` 类型检查通过 + `vite build` 成功。

- [ ] **Step 3: 本地预览冒烟测试**

Run: `npm run preview`，浏览器打开预览地址，手动验证：
1. 打开页面自动进入游客模式
2. 创建班级 → 添加学生 → 批量导入学生
3. 领养宠物 → 评价加分（验证升级动画与积分变化）
4. 注册/登录/退出账号
5. 刷新页面数据不丢失

- [ ] **Step 4: 确认验收标准**

对照 spec §11 逐项勾选。

---

## Self-Review 记录

执行计划前自查（本文件作者）：

1. **Spec 覆盖**：spec §3 的 5 项决策（Dexie / GitHub Pages / 认证本地化 / 备份移除 / 批量导入保留）均已落到任务；§4.1 schema（Task 5）、§4.2 函数（Task 6–9）、§5.1 等级复用（Task 8 依赖 `pets.ts`）、§5.2 评价事务（Task 8）、§5.3 批量导入（Task 6）、§6 认证（Task 9–11）、§7 前端改造（Task 12）、§8 部署（Task 13–14）、§9 删除（Task 15）全部有对应任务。
2. **占位符扫描**：无 TBD/TODO/"实现稍后"；所有步骤含实际代码或命令。
3. **类型一致性**：`addEvaluation` 返回的 `levelUp`/`petLevel`/`graduated` 字段贯穿 Task 8（定义）与 Task 12（消费）一致；`deleteEvaluation` 返回 `{ success, undone }` 与 Task 12 `undoLastEvaluation` 消费一致。

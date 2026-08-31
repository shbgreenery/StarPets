<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getTasks, createTask, deleteTask, completeTask, type Task } from '@/db/tasks'
import type { Student } from '@/types'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  show: boolean
  students: Student[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'achievement-reached', info: { studentName: string; taskName: string; days: number; starBonus: number }): void
  (e: 'task-completed'): void
}>()

const toast = useToast()
const tasks = ref<Task[]>([])
const isLoading = ref(false)

// 创建任务表单
const showCreateForm = ref(false)
const newTaskName = ref('')
const newTaskStudentId = ref('')

// 删除确认
const deleteConfirmId = ref<string | null>(null)

// 按学生分组
const groupedTasks = computed(() => {
  const groups: { student: Student; tasks: Task[] }[] = []
  for (const student of props.students) {
    const studentTasks = tasks.value.filter(t => t.student_id === student.id)
    if (studentTasks.length > 0) {
      groups.push({ student, tasks: studentTasks })
    }
  }
  return groups
})

// 无任务的学生
const studentsWithoutTasks = computed(() => {
  const withTasks = new Set(tasks.value.map(t => t.student_id))
  return props.students.filter(s => !withTasks.has(s.id))
})

async function loadTasks() {
  isLoading.value = true
  try {
    tasks.value = await getTasks()
  } catch (error) {
    console.error('加载任务失败:', error)
  } finally {
    isLoading.value = false
  }
}

async function handleCreateTask() {
  if (!newTaskName.value.trim()) {
    toast.warning('请输入任务名称')
    return
  }
  if (!newTaskStudentId.value) {
    toast.warning('请选择宝贝')
    return
  }
  try {
    await createTask(newTaskStudentId.value, newTaskName.value.trim())
    toast.success('任务创建成功！')
    newTaskName.value = ''
    newTaskStudentId.value = ''
    showCreateForm.value = false
    await loadTasks()
  } catch (error) {
    console.error('创建任务失败:', error)
    toast.error('创建失败，请重试')
  }
}

async function handleCompleteTask(taskId: string) {
  try {
    const result = await completeTask(taskId)
    if (result.starBonus > 0) {
      toast.success(`完成！+${result.starBonus} 星`)
    }
    if (result.achieved.length > 0) {
      const task = tasks.value.find(t => t.id === taskId)
      const student = props.students.find(s => s.id === task?.student_id)
      // 通知父组件弹出成就弹窗
      emit('achievement-reached', {
        studentName: student?.name || '',
        taskName: task?.name || '',
        days: parseInt(result.achieved[result.achieved.length - 1]),
        starBonus: result.achievementStarBonus
      })
    }
    emit('task-completed')
    await loadTasks()
  } catch (error) {
    console.error('完成任务失败:', error)
    toast.error('操作失败，请重试')
  }
}

async function handleDeleteTask(taskId: string) {
  try {
    await deleteTask(taskId)
    toast.success('任务已删除')
    deleteConfirmId.value = null
    await loadTasks()
  } catch (error) {
    console.error('删除任务失败:', error)
    toast.error('删除失败，请重试')
  }
}

function getStreakLabel(streak: number): string {
  if (streak === 0) return '未开始'
  if (streak >= 21) return '🔥 21+ 天'
  if (streak >= 7) return '🔥 第 ' + streak + ' 天'
  return '第 ' + streak + ' 天'
}

function getAchievementBadges(achievements: string): string[] {
  try {
    const list: string[] = JSON.parse(achievements)
    return list.map((d: string) => {
      const num = parseInt(d)
      if (num === 3) return '3️⃣'
      if (num === 7) return '7️⃣'
      if (num === 15) return '1️⃣5️⃣'
      if (num === 21) return '2️⃣1️⃣'
      return d
    })
  } catch {
    return []
  }
}

onMounted(() => {
  if (props.show) {
    loadTasks()
  }
})

// 监听 show 变化
import { watch } from 'vue'
watch(() => props.show, (val) => {
  if (val) {
    loadTasks()
    showCreateForm.value = false
    deleteConfirmId.value = null
  }
})
</script>

<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
        <!-- 头部 -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-800">📋 习惯任务</h2>
          <div class="flex items-center gap-2">
            <button
              class="text-sm px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-medium hover:shadow-md transition-all"
              @click="showCreateForm = true"
            >
              + 新建任务
            </button>
            <button class="text-gray-400 hover:text-gray-600 text-xl leading-none" @click="emit('close')">✕</button>
          </div>
        </div>

        <!-- 创建表单 -->
        <Transition name="slide">
          <div v-if="showCreateForm" class="px-6 py-4 bg-orange-50 border-b border-orange-100">
            <div class="flex flex-col gap-3">
              <input
                v-model="newTaskName"
                placeholder="任务名称，如「收拾玩具」"
                class="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none text-sm"
                @keyup.enter="handleCreateTask"
              />
              <div class="flex gap-2">
                <select
                  v-model="newTaskStudentId"
                  class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none text-sm bg-white"
                >
                  <option value="">选择宝贝</option>
                  <option
                    v-for="s in studentsWithoutTasks.length > 0 ? studentsWithoutTasks : props.students"
                    :key="s.id"
                    :value="s.id"
                  >{{ s.name }}</option>
                </select>
                <button
                  class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white font-medium text-sm hover:shadow-md transition-all disabled:opacity-50"
                  :disabled="!newTaskName.trim() || !newTaskStudentId"
                  @click="handleCreateTask"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 任务列表 -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div v-if="isLoading" class="text-center text-gray-400 py-8">加载中...</div>

          <div v-else-if="tasks.length === 0" class="text-center text-gray-400 py-8">
            <div class="text-4xl mb-3">📋</div>
            <p>还没有习惯任务</p>
            <p class="text-sm mt-1">点击「+ 新建任务」开始吧</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="group in groupedTasks" :key="group.student.id">
              <h3 class="text-sm font-medium text-gray-500 mb-2">{{ group.student.name }}</h3>
              <div class="space-y-2">
                <div
                  v-for="task in group.tasks"
                  :key="task.id"
                  class="bg-gray-50 rounded-2xl p-4 transition-all"
                  :class="task.current_streak > 0 ? 'ring-1 ring-orange-200' : ''"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-gray-800">{{ task.name }}</span>
                    <div class="flex items-center gap-2">
                      <!-- 连续天数标签 -->
                      <span class="text-xs px-2 py-1 rounded-full font-medium"
                        :class="task.current_streak >= 21 ? 'bg-red-100 text-red-600' : task.current_streak >= 7 ? 'bg-orange-100 text-orange-600' : task.current_streak > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'"
                      >
                        {{ getStreakLabel(task.current_streak) }}
                      </span>
                      <!-- 删除按钮 -->
                      <button
                        v-if="deleteConfirmId !== task.id"
                        class="text-gray-300 hover:text-red-400 text-sm transition-colors"
                        @click="deleteConfirmId = task.id"
                      >🗑️</button>
                    </div>
                  </div>

                  <!-- 成就徽章 -->
                  <div v-if="getAchievementBadges(task.achievements).length > 0" class="flex gap-1 mb-2">
                    <span
                      v-for="badge in getAchievementBadges(task.achievements)"
                      :key="badge"
                      class="text-sm"
                    >{{ badge }}</span>
                  </div>

                  <!-- 统计信息 -->
                  <div class="flex items-center gap-4 text-xs text-gray-400 mb-3">
                    <span>总完成 {{ task.total_days }} 天</span>
                    <span>最长连续 {{ task.max_streak }} 天</span>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="flex gap-2">
                    <button
                      class="flex-1 py-2 rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 text-white text-sm font-medium hover:shadow-md transition-all active:scale-[0.98]"
                      @click="handleCompleteTask(task.id)"
                    >
                      ✅ 今日完成
                    </button>
                    <!-- 删除确认 -->
                    <button
                      v-if="deleteConfirmId === task.id"
                      class="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:shadow-md transition-all"
                      @click="handleDeleteTask(task.id)"
                    >
                      确认删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部提示 -->
        <div class="px-6 py-3 border-t border-gray-100 text-center">
          <p class="text-xs text-gray-400">
            连续 3/7/15/21 天达成成就，自动奖励 5 星 🎉
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
}
</style>
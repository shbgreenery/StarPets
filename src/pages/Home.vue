<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getPetType } from '@/data/pets'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import LoadingOverlay from '@/components/home/LoadingOverlay.vue'
import LevelUpModal from '@/components/home/LevelUpModal.vue'
import TopBar from '@/components/home/TopBar.vue'
import StudentCard from '@/components/home/StudentCard.vue'
import DeleteStudentsBar from '@/components/home/DeleteStudentsBar.vue'
import AddStudentModal from '@/components/home/AddStudentModal.vue'
import SelectPetModal from '@/components/home/SelectPetModal.vue'
import RecordsModal from '@/components/home/RecordsModal.vue'
import RulesModal from '@/components/home/RulesModal.vue'
import StudentDetailPanel from '@/components/home/StudentDetailPanel.vue'
import Leaderboard from '@/components/home/Leaderboard.vue'
import { useToast } from '@/composables/useToast'
import { getStudents, addStudent, updateStudentPet, updateStudentPetName, deleteStudent, buyShopItem, buyDecoration, wearDecoration, takeOffDecoration } from '@/db/classes'
import { getRules, addRule, deleteRule } from '@/db/rules'
import { addEvaluation, getStudentEvaluations, getEvaluations } from '@/db/evaluations'
import type { ShopItem } from '@/data/shop'
import type { DecorationItem, DecorAction } from '@/data/decorations'
import type { EvaluationRecord, Rule, Student } from '@/types'

// Toast 提示
const toast = useToast()

// State
const students = ref<Student[]>([])
const rules = ref<Rule[]>([])

// 模态框显隐
const showStudentModal = ref(false)
const showPetModal = ref(false)
const showRecordsModal = ref(false)
const showRulesModal = ref(false)
const showLeaderboardModal = ref(false)

// 选择宠物目标
const selectedStudent = ref<Student | null>(null)
const showDeleteStudentMode = ref(false)
const deleteStudentList = ref<string[]>([])

// 评价记录与分页
const evaluationRecords = ref<EvaluationRecord[]>([])
const recordsPage = ref(1)
const recordsPageSize = 20
const totalRecords = ref(0)

// 确认对话框状态
const confirmDialog = ref({
  show: false,
  title: '确认',
  message: '',
  confirmText: '确认',
  cancelText: '取消',
  type: 'info' as 'info' | 'warning' | 'danger',
  onConfirm: () => {}
})

// 通用确认函数
function showConfirm(options: {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'danger'
  onConfirm: () => void
}) {
  confirmDialog.value = {
    show: true,
    title: options.title,
    message: options.message,
    confirmText: options.confirmText || '确认',
    cancelText: options.cancelText || '取消',
    type: options.type || 'info',
    onConfirm: () => {
      options.onConfirm()
      confirmDialog.value.show = false
    }
  }
}

// 升级动画状态
const levelUpPhase = ref<'show-prev' | 'transition' | 'show-current'>('show-prev')
const showLevelUpAnimation = ref(false)
const levelUpInfo = ref({ name: '', level: 0, petType: '', prevLevel: 0 })

// 加载状态
const isLoading = ref(true)

// 详情面板
const showDetailPanel = ref(false)
const detailStudent = ref<Student | null>(null)

// 评分动效
const scoreAnimations = ref<Map<string, { points: number, show: boolean }>>(new Map())

// 喂养过程动画(卡片气泡台词,2.5s 自动消失)
const feedAnimations = ref<Map<string, 'hunger' | 'cleanliness' | 'happiness'>>(new Map())
function triggerFeedAnimation(studentId: string, kind: 'hunger' | 'cleanliness' | 'happiness') {
  feedAnimations.value.set(studentId, kind)
  setTimeout(() => {
    feedAnimations.value.delete(studentId)
  }, 2500)
}

// 学生评价记录
const studentRecords = ref<EvaluationRecord[]>([])

// Computed
// 记录总页数
const totalPages = computed(() => {
  return Math.ceil(totalRecords.value / recordsPageSize)
})

// API calls
async function loadStudents() {
  students.value = await getStudents()
}

async function loadRules() {
  rules.value = await getRules()
}

function openLeaderboard() {
  showLeaderboardModal.value = true
}

async function handleAddStudent(name: string) {
  try {
    await addStudent(name)
    showStudentModal.value = false
    await loadStudents()
  } catch (error) {
    console.error('添加宝贝失败:', error)
    toast.error('添加宝贝失败，请重试')
  }
}

function openPetSelect(student: Student) {
  selectedStudent.value = student
  showPetModal.value = true
}

async function handleAdopt(payload: { petId: string; petName: string }) {
  if (!selectedStudent.value) return
  try {
    const petName = payload.petName.trim() || undefined
    await updateStudentPet(selectedStudent.value.id, payload.petId, petName)
    const pet = getPetType(payload.petId)
    toast.success(`🎉 ${selectedStudent.value.name} 领养了一只 ${pet?.name || '宠物'}！`)
    showPetModal.value = false
    selectedStudent.value = null
    await loadStudents()
    // 更新详情面板中的学生信息
    if (detailStudent.value) {
      detailStudent.value = students.value.find(s => s.id === detailStudent.value?.id) || null
    }
  } catch (error) {
    console.error('领养宠物失败:', error)
    toast.error('领养失败，请重试')
  }
}

async function savePetName(name: string) {
  if (!detailStudent.value) return
  try {
    const petName = name.trim() || null
    await updateStudentPetName(detailStudent.value.id, petName)
    detailStudent.value.pet_name = petName
    const idx = students.value.findIndex(s => s.id === detailStudent.value!.id)
    if (idx !== -1) {
      students.value[idx] = { ...students.value[idx], pet_name: petName }
    }
    toast.success('宠物名字已更新')
  } catch (error) {
    console.error('改名字失败:', error)
    toast.error('改名字失败，请重试')
  }
}

// 打开详情面板
async function openDetailPanel(student: Student) {
  if (!student.pet_type) {
    confirmDialog.value = {
      show: true,
      title: '领养宠物',
      message: `${student.name} 还没有领养宠物，是否现在领养？`,
      confirmText: '去领养',
      cancelText: '暂不',
      type: 'info',
      onConfirm: () => {
        openPetSelect(student)
        confirmDialog.value.show = false
      }
    }
    return
  }
  detailStudent.value = student
  showDetailPanel.value = true

  // 加载该学生的评价记录
  await loadStudentRecords(student.id)
}

// 加载学生评价记录
async function loadStudentRecords(studentId: string) {
  try {
    studentRecords.value = await getStudentEvaluations(studentId)
  } catch (error) {
    console.error('加载记录失败:', error)
    studentRecords.value = []
  }
}

// 关闭详情面板
function closeDetailPanel() {
  showDetailPanel.value = false
  detailStudent.value = null
  studentRecords.value = []
}

// 商城购买(商城已内嵌详情面板)
async function handleShopBuy(item: ShopItem) {
  if (!detailStudent.value) return
  const studentId = detailStudent.value.id
  try {
    const res = await buyShopItem(studentId, item)
    // 卡片上播放吃东西/洗澡/玩玩具过程动画(与休眠与否无关,动作已发生)
    triggerFeedAnimation(studentId, item.target)
    if (res.gainedPoints > 0) {
      toast.success(`购买成功！${item.name}，成长值 +${res.gainedPoints}`)
    } else {
      toast.success(`购买成功！${item.name}（休眠中，不涨成长值）`)
    }
    // 关闭详情面板,让卡片上的喂养动画不被遮挡、立即可见
    closeDetailPanel()
    // 成长值由喂养驱动,购买可能触发升级/毕业动画
    if (res.graduated) {
      toast.success(`🎓 恭喜！${res.student.name} 的宠物毕业了，获得了专属徽章！`)
      triggerLevelUpAnimation(res.student, res.student.pet_level)
    } else if (res.leveledUp) {
      triggerLevelUpAnimation(res.student, res.student.pet_level)
    }
    await loadStudents()
  } catch (error) {
    console.error('购买失败:', error)
    toast.error(error instanceof Error ? error.message : '购买失败')
  }
}

// 商城装扮操作:购买 / 戴上 / 卸下。免费操作不关面板,方便连续换装
async function handleDecor(action: DecorAction, item: DecorationItem) {
  if (!detailStudent.value) return
  const studentId = detailStudent.value.id
  try {
    if (action === 'buy') {
      await buyDecoration(studentId, item)
      toast.success(`已为 ${detailStudent.value.name} 买下「${item.name}」！`)
    } else if (action === 'wear') {
      await wearDecoration(studentId, item)
      toast.success(`已为 ${detailStudent.value.name} 戴上「${item.name}」！`)
    } else {
      await takeOffDecoration(studentId, item)
      toast.success(`已卸下「${item.name}」`)
    }
    await loadStudents()
    // 就地刷新详情面板,商城 tab 内穿戴状态即时更新(面板保持打开)
    if (detailStudent.value) {
      detailStudent.value = students.value.find(s => s.id === detailStudent.value?.id) || null
    }
  } catch (error) {
    console.error('装饰操作失败:', error)
    toast.error(error instanceof Error ? error.message : '操作失败')
  }
}

// 详情面板：更换宠物
function changeDetailPet() {
  if (!detailStudent.value) return
  const student = detailStudent.value
  closeDetailPanel()
  openPetSelect(student)
}

// 学生卡片点击
function handleStudentCardClick(student: Student) {
  if (showDeleteStudentMode.value) {
    toggleDeleteStudent(student.id)
  } else {
    openDetailPanel(student)
  }
}

function toggleDeleteStudent(studentId: string) {
  const index = deleteStudentList.value.indexOf(studentId)
  if (index > -1) {
    deleteStudentList.value.splice(index, 1)
  } else {
    deleteStudentList.value.push(studentId)
  }
}

function cancelDeleteMode() {
  showDeleteStudentMode.value = false
  deleteStudentList.value = []
}

// 进入删除模式
function startDeleteMode() {
  showDeleteStudentMode.value = true
  deleteStudentList.value = []
}

async function batchDeleteStudents() {
  if (deleteStudentList.value.length === 0) return

  showConfirm({
    title: '删除宝贝',
    message: `确定删除 ${deleteStudentList.value.length} 个宝贝？此操作不可恢复！`,
    confirmText: '删除',
    cancelText: '取消',
    type: 'danger',
    onConfirm: async () => {
      let successCount = 0
      for (const studentId of deleteStudentList.value) {
        try {
          await deleteStudent(studentId)
          successCount++
        } catch (error) {
          console.error('删除失败:', error)
        }
      }

      toast.success(`已删除 ${successCount} 个宝贝`)
      cancelDeleteMode()
      await loadStudents()
    }
  })
}

// 触发评分动效
function triggerScoreAnimation(studentId: string, points: number) {
  scoreAnimations.value.set(studentId, { points, show: true })
  setTimeout(() => {
    scoreAnimations.value.delete(studentId)
  }, 1500)
}

// 详情面板中快速评分
async function detailQuickAdd(rule: Rule) {
  if (!detailStudent.value) return

  const student = detailStudent.value

  try {
    const res = await addEvaluation({
      studentId: student.id,
      points: rule.points,
      reason: rule.name,
      category: rule.category
    })

    // 触发卡片动效
    triggerScoreAnimation(student.id, rule.points)

    toast.success(`评价完成，获得 ✨${res.starsGained} 星`)

    await loadStudents()

    // 关闭详情面板
    closeDetailPanel()
  } catch (error) {
    console.error('评价失败:', error)
    toast.error('评价失败，请重试')
  }
}

// 触发升级动画
function triggerLevelUpAnimation(student: Student, petLevel: number) {
  levelUpInfo.value = {
    name: student.name,
    level: petLevel,
    petType: student.pet_type || '',
    prevLevel: petLevel - 1
  }
  levelUpPhase.value = 'show-prev'
  showLevelUpAnimation.value = true

  // 动画时序控制
  setTimeout(() => { levelUpPhase.value = 'transition' }, 500)
  setTimeout(() => { levelUpPhase.value = 'show-current' }, 1500)
  setTimeout(() => { showLevelUpAnimation.value = false }, 4000)
}

// 评价记录加载与分页
async function loadEvaluationRecords() {
  const res = await getEvaluations(recordsPage.value, recordsPageSize)
  evaluationRecords.value = res.records
  totalRecords.value = res.total
}

// 打开评价记录模态框
function openRecordsModal() {
  loadEvaluationRecords()
  showRecordsModal.value = true
}

function prevPage() {
  if (recordsPage.value > 1) {
    recordsPage.value--
    loadEvaluationRecords()
  }
}

function nextPage() {
  if (recordsPage.value < totalPages.value) {
    recordsPage.value++
    loadEvaluationRecords()
  }
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    recordsPage.value = page
    loadEvaluationRecords()
  }
}

async function handleAddRule(payload: { name: string; points: number; category: string }) {
  if (!payload.name.trim()) {
    toast.warning('请输入规则名称')
    return
  }
  try {
    await addRule(payload.name.trim(), payload.points, payload.category)
    toast.success('添加成功！')
    await loadRules()
  } catch (error) {
    console.error('添加规则失败:', error)
    alert('添加失败，请重试')
  }
}

async function handleDeleteRule(id: string) {
  showConfirm({
    title: '删除规则',
    message: '确定删除该规则？',
    confirmText: '删除',
    cancelText: '取消',
    type: 'warning',
    onConfirm: async () => {
      try {
        await deleteRule(id)
        await loadRules()
        toast.success('删除成功！')
      } catch (error) {
        console.error('删除失败:', error)
        toast.error('删除失败')
      }
    }
  })
}

// 关闭选择宠物模态框
function closePetModal() {
  showPetModal.value = false
  selectedStudent.value = null
}

// Initialize
onMounted(async () => {
  isLoading.value = true
  try {
    await loadStudents()
    await loadRules()
  } finally {
    isLoading.value = false
  }
})
</script><template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex flex-col">

    <!-- 加载动画 -->
    <LoadingOverlay :show="isLoading" />

    <!-- 升级动画 -->
    <LevelUpModal
      :show="showLevelUpAnimation"
      :info="levelUpInfo"
      :phase="levelUpPhase"
    />

    <!-- 顶部导航栏 -->
    <TopBar
      :student-count="students.length"
      @add-student="showStudentModal = true"
      @delete-students="startDeleteMode"
      @show-records="openRecordsModal"
      @show-rules="showRulesModal = true"
      @show-leaderboard="openLeaderboard"
    />

    <!-- Main Content -->
    <main class="flex-1 overflow-auto p-3 sm:p-6">
      <Transition name="fade" mode="out-in">
        <!-- 无宝贝状态 -->
        <div v-if="students.length === 0" key="no-student" class="flex flex-col items-center justify-center min-h-[40vh]">
          <div class="text-6xl sm:text-8xl mb-6 animate-float">👶</div>
          <h3 class="text-2xl font-bold text-gray-700 mb-3">还没有宝贝</h3>
          <p class="text-gray-500 mb-6 text-lg">添加宝贝，让他们领养可爱的宠物吧！</p>
          <div class="flex gap-3">
            <button
              @click="showStudentModal = true"
              class="bg-gradient-to-r from-orange-400 to-pink-500 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-2xl hover:shadow-lg hover:scale-105 transition-all font-bold"
            >
              ➕ 添加宝贝
            </button>
          </div>
        </div>

        <!-- 学生列表 -->
        <div v-else key="students" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5">
          <StudentCard
            v-for="student in students"
            :key="student.id"
            :student="student"
            :delete-mode="showDeleteStudentMode"
            :marked-for-delete="deleteStudentList.includes(student.id)"
            :score-animation="scoreAnimations.get(student.id) || null"
            :feed-animation="feedAnimations.get(student.id) || null"
            @click="handleStudentCardClick"
          />
        </div>
      </Transition>

      <!-- 删除学生操作栏 -->
      <DeleteStudentsBar
        v-if="showDeleteStudentMode"
        :count="deleteStudentList.length"
        @confirm="batchDeleteStudents"
        @cancel="cancelDeleteMode"
      />
    </main><!-- 添加宝贝模态框 -->
    <AddStudentModal
      :show="showStudentModal"
      @close="showStudentModal = false"
      @submit="handleAddStudent"
    />

    <!-- 选择宠物模态框 -->
    <SelectPetModal
      :show="showPetModal"
      :student="selectedStudent"
      @close="closePetModal"
      @confirm="handleAdopt"
    />

    <!-- 评价记录模态框 -->
    <RecordsModal
      :show="showRecordsModal"
      :records="evaluationRecords"
      :page="recordsPage"
      :total="totalRecords"
      :total-pages="totalPages"
      @close="showRecordsModal = false"
      @prev="prevPage"
      @next="nextPage"
      @go="goToPage"
    />

    <!-- 管理规则模态框 -->
    <RulesModal
      :show="showRulesModal"
      :rules="rules"
      @close="showRulesModal = false"
      @add="handleAddRule"
      @delete="handleDeleteRule"
    />

    <!-- 光荣榜弹窗 -->
    <Transition name="modal">
      <div
        v-if="showLeaderboardModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        @click.self="showLeaderboardModal = false"
      >
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 class="text-lg font-bold text-gray-800">🏆 光荣榜</h2>
            <button class="text-gray-400 hover:text-gray-600 text-xl leading-none" @click="showLeaderboardModal = false">✕</button>
          </div>
          <div class="p-2">
            <Leaderboard :students="students" />
          </div>
        </div>
      </div>
    </Transition>

    <!-- 学生详情面板 -->
    <StudentDetailPanel
      :show="showDetailPanel"
      :student="detailStudent"
      :rules="rules"
      :records="studentRecords"
      @close="closeDetailPanel"
      @change-pet="changeDetailPet"
      @save-pet-name="savePetName"
      @quick-add="detailQuickAdd"
      @shop-buy="handleShopBuy"
      @shop-decor="handleDecor"
    />

    <!-- 确认对话框 -->
    <ConfirmDialog
      :show="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :cancel-text="confirmDialog.cancelText"
      :type="confirmDialog.type"
      @confirm="confirmDialog.onConfirm"
      @cancel="confirmDialog.show = false"
    />

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 光荣榜弹窗过渡 */
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
</style>
<template>
  <view class="templates-page">
    <!-- 模板列表 -->
    <view class="templates-section">
      <view class="section-header">
        <view class="section-title">训练模板</view>
        <view class="add-template-btn" @click="showCreateModal">
          <text class="add-icon">+</text>
          <text>新建模板</text>
        </view>
      </view>

      <view v-if="loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="templates.length === 0" class="empty-state">
        <text class="empty-emoji">📋</text>
        <text class="empty-title">暂无训练模板</text>
        <text class="empty-tip">创建第一个训练模板，快速开始训练</text>
        <button class="create-first-btn" @click="showCreateModal">创建模板</button>
      </view>

      <view v-else class="templates-list">
        <view
          v-for="template in templates"
          :key="template._id"
          class="template-card"
          @click="viewTemplateDetail(template)"
        >
          <view class="card-header">
            <view class="template-name">{{ template.name }}</view>
            <view class="action-count">
              <text class="count-value">{{ template.actions.length }}</text>
              <text class="count-label">个动作</text>
            </view>
          </view>
          
          <view class="card-actions">
            <text v-for="action in template.actions.slice(0, 4)" :key="action" class="action-tag">{{ action }}</text>
            <text v-if="template.actions.length > 4" class="more-actions">+{{ template.actions.length - 4 }}</text>
          </view>
          
          <view class="card-footer">
            <text class="update-time">更新于 {{ formatDate(template.updatedAt) }}</text>
            <view class="card-actions-group">
              <text class="action-btn" @click.stop="viewTemplateDetail(template)">查看</text>
              <text class="action-btn delete" @click.stop="confirmDelete(template)">{{ isDeleting ? '删除中' : '删除' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 创建/编辑弹窗 -->
    <view v-if="showModal" class="modal-overlay" @click="closeModal()">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isEditing ? '编辑模板' : '创建模板' }}</text>
          <text class="modal-close" @click="closeModal()">✕</text>
        </view>
        
        <view class="modal-body">
          <!-- 模板名称 -->
          <view class="modal-item">
            <view class="modal-label">模板名称 <text class="required">*</text></view>
            <input
              v-model="formData.name"
              class="modal-input"
              placeholder="如：胸部训练日、全身训练、新手入门"
            />
          </view>
          
          <!-- 预设动作 -->
          <view class="modal-item">
            <view class="modal-label">预设动作</view>
            <view class="action-input-section">
              <view class="action-input-wrapper">
                <input
                  v-model="newAction"
                  class="action-input"
                  placeholder="输入动作名称"
                  @confirm="addAction"
                />
                <view class="add-action-btn" @click="addAction">添加</view>
              </view>
              
              <view class="selected-actions">
                <view
                  v-for="(action, index) in formData.actions"
                  :key="index"
                  class="selected-action"
                >
                  <text class="action-name">{{ action }}</text>
                  <text class="remove-action" @click="removeAction(index)">✕</text>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 动作库选择 -->
          <view class="modal-item">
            <view class="modal-label">从动作库选择</view>
            <view class="library-picker">
              <view class="library-tabs">
                <text class="library-tab" :class="{ active: librarySource === 'local' }" @click="librarySource = 'local'">本地动作</text>
                <text class="library-tab" :class="{ active: librarySource === 'online' }" @click="switchLibrarySource('online')">ExerciseDB</text>
              </view>
              <input
                v-model="libraryKeyword"
                class="library-search"
                placeholder="搜索动作、部位或器械"
              />
              <scroll-view scroll-x class="library-filter-scroll">
                <view class="library-filters">
                  <text
                    v-for="part in libraryBodyParts"
                    :key="part.value"
                    class="library-filter"
                    :class="{ active: libraryBodyPart === part.value }"
                    @click="libraryBodyPart = part.value"
                  >
                    {{ part.label }}
                  </text>
                </view>
              </scroll-view>
            </view>
            <view v-if="librarySource === 'online'" class="library-status">
              <text>{{ onlineLibraryStatus }}</text>
            </view>
            <view class="recommend-actions">
              <view
                v-for="action in filteredLibraryActions"
                :key="action.name"
                class="recommend-action"
                :class="{ selected: formData.actions.includes(action.name) }"
                @click="toggleAction(action.name)"
              >
                <text class="recommend-name">{{ action.name }}</text>
                <text class="recommend-meta">{{ bodyPartName(action.bodyPart) }} · {{ equipmentName(action.equipment) }}</text>
              </view>
            </view>
            <button v-if="librarySource === 'online' && fullFilteredLibraryActions.length > filteredLibraryActions.length" class="library-more" @click="visibleLibraryLimit += 20">
              加载更多
            </button>
          </view>
        </view>
        
        <view class="modal-footer">
          <button class="modal-cancel" @click="closeModal()">取消</button>
          <button class="modal-confirm" :disabled="isSaving" @click="confirmSave">{{ isSaving ? '保存中...' : '保存' }}</button>
        </view>
      </view>
    </view>

    <!-- 详情弹窗 -->
    <view v-if="showDetail && selectedTemplate" class="detail-overlay" @click="closeDetail">
      <view class="detail-content" @click.stop>
        <view class="detail-header">
          <text class="detail-title">{{ selectedTemplate.name }}</text>
          <text class="detail-close" @click="closeDetail">✕</text>
        </view>
        
        <view class="detail-body">
          <view class="detail-section">
            <view class="section-subtitle">动作列表（{{ selectedTemplate.actions.length }}个）</view>
            <view
              v-for="(action, index) in selectedTemplate.actions"
              :key="index"
              class="detail-action-item"
            >
              <text class="action-index">{{ index + 1 }}</text>
              <text class="action-text">{{ action }}</text>
            </view>
          </view>
          
          <view class="detail-section">
            <view class="section-subtitle">使用说明</view>
            <view class="usage-tips">
              <text class="tip-item">• 使用此模板可快速开始训练</text>
              <text class="tip-item">• 模板中的动作会在训练记录页自动填充</text>
              <text class="tip-item">• 训练时可随时调整重量和组数</text>
            </view>
          </view>
        </view>
        
        <view class="detail-footer">
          <button class="detail-delete-btn" :disabled="isDeleting" @click="confirmDelete(selectedTemplate as any)">{{ isDeleting ? '删除中...' : '删除模板' }}</button>
          <button class="detail-edit-btn" @click="editTemplate(selectedTemplate as any)">编辑</button>
          <button class="detail-use-btn" @click="useTemplate(selectedTemplate as any)">使用此模板</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { TrainingTemplate, TrainingTemplateForm } from '@/types/template'
import { templateServiceLocal } from '@/services/template.local'
import { trainingPlanServiceLocal } from '@/services/training-plan.local'
import { BODY_PART_OPTIONS, EQUIPMENT_LABELS, EXERCISE_LIBRARY, type ExerciseBodyPart, type ExerciseEquipment } from '@/services/exercise-library.local'
import { exerciseDbService, type ExerciseDbItem } from '@/services/exercisedb.local'
import { translateExerciseName } from '@/utils/exercise-name-translate'
import { hasLocalExerciseGif } from '@/services/exercise-media.local'
import { useMiniProgramShare } from '@/utils/share'

type LibrarySource = 'local' | 'online'
type LibraryActionOption = { name: string; bodyPart: ExerciseBodyPart; equipment: ExerciseEquipment; aliases?: string[] }

useMiniProgramShare({
  title: 'FitAI 健身记录：复用你的训练模板'
})

const templates = ref<TrainingTemplate[]>([])
const loading = ref(false)
const showModal = ref(false)
const showDetail = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const selectedTemplate = ref<TrainingTemplate | null>(null)
const newAction = ref('')
const libraryKeyword = ref('')
const libraryBodyPart = ref<ExerciseBodyPart | 'all'>('all')
const librarySource = ref<LibrarySource>('local')
const onlineLibraryActions = ref<ExerciseDbItem[]>([])
const onlineLibraryLoading = ref(false)
const onlineLibraryError = ref('')
const visibleLibraryLimit = ref(40)
const modalSnapshot = ref('')

const formData = reactive<TrainingTemplateForm>({
  name: '',
  actions: []
})

function normalizeTemplateActions(actions: string[]) {
  const seen = new Set<string>()
  return actions
    .map((action) => String(action || '').trim())
    .filter((action) => {
      if (!action || seen.has(action)) return false
      seen.add(action)
      return true
    })
}

function modalFingerprint() {
  return JSON.stringify({
    name: formData.name.trim(),
    actions: normalizeTemplateActions(formData.actions)
  })
}

function rememberModalState() {
  modalSnapshot.value = modalFingerprint()
}

function hasModalChanges() {
  return modalFingerprint() !== modalSnapshot.value
}

const libraryBodyParts = BODY_PART_OPTIONS.filter((item) => item.value !== 'cardio')
const bodyPartLabels: Record<ExerciseBodyPart, string> = {
  chest: '胸',
  back: '背',
  shoulders: '肩',
  arms: '手臂',
  legs: '腿臀',
  core: '核心',
  full: '全身',
  cardio: '有氧'
}

const onlineLibraryStatus = computed(() => {
  if (onlineLibraryLoading.value) return '正在加载 ExerciseDB，免费接口较慢时请稍等...'
  if (onlineLibraryError.value) return onlineLibraryError.value
  if (!onlineLibraryActions.value.length) return '切换到 ExerciseDB 后会按需加载在线动作，避免接口访问过频。'
  return `已加载 ${onlineLibraryActions.value.length} 个在线动作`
})

const libraryActions = computed<LibraryActionOption[]>(() => {
  if (librarySource.value === 'online') {
    const online = [...onlineLibraryActions.value].sort((a, b) => Number(hasLocalExerciseGif(b.exerciseId)) - Number(hasLocalExerciseGif(a.exerciseId))).map((item) => ({
      name: formatOnlineName(item.name),
      bodyPart: mapOnlineBodyPart(item.bodyParts),
      equipment: mapOnlineEquipment(item.equipments)
    }))
    const local = EXERCISE_LIBRARY.map((item) => ({
      name: item.name,
      bodyPart: item.bodyPart,
      equipment: item.equipment,
      aliases: item.aliases
    }))
    return [...local, ...online]
  }
  return EXERCISE_LIBRARY.map((item) => ({
    name: item.name,
    bodyPart: item.bodyPart,
    equipment: item.equipment,
    aliases: item.aliases
  }))
})

const fullFilteredLibraryActions = computed(() => {
  const key = libraryKeyword.value.trim().toLowerCase()
  return libraryActions.value.filter((item) => {
    if (libraryBodyPart.value !== 'all' && item.bodyPart !== libraryBodyPart.value) return false
    if (!key) return true
    const haystack = [
      item.name,
      bodyPartName(item.bodyPart),
      equipmentName(item.equipment),
      ...(item.aliases || [])
    ].join(' ').toLowerCase()
    return haystack.includes(key)
  })
})

const filteredLibraryActions = computed(() => {
  return librarySource.value === 'online'
    ? fullFilteredLibraryActions.value.slice(0, visibleLibraryLimit.value)
    : fullFilteredLibraryActions.value.slice(0, 40)
})

function bodyPartName(value: ExerciseBodyPart) {
  return bodyPartLabels[value]
}

function equipmentName(value: ExerciseEquipment) {
  return EQUIPMENT_LABELS[value]
}

function formatOnlineName(name: string) {
  return translateExerciseName(name)
}

function mapOnlineBodyPart(parts: string[] = []): ExerciseBodyPart {
  const text = parts.join(' ').toLowerCase()
  if (text.includes('chest')) return 'chest'
  if (text.includes('back')) return 'back'
  if (text.includes('shoulder')) return 'shoulders'
  if (text.includes('arm') || text.includes('biceps') || text.includes('triceps')) return 'arms'
  if (text.includes('leg') || text.includes('upper legs') || text.includes('lower legs')) return 'legs'
  if (text.includes('waist') || text.includes('abs')) return 'core'
  if (text.includes('cardio')) return 'cardio'
  return 'full'
}

function mapOnlineEquipment(equipments: string[] = []): ExerciseEquipment {
  const text = equipments.join(' ').toLowerCase()
  if (text.includes('barbell')) return 'barbell'
  if (text.includes('dumbbell')) return 'dumbbell'
  if (text.includes('cable') || text.includes('leverage')) return 'cable'
  if (text.includes('machine') || text.includes('sled')) return 'machine'
  if (text.includes('body weight')) return 'bodyweight'
  if (text.includes('cardio')) return 'cardio'
  return 'other'
}

async function switchLibrarySource(source: LibrarySource) {
  librarySource.value = source
  visibleLibraryLimit.value = 40
  if (source === 'online' && !onlineLibraryActions.value.length) {
    await loadOnlineLibraryActions()
  }
}

async function loadOnlineLibraryActions(forceRefresh = false) {
  onlineLibraryLoading.value = true
  onlineLibraryError.value = ''
  try {
    onlineLibraryActions.value = await exerciseDbService.getExercises(forceRefresh)
  } catch (error: any) {
    onlineLibraryError.value = error?.message || 'ExerciseDB 当前无法加载，稍后再试。'
  } finally {
    onlineLibraryLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadTemplates()
})

onShow(() => {
  loadTemplates()
  consumePendingTemplateAction()
})

// 加载模板列表
const loadTemplates = async () => {
  loading.value = true
  
  try {
    const result = await templateServiceLocal.getTemplates()
    templates.value = result
  } catch (error) {
    console.error('加载模板失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 显示创建弹窗
const showCreateModal = () => {
  isEditing.value = false
  selectedTemplate.value = null
  formData.name = ''
  formData.actions = []
  newAction.value = ''
  rememberModalState()
  showModal.value = true
}

const editTemplate = (template: TrainingTemplate) => {
  isEditing.value = true
  selectedTemplate.value = template
  formData.name = template.name
  formData.actions = [...(template.actions || [])]
  newAction.value = ''
  showDetail.value = false
  rememberModalState()
  showModal.value = true
}

const addActionName = (action: string) => {
  const normalized = action.trim()
  if (normalized && !formData.actions.includes(normalized)) formData.actions.push(normalized)
}

const consumePendingTemplateAction = () => {
  const raw = uni.getStorageSync('selected_template_action')
  if (!raw) return
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    const name = String(data.name || '').trim()
    if (!name) return
    if (!showModal.value) showCreateModal()
    addActionName(name)
    if (!formData.name.trim()) formData.name = `${name} 模板`
    uni.showToast({ title: `已加入模板：${name}`, icon: 'success' })
  } catch (error) {
    console.error('解析动作库模板动作失败:', error)
  } finally {
    uni.removeStorageSync('selected_template_action')
  }
}

// 添加动作
const addAction = () => {
  const action = newAction.value.trim()
  if (action) {
    addActionName(action)
    newAction.value = ''
  }
}

// 移除动作
const removeAction = (index: number) => {
  formData.actions.splice(index, 1)
}

// 切换动作选择
const toggleAction = (action: string) => {
  const index = formData.actions.indexOf(action)
  if (index > -1) {
    formData.actions.splice(index, 1)
  } else {
    formData.actions.push(action)
  }
}

// 关闭弹窗
const closeModal = (force = false) => {
  const shouldForce = force === true
  if (!shouldForce && hasModalChanges() && !isSaving.value) {
    uni.showModal({
      title: '放弃模板修改？',
      content: '模板名称或动作还没有保存，关闭后会丢失。',
      confirmText: '放弃',
      cancelText: '继续编辑',
      success: (res) => {
        if (res.confirm) closeModal(true)
      }
    })
    return
  }
  showModal.value = false
}

// 确认保存
const confirmSave = async () => {
  if (isSaving.value) return
  if (!formData.name.trim()) {
    uni.showToast({ title: '请输入模板名称', icon: 'none' })
    return
  }
  
  const cleanActions = normalizeTemplateActions(formData.actions)
  if (cleanActions.length === 0) {
    uni.showToast({ title: '请至少添加一个动作', icon: 'none' })
    return
  }
  
  try {
    isSaving.value = true
    formData.actions = cleanActions
    if (isEditing.value && selectedTemplate.value) {
      await templateServiceLocal.updateTemplate(selectedTemplate.value._id!, {
        name: formData.name.trim(),
        actions: cleanActions
      })
      await trainingPlanServiceLocal.syncTemplateName(selectedTemplate.value._id!, formData.name.trim())
    } else {
      await templateServiceLocal.createTemplate({
        name: formData.name.trim(),
        actions: cleanActions
      })
    }
    
    uni.showToast({
      title: '保存成功',
      icon: 'success'
    })
    
    // 检查是否从创建计划页跳转而来
    const pages = getCurrentPages()
    const fromCreatePlan = pages.some(page => {
      const route = (page as any).route || ''
      return route.includes('create-plan')
    })
    
    if (fromCreatePlan) {
      // 从创建计划页来的，返回并提示刷新
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      closeModal(true)
      loadTemplates()
    }
  } catch (error) {
    console.error('保存模板失败:', error)
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    })
  } finally {
    isSaving.value = false
  }
}

// 查看详情
const viewTemplateDetail = async (template: TrainingTemplate) => {
  try {
    // 获取完整模板详情
    const templates = await templateServiceLocal.getTemplates()
    const fullTemplate = templates.find(t => t._id === template._id)
    if (fullTemplate) {
      selectedTemplate.value = fullTemplate as any
      showDetail.value = true
    }
  } catch (error) {
    console.error('获取模板详情失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}

// 关闭详情
const closeDetail = () => {
  showDetail.value = false
  selectedTemplate.value = null
}

// 使用模板
const useTemplate = (template: TrainingTemplate) => {
  uni.showModal({
    title: '使用模板',
    content: `确定要使用 "${template.name}" 开始训练吗？`,
    success: (res) => {
      if (res.confirm) {
        // 获取完整模板详情
        templateServiceLocal.getTemplates().then(allTemplates => {
          const fullTemplate = allTemplates.find(t => t._id === template._id)
          if (!fullTemplate) return
          
          // 将模板动作存储到临时缓存
          const templateData = {
            templateId: fullTemplate._id,
            templateName: fullTemplate.name,
            actions: fullTemplate.actions
          }
          uni.setStorageSync('using_template', JSON.stringify(templateData))
          
          // 跳转到训练记录页
          uni.navigateTo({
            url: '/pages/training-record/training-record'
          })
        })
      }
    }
  })
}

// 确认删除
const confirmDelete = async (template: TrainingTemplate) => {
  if (isDeleting.value) return
  uni.showModal({
    title: '确认删除',
    content: `确定要删除模板 "${template.name}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          isDeleting.value = true
          const affected = await trainingPlanServiceLocal.detachTemplate(template._id!)
          await templateServiceLocal.deleteTemplate(template._id!)
          uni.showToast({
            title: affected ? '已删除并更新计划' : '删除成功',
            icon: 'success'
          })
          closeDetail()
          loadTemplates()
        } catch (error) {
          console.error('删除模板失败:', error)
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          })
        } finally {
          isDeleting.value = false
        }
      }
    }
  })
}

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}
</script>

<style lang="scss" scoped>
.templates-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 模板列表区域 */
.templates-section {
  background-color: #fff;
  min-height: 100vh;
  padding-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.add-template-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  
  .add-icon {
    font-size: 16px;
    font-weight: 700;
  }
}

.loading-state,
.empty-state {
  padding: 60px 20px;
  text-align: center;
  
  .loading-text,
  .empty-title {
    display: block;
    font-size: 15px;
    color: #909399;
    margin-top: 12px;
  }
  
  .empty-emoji {
    font-size: 60px;
  }
  
  .empty-tip {
    display: block;
    font-size: 13px;
    color: #c0c4cc;
    margin-top: 8px;
  }
  
  .create-first-btn {
    margin-top: 20px;
    padding: 10px 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border: none;
    border-radius: 20px;
    font-size: 14px;
  }
}

.templates-list {
  padding: 16px;
}

.template-card {
  background-color: #f5f7fa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.template-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.action-count {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  
  .count-value {
    font-size: 18px;
    font-weight: 700;
    color: #667eea;
  }
  
  .count-label {
    font-size: 11px;
    color: #909399;
  }
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.action-tag,
.recommend-action {
  padding: 4px 10px;
  background-color: #fff;
  border-radius: 12px;
  font-size: 12px;
  color: #606266;
}

.recommend-action {
  cursor: pointer;
  
  &.selected {
    background-color: #667eea;
    color: #fff;
  }
}

.more-actions {
  padding: 4px 10px;
  background-color: #e5e9f2;
  border-radius: 12px;
  font-size: 12px;
  color: #606266;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.update-time {
  font-size: 12px;
  color: #909399;
}

.card-actions-group {
  display: flex;
  gap: 12px;
  
  .action-btn {
    font-size: 13px;
    color: #667eea;
    cursor: pointer;
    
    &.delete {
      color: #f56c6c;
    }
  }
}

/* 弹窗样式 */
.modal-overlay,
.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.modal-content,
.detail-content {
  width: 100%;
  max-height: 85vh;
  background-color: #fff;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
}

.modal-header,
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  
  .modal-title,
  .detail-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
  
  .modal-close,
  .detail-close {
    font-size: 20px;
    color: #909399;
    cursor: pointer;
  }
}

.modal-body,
.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.modal-item {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.modal-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  
  .required {
    color: #ff4d4f;
  }
}

.modal-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.action-input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-input-wrapper {
  display: flex;
  gap: 8px;
}

.action-input {
  flex: 1;
  height: 40px;
  padding: 0 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
}

.add-action-btn {
  padding: 0 16px;
  background-color: #667eea;
  color: #fff;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.selected-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background-color: #f0f2f5;
  border-radius: 16px;
  font-size: 13px;
  color: #606266;
  
  .remove-action {
    font-size: 14px;
    color: #909399;
    cursor: pointer;
  }
}

.recommend-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.recommend-action {
  min-width: 0;
  padding: 8px 10px;
  background-color: #f5f7fa;
  border-radius: 10px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  border: 1px solid transparent;
  
  &.selected {
    background-color: #ecfdf5;
    border-color: #22c55e;
    color: #166534;
  }
}

.recommend-name {
  display: block;
  overflow: hidden;
  color: #303133;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.recommend-meta {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  color: #909399;
  font-size: 11px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.library-picker {
  margin-bottom: 10px;
}

.library-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-bottom: 10px;
  padding: 4px;
  border-radius: 10px;
  background: #f0f2f5;
}

.library-tab {
  height: 34px;
  border-radius: 8px;
  color: #606266;
  font-size: 13px;
  font-weight: 700;
  line-height: 34px;
  text-align: center;
}

.library-tab.active {
  background: #fff;
  color: #303133;
  box-shadow: 0 4px 10px rgba(16, 24, 32, .08);
}

.library-search {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.library-filter-scroll {
  width: 100%;
  margin-top: 10px;
  white-space: nowrap;
}

.library-filters {
  display: flex;
  gap: 8px;
  padding-right: 12px;
}

.library-filter {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 999px;
  background: #f0f2f5;
  color: #606266;
  font-size: 12px;
}

.library-filter.active {
  background: #303133;
  color: #fff;
}

.library-status {
  margin: 8px 0 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f8fafc;
  color: #909399;
  font-size: 12px;
}

.library-more {
  margin-top: 10px;
  height: 38px;
  line-height: 38px;
  border-radius: 19px;
  background: #f0f2f5;
  color: #303133;
  font-size: 13px;
  font-weight: 700;
}

.modal-footer,
.detail-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
  
  button {
    flex: 1;
    height: 44px;
    border-radius: 22px;
    font-size: 15px;
    border: none;
  }
}

.modal-cancel {
  background-color: #f5f7fa;
  color: #606266;
}

.modal-confirm,
.detail-use-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.modal-confirm[disabled],
.detail-delete-btn[disabled] {
  opacity: .65;
}

.detail-edit-btn {
  background-color: #f5f7fa;
  color: #303133;
}

.detail-delete-btn {
  background-color: #fef0f0;
  color: #f56c6c;
}

/* 详情弹窗 */
.detail-section {
  margin-bottom: 24px;
  
  .section-subtitle {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }
}

.detail-action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 8px;
  
  .action-index {
    width: 24px;
    height: 24px;
    background-color: #667eea;
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }
  
  .action-text {
    font-size: 14px;
    color: #303133;
  }
}

.usage-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  .tip-item {
    font-size: 13px;
    color: #606266;
    line-height: 1.6;
  }
}
</style>

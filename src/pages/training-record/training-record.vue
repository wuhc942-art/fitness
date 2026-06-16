<template>
  <view class="record-page">
    <view v-if="planInfo" class="plan-banner">
      <text>{{ planInfo.name }} · 第 {{ weekNumber }} 周 · {{ planInfo.templateName }}</text>
    </view>
    <view v-if="planLinkWarning" class="plan-warning">
      <text>日期已不同于原计划日，保存后会从原计划解绑，不会修改计划日程。</text>
    </view>

    <view class="summary">
      <view>
        <text class="summary-title">训练记录</text>
        <text class="summary-subtitle">{{ formData.date }} · {{ bodyPartName || '未选择部位' }}</text>
      </view>
      <view class="volume-box">
        <text class="volume-value">{{ totalVolume }}</text>
        <text class="volume-label">kg 总量</text>
      </view>
    </view>

    <view class="panel">
      <text class="panel-title">基础信息</text>
      <view class="field">
        <text class="label">日期</text>
        <picker mode="date" :value="formData.date" @change="onDateChange">
          <view class="picker">{{ formData.date }}</view>
        </picker>
      </view>
      <view class="field">
        <text class="label">训练部位</text>
        <view class="chips">
          <view v-for="item in bodyParts" :key="item.value" class="chip" :class="{ active: formData.bodyPart === item.value }" @click="selectBodyPart(item.value)">
            <text>{{ item.label }}</text>
          </view>
        </view>
      </view>
      <view class="field-grid">
        <view class="field compact">
          <text class="label">时长 分钟</text>
          <input type="number" v-model="formData.duration" placeholder="45" @input="markDirty" />
        </view>
        <view class="field compact">
          <text class="label">地点</text>
          <picker mode="selector" :range="locations" range-key="label" :value="locationIndex" @change="onLocationChange">
            <view class="picker">{{ locationName }}</view>
          </picker>
        </view>
      </view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">动作明细</text>
        <button class="small-btn" @click="openActionModal">添加动作</button>
      </view>

      <view v-if="formData.actions.length === 0" class="empty">
        <text>还没有动作。建议每个动作记录到每一组，后面统计 PR 才准。</text>
      </view>

      <view v-for="(action, index) in formData.actions" :key="`${action.name}-${index}`" class="action-card">
        <view class="action-top">
          <view>
            <text class="action-name">{{ action.name }}</text>
            <text class="action-meta">{{ action.sets }} 组 · 最大 {{ action.weight }}kg · 估算 1RM {{ (action.estimated1RM || 0).toFixed(1) }}kg</text>
          </view>
          <view class="action-tools">
            <button @click="editAction(index)">编辑</button>
            <button @click="deleteAction(index)">删除</button>
          </view>
        </view>
        <view class="sets-line">
          <text v-for="set in action.setsDetail" :key="set.setNumber" class="set-pill">{{ set.weight }}×{{ set.reps }}</text>
        </view>
        <text v-if="action.notes" class="action-note">{{ action.notes }}</text>
      </view>
    </view>

    <view class="save-bar">
      <text class="save-hint" :class="{ dirty: hasUnsavedChanges || isSaving }">{{ saveHintText }}</text>
      <button class="save-btn" :class="{ saving: isSaving }" :disabled="isSaving" @click="saveRecord">
        {{ isSaving ? '保存中...' : (editingRecordId ? '保存修改' : '保存训练') }}
      </button>
    </view>

    <view v-if="modalVisible" class="modal-mask" @click="closeActionModal()">
      <view class="modal" @click.stop>
        <view class="modal-head">
          <text class="modal-title">{{ editingIndex >= 0 ? '编辑动作' : '添加动作' }}</text>
          <text class="modal-close" @click="closeActionModal()">×</text>
        </view>
        <view class="modal-body">
          <view class="field">
            <text class="label">动作名称</text>
            <input v-model="draft.name" placeholder="例如：杠铃卧推" />
          </view>

          <view v-if="selectedActionProfile" class="last-performance">
            <view class="last-head">
              <text class="last-title">上次表现</text>
              <text class="last-date">{{ lastPerformanceTitle(selectedActionProfile) }}</text>
            </view>
            <view class="last-sets">
              <text v-for="set in selectedActionProfile.action.setsDetail" :key="set.setNumber" class="last-set">
                {{ set.weight }}kg × {{ set.reps }}
              </text>
            </view>
          </view>

          <view class="action-library">
            <view class="library-head">
              <text class="section-label">我的动作库</text>
              <text class="library-count">{{ actionSuggestions.length }} 个</text>
            </view>
            <text class="library-tip">点选历史动作会自动带入上次的组数、重量和次数。</text>
            <view v-if="actionSuggestions.length" class="quick-actions">
              <view
                v-for="name in actionSuggestions"
                :key="name"
                class="quick-name"
                :class="{ active: draft.name === name }"
                @click="pickActionName(name)"
              >
                <text class="quick-name-title">{{ name }}</text>
                <text class="quick-name-meta">{{ profileSummary(name) }}</text>
              </view>
            </view>
            <text v-else class="library-empty">保存一次训练或创建模板后，这里会自动出现你的动作。</text>
          </view>

          <view class="action-library picker-library">
            <view class="library-head">
              <text class="section-label">从动作库选择</text>
              <text class="library-count">{{ filteredLibraryActions.length }} 个</text>
            </view>
            <view class="library-tabs">
              <text class="library-tab" :class="{ active: librarySource === 'local' }" @click="librarySource = 'local'">本地动作</text>
              <text class="library-tab" :class="{ active: librarySource === 'online' }" @click="switchLibrarySource('online')">ExerciseDB</text>
            </view>
            <input v-model="libraryKeyword" class="library-search" placeholder="搜索动作、部位或器械" />
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
            <view v-if="librarySource === 'online'" class="library-status">
              <text>{{ onlineLibraryStatus }}</text>
            </view>
            <view class="library-card-list">
              <view
                v-for="action in filteredLibraryActions"
                :key="`${librarySource}-${action.name}`"
                class="library-card"
                :class="{ selected: draft.name === action.name }"
                @click="pickLibraryAction(action)"
              >
                <text class="library-card-name">{{ action.name }}</text>
                <text class="library-card-meta">{{ libraryBodyPartName(action.bodyPart) }} · {{ libraryEquipmentName(action.equipment) }}</text>
              </view>
            </view>
            <button v-if="librarySource === 'online' && fullFilteredLibraryActions.length > filteredLibraryActions.length" class="library-more" @click="visibleLibraryLimit += 20">
              加载更多
            </button>
          </view>

          <view class="field">
            <text class="label">组数</text>
            <input type="number" v-model="draft.sets" placeholder="3" @input="syncDraftSets" />
          </view>
          <view class="sets-tools">
            <button class="mini-action" @click="applyFirstSetToAll">套用第一组</button>
          </view>
          <view class="sets-editor">
            <view v-for="(set, index) in draft.setsDetail" :key="set.setNumber" class="set-row">
              <text class="set-no">第 {{ set.setNumber }} 组</text>
              <input type="digit" v-model="set.weight" placeholder="kg" />
              <text class="times">×</text>
              <input type="number" v-model="set.reps" placeholder="次数" />
            </view>
          </view>
          <view class="field">
            <text class="label">备注</text>
            <textarea v-model="draft.notes" maxlength="100" placeholder="如：最后一组接近力竭" />
          </view>
        </view>
        <view class="modal-foot">
          <button class="cancel" @click="closeActionModal()">取消</button>
          <button class="confirm" @click="confirmAction">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { onBackPress, onLoad, onShow } from '@dcloudio/uni-app'
import type { ActionRecord, BodyPart, SetDetail, TrainingLocation, TrainingRecordForm } from '@/types/training'
import { BODY_PART_LABELS, LOCATION_LABELS } from '@/types/training'
import { calculateActionVolume, updateActionCalculations } from '@/utils/calculator'
import { getCurrentDate } from '@/utils/date'
import { normalizeUsingTemplatePayload } from '@/utils/training-transfer'
import { trainingPlanServiceLocal } from '@/services/training-plan.local'
import { trainingServiceLocal } from '@/services/training.local'
import { templateServiceLocal } from '@/services/template.local'
import { BODY_PART_OPTIONS, EQUIPMENT_LABELS, EXERCISE_LIBRARY, getExerciseByName, type ExerciseBodyPart, type ExerciseEquipment } from '@/services/exercise-library.local'
import { exerciseDbService, type ExerciseDbItem } from '@/services/exercisedb.local'
import { translateExerciseName } from '@/utils/exercise-name-translate'
import { hasLocalExerciseGif } from '@/services/exercise-media.local'

type DraftSet = { setNumber: number; weight: number | string; reps: number | string }
type DraftAction = { name: string; sets: number | string; notes: string; setsDetail: DraftSet[] }
type LibrarySource = 'local' | 'online'
type LibraryActionOption = { name: string; bodyPart: ExerciseBodyPart; equipment: ExerciseEquipment; aliases?: string[] }
type LastActionProfile = { date: string; action: ActionRecord }

const defaultActionNames = EXERCISE_LIBRARY.map((item) => item.name)
const actionSuggestions = ref<string[]>(defaultActionNames)
const actionProfiles = ref<Record<string, LastActionProfile>>({})
const bodyParts: { value: BodyPart; label: string }[] = [
  { value: 'chest', label: '胸' },
  { value: 'back', label: '背' },
  { value: 'shoulders', label: '肩' },
  { value: 'arms', label: '手臂' },
  { value: 'legs', label: '腿' },
  { value: 'core', label: '核心' },
  { value: 'full', label: '全身' }
]
const locations: { value: TrainingLocation; label: string }[] = [
  { value: 'gym', label: '健身房' },
  { value: 'home', label: '家里' },
  { value: 'outdoor', label: '户外' },
  { value: 'office', label: '办公室' },
  { value: 'other', label: '其他' }
]

const planId = ref('')
const weekNumber = ref(1)
const trainingTemplateId = ref('')
const editingRecordId = ref('')
const linkedPlanDate = ref('')
const planInfo = ref<{ name: string; templateName: string } | null>(null)
const modalVisible = ref(false)
const editingIndex = ref(-1)
const librarySource = ref<LibrarySource>('local')
const libraryKeyword = ref('')
const libraryBodyPart = ref<ExerciseBodyPart | 'all'>('all')
const onlineLibraryActions = ref<ExerciseDbItem[]>([])
const onlineLibraryLoading = ref(false)
const onlineLibraryError = ref('')
const visibleLibraryLimit = ref(30)
const isSaving = ref(false)
const hasUnsavedChanges = ref(false)
const formReady = ref(false)
const draftSnapshot = ref('')
const allowBack = ref(false)

const formData = reactive<TrainingRecordForm>({
  date: getCurrentDate(),
  bodyPart: '' as BodyPart,
  duration: 45,
  location: 'gym',
  feeling: '',
  actions: []
})
const draft = reactive<DraftAction>(blankDraft())

const bodyPartName = computed(() => (formData.bodyPart ? BODY_PART_LABELS[formData.bodyPart] : ''))
const locationIndex = computed(() => Math.max(0, locations.findIndex((item) => item.value === formData.location)))
const locationName = computed(() => LOCATION_LABELS[formData.location])
const totalVolume = computed(() => formData.actions.reduce((sum, action) => sum + (action.volume || calculateActionVolume(action)), 0))
const planLinkWarning = computed(() => !!editingRecordId.value && !!linkedPlanDate.value && formData.date !== linkedPlanDate.value)
const libraryBodyParts = BODY_PART_OPTIONS.filter((item) => item.value !== 'cardio')
const libraryBodyPartLabels: Record<ExerciseBodyPart, string> = {
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
  if (!onlineLibraryActions.value.length) return '切换到 ExerciseDB 后加载在线动作。手机端需要配置合法域名。'
  return `已加载 ${onlineLibraryActions.value.length} 个在线动作`
})
const libraryActions = computed<LibraryActionOption[]>(() => {
  if (librarySource.value === 'online') {
    const online = [...onlineLibraryActions.value].sort((a, b) => Number(hasLocalExerciseGif(b.exerciseId)) - Number(hasLocalExerciseGif(a.exerciseId))).map((item) => ({
      name: translateExerciseName(item.name),
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
    return [item.name, libraryBodyPartName(item.bodyPart), libraryEquipmentName(item.equipment), ...(item.aliases || [])].join(' ').toLowerCase().includes(key)
  })
})
const filteredLibraryActions = computed(() => {
  return librarySource.value === 'online'
    ? fullFilteredLibraryActions.value.slice(0, visibleLibraryLimit.value)
    : fullFilteredLibraryActions.value.slice(0, 40)
})
const selectedActionProfile = computed(() => actionProfiles.value[draft.name])
const saveHintText = computed(() => {
  if (isSaving.value) return '正在保存训练记录...'
  if (hasUnsavedChanges.value) return editingRecordId.value ? '有未保存修改' : '有未保存内容'
  return editingRecordId.value ? '记录已加载，可继续修改' : '填写后保存训练记录'
})

function blankDraft(): DraftAction {
  return {
    name: '',
    sets: 3,
    notes: '',
    setsDetail: [
      { setNumber: 1, weight: '', reps: '' },
      { setNumber: 2, weight: '', reps: '' },
      { setNumber: 3, weight: '', reps: '' }
    ]
  }
}

function normalizeActionName(input: unknown): string {
  if (typeof input === 'string') return input.trim()
  if (input && typeof input === 'object' && 'name' in input) return String((input as any).name || '').trim()
  return ''
}

function collectActionName(name: string, map: Map<string, number>, score: number) {
  const normalized = name.trim()
  if (!normalized) return
  map.set(normalized, Math.max(map.get(normalized) || 0, score))
}

async function loadActionLibrary() {
  const actionMap = new Map<string, number>()
  const profileMap: Record<string, LastActionProfile> = {}
  defaultActionNames.forEach((name, index) => collectActionName(name, actionMap, 1000 - index))

  try {
    const templates = await templateServiceLocal.getTemplates()
    templates.forEach((template, templateIndex) => {
      ;(template.actions || []).forEach((action: any, actionIndex: number) => {
        collectActionName(normalizeActionName(action), actionMap, 3000 - templateIndex * 20 - actionIndex)
      })
    })
  } catch (error) {
    console.error('加载模板动作失败:', error)
  }

  try {
    const records = (await trainingServiceLocal.getAllRecords()).sort((a, b) => b.date.localeCompare(a.date))
    records.forEach((record, recordIndex) => {
      ;(record.actions || []).forEach((action, actionIndex) => {
        collectActionName(action.name, actionMap, 5000 - recordIndex * 20 - actionIndex)
        if (!profileMap[action.name]) {
          profileMap[action.name] = { date: record.date, action }
        }
      })
    })
  } catch (error) {
    console.error('加载历史动作失败:', error)
  }

  actionSuggestions.value = Array.from(actionMap.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name)
    .slice(0, 40)
  actionProfiles.value = profileMap
}

function resetDraft(next = blankDraft()) {
  Object.assign(draft, next)
}

function draftFingerprint() {
  return JSON.stringify({
    name: draft.name,
    sets: draft.sets,
    notes: draft.notes,
    setsDetail: draft.setsDetail
  })
}

function rememberDraft() {
  draftSnapshot.value = draftFingerprint()
}

function isDraftChanged() {
  return draftFingerprint() !== draftSnapshot.value
}

function markDirty() {
  if (formReady.value && !isSaving.value) hasUnsavedChanges.value = true
}

function markReadyClean() {
  formReady.value = true
  hasUnsavedChanges.value = false
}

function profileSummary(name: string) {
  const profile = actionProfiles.value[name]
  if (!profile) return '暂无历史'
  const action = profile.action
  return `${profile.date} · ${action.weight || 0}kg × ${action.reps || 0} · ${action.sets || 0}组`
}

function lastPerformanceTitle(profile?: LastActionProfile) {
  if (!profile) return ''
  const action = profile.action
  return `${profile.date} · 最佳 ${action.weight || 0}kg × ${action.reps || 0} · ${action.sets || 0}组`
}

function buildAction(raw: DraftAction): ActionRecord {
  const setsDetail: SetDetail[] = raw.setsDetail.map((set, index) => ({
    setNumber: index + 1,
    weight: Number(set.weight) || 0,
    reps: Number(set.reps) || 0
  }))
  return updateActionCalculations({
    name: raw.name.trim(),
    weight: 0,
    reps: 0,
    sets: setsDetail.length,
    setsDetail,
    notes: raw.notes.trim()
  })
}

function actionFromName(name: string): ActionRecord {
  const profile = actionProfiles.value[name]
  if (profile) return buildAction(draftFromAction(profile.action))
  return buildAction({ ...blankDraft(), name })
}

function addExerciseFromLibrary(name: string, bodyPart?: BodyPart) {
  const normalized = normalizeActionName(name)
  if (!normalized) return
  const existing = formData.actions.find((item) => item.name === normalized)
  if (existing) {
    uni.showToast({ title: '这个动作已在本次训练中', icon: 'none' })
    return
  }
  formData.actions.push(actionFromName(normalized))
  const profile = getExerciseByName(normalized)
  const nextBodyPart = bodyPart || (profile?.bodyPart === 'cardio' ? 'full' : profile?.bodyPart)
  if (!formData.bodyPart && nextBodyPart) formData.bodyPart = nextBodyPart as BodyPart
  markDirty()
  uni.showToast({ title: actionProfiles.value[normalized] ? '已沿用上次重量' : `已加入：${normalized}`, icon: 'success' })
}

function consumeSelectedExercise() {
  const raw = uni.getStorageSync('selected_exercise')
  if (!raw) return false
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    addExerciseFromLibrary(data.name, data.bodyPart)
    uni.removeStorageSync('selected_exercise')
    return true
  } catch (error) {
    console.error('解析动作库选择失败:', error)
    uni.removeStorageSync('selected_exercise')
    return false
  }
}

function consumeRepeatWorkout() {
  const raw = uni.getStorageSync('repeat_workout_record')
  if (!raw) return false
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    formData.date = getCurrentDate()
    formData.bodyPart = data.bodyPart || formData.bodyPart
    formData.duration = Number(data.duration) || formData.duration
    formData.location = data.location || formData.location
    formData.feeling = ''
    formData.actions = Array.isArray(data.actions)
      ? data.actions.map((action: ActionRecord) => ({
          ...action,
          setsDetail: (action.setsDetail || []).map((set) => ({ ...set }))
        }))
      : []
    markDirty()
    uni.showToast({ title: '已带入上次训练', icon: 'success' })
    return true
  } catch (error) {
    console.error('解析复用训练失败:', error)
    return false
  } finally {
    uni.removeStorageSync('repeat_workout_record')
  }
}

async function loadPlanData(options: any) {
  await loadActionLibrary()
  editingRecordId.value = options.recordId || ''
  if (editingRecordId.value) {
    await loadExistingRecord(editingRecordId.value)
    markReadyClean()
    return
  }

  planId.value = options.planId || ''
  weekNumber.value = Number(options.week || 1)
  trainingTemplateId.value = options.templateId || ''
  formData.date = options.date || getCurrentDate()
  if (!planId.value || !trainingTemplateId.value) {
    markReadyClean()
    return
  }

  try {
    const plan = await trainingPlanServiceLocal.getPlanById(planId.value)
    const template = await templateServiceLocal.getTemplateById(trainingTemplateId.value)
    if (!plan || !template) return
    planInfo.value = { name: plan.name, templateName: template.name }
    formData.actions = template.actions.map((item: any) => actionFromName(normalizeActionName(item)))
    uni.showToast({ title: '已加载计划并沿用历史重量', icon: 'success' })
  } catch (error) {
    console.error('加载计划失败:', error)
  } finally {
    markReadyClean()
  }
}

async function loadExistingRecord(recordId: string) {
  try {
    const record = await trainingServiceLocal.getRecordById(recordId)
    if (!record) {
      uni.showToast({ title: '记录不存在', icon: 'none' })
      return
    }
    formData.date = record.date
    formData.bodyPart = record.bodyPart
    formData.duration = record.duration
    formData.location = record.location
    formData.feeling = record.feeling || ''
    formData.actions = record.actions
    const linkedSession = await trainingPlanServiceLocal.findSessionByRecordId(recordId)
    if (linkedSession?.planId) {
      planId.value = linkedSession.planId
      weekNumber.value = linkedSession.weekNumber
      trainingTemplateId.value = linkedSession.templateId
      linkedPlanDate.value = linkedSession.date
      planInfo.value = { name: linkedSession.planName, templateName: linkedSession.templateName }
    }
    uni.setNavigationBarTitle({ title: '编辑训练' })
  } catch (error) {
    console.error('加载训练记录失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

onLoad(loadPlanData)

onBackPress(() => {
  if (allowBack.value) return false
  if (isSaving.value) {
    uni.showToast({ title: '正在保存，请稍等', icon: 'none' })
    return true
  }
  if (!hasUnsavedChanges.value) return false
  uni.showModal({
    title: '离开当前记录？',
    content: '本次训练还有未保存修改，离开后会丢失。',
    confirmText: '离开',
    cancelText: '继续填写',
    success: (res) => {
      if (!res.confirm) return
      allowBack.value = true
      uni.navigateBack()
    }
  })
  return true
})

onShow(async () => {
  await loadActionLibrary()
  if (consumeSelectedExercise()) return
  if (planId.value && trainingTemplateId.value && formData.actions.length) return
  if (consumeRepeatWorkout()) return
  const raw = uni.getStorageSync('using_template')
  if (!raw) return
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const data = normalizeUsingTemplatePayload(parsed)
    if (!data.actions.length) {
      uni.showToast({ title: '模板数据已失效', icon: 'none' })
      uni.removeStorageSync('using_template')
      return
    }
    formData.actions = data.actions.map((name) => actionFromName(name))
    markDirty()
    uni.removeStorageSync('using_template')
    uni.showToast({ title: '已加载模板并沿用历史重量', icon: 'success' })
  } catch (error) {
    uni.removeStorageSync('using_template')
    uni.showToast({ title: '模板数据已失效', icon: 'none' })
    console.error('解析模板失败:', error)
  }
})

function onDateChange(event: any) {
  formData.date = event.detail.value
  markDirty()
}

function selectBodyPart(value: BodyPart) {
  formData.bodyPart = value
  markDirty()
}

function libraryBodyPartName(value: ExerciseBodyPart) {
  return libraryBodyPartLabels[value]
}

function libraryEquipmentName(value: ExerciseEquipment) {
  return EQUIPMENT_LABELS[value]
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
  visibleLibraryLimit.value = 30
  if (source === 'online' && !onlineLibraryActions.value.length) await loadOnlineLibraryActions()
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

function pickLibraryAction(action: LibraryActionOption) {
  pickActionName(action.name)
  const nextBodyPart = action.bodyPart === 'cardio' ? 'full' : action.bodyPart
  if (!formData.bodyPart && nextBodyPart) formData.bodyPart = nextBodyPart as BodyPart
  markDirty()
}

function onLocationChange(event: any) {
  formData.location = locations[Number(event.detail.value)].value
  markDirty()
}

function openActionModal() {
  editingIndex.value = -1
  resetDraft()
  rememberDraft()
  loadActionLibrary()
  modalVisible.value = true
}

function editAction(index: number) {
  const action = formData.actions[index]
  editingIndex.value = index
  resetDraft({
    name: action.name,
    sets: action.sets,
    notes: action.notes || '',
    setsDetail: (action.setsDetail || []).map((set) => ({ ...set }))
  })
  rememberDraft()
  loadActionLibrary()
  modalVisible.value = true
}

function draftFromAction(action: ActionRecord): DraftAction {
  const setsDetail = action.setsDetail?.length
    ? action.setsDetail.map((set, index) => ({
        setNumber: index + 1,
        weight: set.weight,
        reps: set.reps
      }))
    : Array.from({ length: Number(action.sets) || 3 }).map((_, index) => ({
        setNumber: index + 1,
        weight: action.weight || '',
        reps: action.reps || ''
      }))

  return {
    name: action.name,
    sets: setsDetail.length || 3,
    notes: '',
    setsDetail: setsDetail.length ? setsDetail : blankDraft().setsDetail
  }
}

function pickActionName(name: string) {
  draft.name = name
  const profile = actionProfiles.value[name]
  if (!profile) return
  const nextDraft = draftFromAction(profile.action)
  resetDraft(nextDraft)
  uni.showToast({ title: '已带入上次重量', icon: 'none' })
}

function deleteAction(index: number) {
  uni.showModal({
    title: '删除动作',
    content: '确定删除这个动作吗？',
    success: (res) => {
      if (res.confirm) {
        formData.actions.splice(index, 1)
        markDirty()
      }
    }
  })
}

function closeActionModal(force = false) {
  const shouldForce = force === true
  if (!shouldForce && isDraftChanged()) {
    uni.showModal({
      title: '放弃本次填写？',
      content: '动作、重量或次数还没有加入本次训练，确定关闭吗？',
      success: (res) => {
        if (res.confirm) closeActionModal(true)
      }
    })
    return
  }
  modalVisible.value = false
  editingIndex.value = -1
}

function syncDraftSets() {
  const count = Math.max(1, Number(draft.sets) || 1)
  const current = draft.setsDetail
  while (current.length < count) {
    const previous = current[current.length - 1] || { weight: '', reps: '' }
    current.push({ setNumber: current.length + 1, weight: previous.weight, reps: previous.reps })
  }
  if (current.length > count) current.splice(count)
  current.forEach((set, index) => { set.setNumber = index + 1 })
}

function applyFirstSetToAll() {
  syncDraftSets()
  const first = draft.setsDetail[0]
  if (!first || (!first.weight && !first.reps)) {
    uni.showToast({ title: '先填写第一组', icon: 'none' })
    return
  }
  draft.setsDetail.forEach((set, index) => {
    if (index === 0) return
    set.weight = first.weight
    set.reps = first.reps
  })
  uni.showToast({ title: '已套用到全部组', icon: 'none' })
}

function confirmAction() {
  if (!draft.name.trim()) {
    uni.showToast({ title: '请输入动作名称', icon: 'none' })
    return
  }
  syncDraftSets()
  const action = buildAction(draft)
  if (!action.setsDetail?.some((set) => set.weight > 0 && set.reps > 0)) {
    uni.showToast({ title: '至少填写一组重量和次数', icon: 'none' })
    return
  }
  if (editingIndex.value >= 0) formData.actions[editingIndex.value] = action
  else formData.actions.push(action)
  markDirty()
  loadActionLibrary()
  closeActionModal(true)
}

async function saveRecord() {
  if (isSaving.value) return
  if (!formData.bodyPart) {
    uni.showToast({ title: '请选择训练部位', icon: 'none' })
    return
  }
  if (!formData.actions.length) {
    uni.showToast({ title: '请至少添加一个动作', icon: 'none' })
    return
  }

  try {
    isSaving.value = true
    const payload = { ...formData, duration: Number(formData.duration) || 0 }
    if (editingRecordId.value) {
      await trainingPlanServiceLocal.unmarkSessionByRecordId(editingRecordId.value)
    }
    const saved = editingRecordId.value
      ? await trainingServiceLocal.updateRecord(editingRecordId.value, payload)
      : await trainingServiceLocal.saveRecord(payload)
    if (planId.value && (!editingRecordId.value || formData.date === linkedPlanDate.value)) {
      await trainingPlanServiceLocal.markSessionCompleted(planId.value, weekNumber.value, formData.date, saved._id || '')
    }
    hasUnsavedChanges.value = false
    await loadActionLibrary()
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 900)
  } catch (error: any) {
    console.error('保存失败:', error)
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
    isSaving.value = false
  }
}
</script>

<style lang="scss" scoped>
.record-page { min-height: 100vh; padding: 24rpx 24rpx 140rpx; background: #f4f6f8; box-sizing: border-box; }
.plan-banner { margin-bottom: 18rpx; padding: 20rpx 24rpx; border-radius: 12rpx; background: #dcfce7; color: #166534; font-size: 24rpx; font-weight: 700; }
.plan-warning { margin: -8rpx 0 18rpx; padding: 18rpx 22rpx; border-radius: 12rpx; background: #fff7ed; color: #9a3412; font-size: 23rpx; line-height: 1.45; }
.summary { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; padding: 34rpx; border-radius: 16rpx; background: #101820; color: #fff; }
.summary-title, .panel-title, .action-name, .modal-title { display: block; color: #101820; font-size: 32rpx; font-weight: 800; }
.summary-title { color: #fff; font-size: 42rpx; }
.summary-subtitle { display: block; margin-top: 8rpx; color: rgba(255,255,255,.72); font-size: 24rpx; }
.volume-box { min-width: 150rpx; text-align: right; }
.volume-value { display: block; color: #22c55e; font-size: 44rpx; font-weight: 900; }
.volume-label { display: block; color: rgba(255,255,255,.72); font-size: 22rpx; }
.panel { margin-bottom: 20rpx; padding: 28rpx; border-radius: 12rpx; background: #fff; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22rpx; }
.field { margin-top: 24rpx; }
.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18rpx; }
.label { display: block; margin-bottom: 12rpx; color: #4a5568; font-size: 24rpx; font-weight: 700; }
input, textarea, .picker { width: 100%; min-height: 76rpx; padding: 0 20rpx; border-radius: 10rpx; background: #f8fafc; color: #101820; font-size: 28rpx; box-sizing: border-box; }
textarea { height: 140rpx; padding-top: 18rpx; line-height: 1.5; }
.picker { line-height: 76rpx; }
.chips, .quick-actions { display: flex; flex-wrap: wrap; gap: 12rpx; }
.chip { padding: 14rpx 22rpx; border-radius: 999rpx; background: #edf2f7; color: #2d3748; font-size: 24rpx; }
.chip.active { background: #101820; color: #fff; }
.quick-name { width: calc(50% - 6rpx); min-width: 0; padding: 16rpx; border-radius: 12rpx; background: #edf2f7; color: #2d3748; box-sizing: border-box; }
.quick-name.active { background: #101820; color: #fff; }
.quick-name-title { display: block; overflow: hidden; font-size: 24rpx; font-weight: 800; white-space: nowrap; text-overflow: ellipsis; }
.quick-name-meta { display: block; margin-top: 6rpx; overflow: hidden; color: #718096; font-size: 20rpx; white-space: nowrap; text-overflow: ellipsis; }
.quick-name.active .quick-name-meta { color: rgba(255,255,255,.72); }
.small-btn { margin: 0; padding: 0 24rpx; height: 64rpx; line-height: 64rpx; border-radius: 32rpx; background: #22c55e; color: #101820; font-size: 24rpx; font-weight: 800; }
.empty { padding: 42rpx 20rpx; border-radius: 12rpx; background: #f8fafc; color: #718096; font-size: 26rpx; text-align: center; }
.action-card { margin-top: 16rpx; padding: 22rpx; border-radius: 12rpx; background: #f8fafc; }
.action-top { display: flex; justify-content: space-between; gap: 16rpx; }
.action-name { font-size: 30rpx; }
.action-meta, .action-note { display: block; margin-top: 8rpx; color: #718096; font-size: 23rpx; }
.action-tools { display: flex; gap: 10rpx; flex-shrink: 0; }
.action-tools button { margin: 0; padding: 0 14rpx; height: 52rpx; line-height: 52rpx; border-radius: 26rpx; background: #fff; color: #4a5568; font-size: 22rpx; }
.sets-line { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 16rpx; }
.set-pill { padding: 6rpx 12rpx; border-radius: 8rpx; background: #fff; color: #101820; font-size: 22rpx; font-weight: 700; }
.save-bar { position: fixed; left: 0; right: 0; bottom: 0; padding: 18rpx 24rpx 28rpx; background: rgba(255,255,255,.96); box-shadow: 0 -8rpx 24rpx rgba(16,24,32,.08); }
.save-hint { display: block; margin-bottom: 10rpx; color: #718096; font-size: 22rpx; text-align: center; }
.save-hint.dirty { color: #b45309; font-weight: 800; }
.save-btn { height: 88rpx; line-height: 88rpx; border-radius: 44rpx; background: #101820; color: #fff; font-size: 30rpx; font-weight: 800; }
.save-btn.saving, .save-btn[disabled] { background: #4a5568; color: rgba(255,255,255,.72); }
.modal-mask { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 20; display: flex; align-items: flex-end; background: rgba(16,24,32,.52); }
.modal { width: 100%; max-height: 86vh; border-radius: 24rpx 24rpx 0 0; background: #fff; overflow-y: auto; }
.modal-head, .modal-foot { display: flex; align-items: center; justify-content: space-between; padding: 28rpx; border-bottom: 1rpx solid #edf2f7; }
.modal-close { color: #718096; font-size: 44rpx; }
.modal-body { padding: 4rpx 28rpx 28rpx; }
.last-performance { margin-top: 20rpx; padding: 20rpx; border-radius: 12rpx; background: #ecfdf5; border: 2rpx solid rgba(34,197,94,.22); }
.last-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; }
.last-title { flex-shrink: 0; color: #166534; font-size: 24rpx; font-weight: 900; }
.last-date { color: #2d3748; font-size: 22rpx; line-height: 1.4; text-align: right; }
.last-sets { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 14rpx; }
.last-set { padding: 8rpx 12rpx; border-radius: 8rpx; background: #fff; color: #101820; font-size: 22rpx; font-weight: 800; }
.action-library { margin-top: 24rpx; padding: 20rpx; border-radius: 12rpx; background: #f8fafc; }
.library-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8rpx; }
.section-label { color: #2d3748; font-size: 24rpx; font-weight: 800; }
.library-count, .library-empty, .library-tip { color: #718096; font-size: 22rpx; }
.library-tip { display: block; margin-bottom: 16rpx; line-height: 1.45; }
.library-empty { display: block; line-height: 1.5; }
.picker-library { background: #fff; border: 1rpx solid #edf2f7; }
.library-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8rpx; margin: 14rpx 0; padding: 8rpx; border-radius: 12rpx; background: #edf2f7; }
.library-tab { height: 60rpx; border-radius: 10rpx; color: #4a5568; font-size: 24rpx; font-weight: 800; line-height: 60rpx; text-align: center; }
.library-tab.active { background: #fff; color: #101820; box-shadow: 0 6rpx 14rpx rgba(16,24,32,.08); }
.library-search { margin-bottom: 14rpx; background: #f8fafc; }
.library-filter-scroll { width: 100%; margin-bottom: 12rpx; white-space: nowrap; }
.library-filters { display: flex; gap: 10rpx; padding-right: 20rpx; }
.library-filter { flex-shrink: 0; padding: 10rpx 18rpx; border-radius: 999rpx; background: #edf2f7; color: #4a5568; font-size: 22rpx; }
.library-filter.active { background: #101820; color: #fff; }
.library-status { margin-bottom: 12rpx; padding: 14rpx 16rpx; border-radius: 10rpx; background: #f8fafc; color: #718096; font-size: 22rpx; line-height: 1.45; }
.library-card-list { display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx; }
.library-card { min-width: 0; padding: 16rpx; border-radius: 12rpx; background: #f8fafc; border: 2rpx solid transparent; }
.library-card.selected { border-color: #22c55e; background: #ecfdf5; }
.library-card-name { display: block; overflow: hidden; color: #101820; font-size: 24rpx; font-weight: 800; white-space: nowrap; text-overflow: ellipsis; }
.library-card-meta { display: block; margin-top: 6rpx; overflow: hidden; color: #718096; font-size: 20rpx; white-space: nowrap; text-overflow: ellipsis; }
.library-more { margin-top: 14rpx; height: 68rpx; line-height: 68rpx; border-radius: 34rpx; background: #edf2f7; color: #101820; font-size: 24rpx; font-weight: 800; }
.sets-tools { display: flex; justify-content: flex-end; margin-top: 14rpx; }
.mini-action { margin: 0; width: 180rpx; height: 58rpx; line-height: 58rpx; border-radius: 29rpx; background: #edf2f7; color: #101820; font-size: 22rpx; font-weight: 800; }
.sets-editor { margin-top: 20rpx; }
.set-row { display: grid; grid-template-columns: 120rpx 1fr 28rpx 1fr; align-items: center; gap: 12rpx; margin-bottom: 14rpx; }
.set-no, .times { color: #4a5568; font-size: 24rpx; font-weight: 700; }
.times { text-align: center; }
.modal-foot { gap: 18rpx; border-top: 1rpx solid #edf2f7; border-bottom: 0; }
.modal-foot button { flex: 1; height: 78rpx; line-height: 78rpx; border-radius: 39rpx; font-size: 28rpx; font-weight: 800; }
.cancel { background: #edf2f7; color: #2d3748; }
.confirm { background: #22c55e; color: #101820; }

/* Fresh premium visual layer */
.record-page {
  background:
    radial-gradient(circle at 86% 0%, rgba(79, 140, 255, .14), transparent 30%),
    linear-gradient(180deg, #f9fcff 0%, #f4f8fb 48%, #f7fafc 100%);
}

.plan-banner {
  border: 1rpx solid #d4f4eb;
  border-radius: 20rpx;
  background: #e9fbf6;
  color: #16856c;
}

.plan-warning {
  border: 1rpx solid #f7dfad;
  border-radius: 20rpx;
  background: #fff6e6;
  color: #805421;
}

.summary {
  border: 1rpx solid rgba(255, 255, 255, .95);
  border-radius: 34rpx;
  background:
    radial-gradient(circle at 90% 12%, rgba(79, 140, 255, .18), transparent 32%),
    linear-gradient(145deg, #ffffff 0%, #edf7ff 100%);
  color: #18212f;
  box-shadow: 0 16rpx 42rpx rgba(71, 98, 128, .12);
}

.summary-title {
  color: #18212f;
  font-size: 44rpx;
}

.summary-subtitle,
.volume-label {
  color: #344154;
}

.volume-value {
  color: #4f8cff;
}

.panel,
.action-card,
.quick-name,
.action-library,
.picker-library,
.library-card,
.last-set {
  border: 1rpx solid rgba(223, 232, 239, .9);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, .9);
  box-shadow: 0 8rpx 24rpx rgba(71, 98, 128, .07);
}

.panel-title,
.action-name,
.modal-title,
.library-card-name,
.section-label {
  color: #18212f;
  font-weight: 900;
}

.label,
.action-meta,
.action-note,
.library-count,
.library-empty,
.library-tip,
.library-card-meta,
.save-hint,
.set-no,
.times {
  color: #768398;
}

input,
textarea,
.picker,
.empty,
.library-status {
  border: 1rpx solid #dfe8ef;
  border-radius: 18rpx;
  background: #f7fafc;
  color: #344154;
}

.chip,
.mini-action,
.library-filter,
.action-tools button,
.cancel {
  background: #eef4f8;
  color: #344154;
}

.chip.active,
.quick-name.active,
.library-filter.active {
  background: #e8f1ff;
  color: #4f8cff;
}

.small-btn,
.confirm,
.save-btn {
  background: linear-gradient(135deg, #4f8cff 0%, #5fb7ff 100%);
  color: #fff;
  box-shadow: 0 12rpx 28rpx rgba(79, 140, 255, .22);
}

.save-btn.saving,
.save-btn[disabled] {
  background: #b8c7d8;
  color: #fff;
  box-shadow: none;
}

.set-pill,
.last-performance {
  background: #e9fbf6;
  color: #16856c;
  border-color: #d4f4eb;
}

.last-title {
  color: #16856c;
}

.save-bar {
  background: rgba(255, 255, 255, .94);
  box-shadow: 0 -12rpx 34rpx rgba(71, 98, 128, .12);
}

.modal-mask {
  background: rgba(24, 33, 47, .38);
}

.modal {
  border-radius: 34rpx 34rpx 0 0;
  background: #f7fafc;
}

.modal-head,
.modal-foot {
  border-color: #dfe8ef;
  background: #fff;
}

.library-tabs {
  background: #e7eef4;
}

.library-tab.active {
  color: #4f8cff;
}

.library-card.selected {
  border-color: #4f8cff;
  background: #e8f1ff;
}
</style>

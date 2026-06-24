<template>
  <view class="create-page">
    <view class="panel">
      <text class="panel-title">计划基础</text>
      <view class="field">
        <text class="label">计划名称</text>
        <input v-model="formData.name" placeholder="例如：上肢下肢循环、备赛 8 周" maxlength="30" />
      </view>
      <view class="field-grid">
        <view class="field">
          <text class="label">开始日期</text>
          <picker mode="date" :value="formData.startDate" @change="onStartDateChange">
            <view class="picker">{{ formData.startDate }}</view>
          </picker>
        </view>
        <view class="field">
          <text class="label">周期</text>
          <picker :range="durationOptions" :value="durationIndex" @change="onDurationChange">
            <view class="picker">{{ durationOptions[durationIndex] }}</view>
          </picker>
        </view>
      </view>
      <view class="field">
        <text class="label">描述</text>
        <textarea v-model="formData.description" placeholder="简单写一下目标，可选" maxlength="120" />
      </view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">每周训练日</text>
        <text class="panel-note">{{ selectedWeekdays.length }} 天/周</text>
      </view>
      <view class="weekday-grid">
        <view v-for="day in weekdayOptions" :key="day.value" class="weekday-chip" :class="{ active: selectedWeekdays.includes(day.value) }" @click="toggleWeekday(day.value)">
          <text>{{ day.label }}</text>
        </view>
      </view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">训练模板</text>
        <text class="panel-note">按训练日顺序轮换</text>
      </view>
      <view v-if="templates.length === 0" class="empty">
        <text>暂无模板，先创建一个模板再来排计划。</text>
        <button @click="goCreateTemplate">去创建模板</button>
      </view>
      <view v-else class="template-list">
        <view v-for="template in templates" :key="template._id" class="template-card" :class="{ selected: selectedTemplates.includes(template._id || '') }" @click="toggleTemplate(template._id || '')">
          <view class="template-info">
            <text class="template-name">{{ template.name }}</text>
            <text class="template-count">{{ template.actions.length }} 个动作</text>
            <view class="template-actions">
              <text v-for="action in template.actions.slice(0, 4)" :key="action" class="template-action">{{ action }}</text>
              <text v-if="template.actions.length > 4" class="template-action more">+{{ template.actions.length - 4 }}</text>
            </view>
          </view>
          <text class="selected-mark">{{ selectedTemplates.includes(template._id || '') ? '已选' : '选择' }}</text>
        </view>
      </view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">首周预览</text>
        <text class="panel-note">{{ previewSchedule.weekStart }} - {{ previewSchedule.weekEnd }}</text>
      </view>
      <view class="preview-list">
        <view v-for="day in previewDays" :key="day.dayOfWeek" class="preview-day" :class="{ rest: !day.templateName }">
          <text class="preview-weekday">{{ weekdayOptions[day.dayOfWeek - 1].label }}</text>
          <text class="preview-date">{{ day.date.slice(5) }}</text>
          <text class="preview-template">{{ day.templateName || '休息' }}</text>
        </view>
      </view>
    </view>

    <view class="save-bar">
      <button class="save-btn" :disabled="isSubmitting" @click="submitPlan">{{ isSubmitting ? '创建中...' : '创建计划' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { DailySchedule, WeeklySchedule } from '@/types/training-plan'
import type { TrainingTemplate } from '@/types/template'
import { templateServiceLocal } from '@/services/template.local'
import { trainingPlanServiceLocal } from '@/services/training-plan.local'
import { useMiniProgramShare } from '@/utils/share'

useMiniProgramShare({
  title: 'FitAI 健身记录：创建训练计划'
})

const weekdayOptions = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' }
]
const durationOptions = ['4 周', '6 周', '8 周', '10 周', '12 周']
const durationValues = [4, 6, 8, 10, 12]

const formData = ref({
  name: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  weekDuration: 8,
  color: '#101820'
})
const durationIndex = ref(2)
const selectedWeekdays = ref<number[]>([1, 3, 5])
const templates = ref<TrainingTemplate[]>([])
const selectedTemplates = ref<string[]>([])
const isSubmitting = ref(false)

const previewSchedule = computed(() => buildSchedules().weeklySchedules[0])
const previewDays = computed(() => {
  const schedule = previewSchedule.value
  return weekdayOptions.map((day) => {
    const training = schedule.dailySchedules.find((item) => item.dayOfWeek === day.value)
    return {
      dayOfWeek: day.value,
      date: getWeekDate(schedule.weekStart, day.value),
      templateName: training?.templateName || ''
    }
  })
})

function addDays(date: string, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next.toISOString().split('T')[0]
}
function getMonday(date: string) {
  const d = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - (day - 1))
  return d.toISOString().split('T')[0]
}
function getWeekDate(weekStart: string, dayOfWeek: number) {
  return addDays(weekStart, dayOfWeek - 1)
}
function templateNameById(id: string) {
  return templates.value.find((template) => template._id === id)?.name || '训练日'
}

function buildSchedules(): { weeklySchedules: WeeklySchedule[]; endDate: string } {
  const weekDuration = formData.value.weekDuration
  const weekStart = getMonday(formData.value.startDate)
  const weekdays = [...selectedWeekdays.value].sort((a, b) => a - b)
  const weeklySchedules: WeeklySchedule[] = []
  for (let weekNumber = 1; weekNumber <= weekDuration; weekNumber += 1) {
    const start = addDays(weekStart, (weekNumber - 1) * 7)
    const dailySchedules: DailySchedule[] = weekdays.map((dayOfWeek, index) => {
      const templateId = selectedTemplates.value[index % selectedTemplates.value.length]
      return {
        dayOfWeek,
        date: getWeekDate(start, dayOfWeek),
        templateId,
        templateName: templateNameById(templateId),
        completed: false
      }
    })
    weeklySchedules.push({
      weekNumber,
      weekStart: start,
      weekEnd: addDays(start, 6),
      dailySchedules,
      completedSessions: 0,
      totalSessions: dailySchedules.length
    })
  }
  return { weeklySchedules, endDate: weeklySchedules[weeklySchedules.length - 1].weekEnd }
}

const loadTemplates = async () => {
  templates.value = await templateServiceLocal.getTemplates()
}
const onStartDateChange = (event: any) => {
  formData.value.startDate = event.detail.value
}
const onDurationChange = (event: any) => {
  durationIndex.value = Number(event.detail.value)
  formData.value.weekDuration = durationValues[durationIndex.value]
}
const toggleWeekday = (value: number) => {
  const index = selectedWeekdays.value.indexOf(value)
  if (index >= 0) selectedWeekdays.value.splice(index, 1)
  else selectedWeekdays.value.push(value)
}
const toggleTemplate = (id: string) => {
  const index = selectedTemplates.value.indexOf(id)
  if (index >= 0) selectedTemplates.value.splice(index, 1)
  else selectedTemplates.value.push(id)
}
const goCreateTemplate = () => uni.navigateTo({ url: '/pages/templates/templates' })
const submitPlan = async () => {
  if (isSubmitting.value) return
  if (!formData.value.name.trim()) {
    uni.showToast({ title: '请输入计划名称', icon: 'none' })
    return
  }
  if (!selectedWeekdays.value.length) {
    uni.showToast({ title: '请选择训练日', icon: 'none' })
    return
  }
  if (!selectedTemplates.value.length) {
    uni.showToast({ title: '请选择模板', icon: 'none' })
    return
  }
  try {
    isSubmitting.value = true
    const { weeklySchedules, endDate } = buildSchedules()
    await trainingPlanServiceLocal.createPlan({
      name: formData.value.name.trim(),
      description: formData.value.description,
      startDate: formData.value.startDate,
      endDate,
      weekDuration: formData.value.weekDuration,
      weeklyFrequency: selectedWeekdays.value.length,
      weeklySchedules,
      color: formData.value.color,
      tags: []
    })
    uni.showToast({ title: '创建成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 900)
  } catch (error: any) {
    uni.showToast({ title: error.message || '创建失败', icon: 'none' })
    isSubmitting.value = false
  }
}

onMounted(loadTemplates)
onShow(loadTemplates)
</script>

<style lang="scss" scoped>
.create-page { min-height: 100vh; padding: 24rpx 24rpx 140rpx; background: #f4f6f8; box-sizing: border-box; }
.panel { margin-bottom: 20rpx; padding: 28rpx; border-radius: 12rpx; background: #fff; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
.panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; }
.panel-title { display: block; color: #101820; font-size: 30rpx; font-weight: 800; }
.panel-note { color: #718096; font-size: 22rpx; }
.field { margin-top: 22rpx; }
.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18rpx; }
.label { display: block; margin-bottom: 12rpx; color: #4a5568; font-size: 24rpx; font-weight: 700; }
input, textarea, .picker { width: 100%; min-height: 76rpx; padding: 0 20rpx; border-radius: 10rpx; background: #f8fafc; color: #101820; font-size: 28rpx; box-sizing: border-box; }
textarea { height: 130rpx; padding-top: 18rpx; line-height: 1.5; }
.picker { line-height: 76rpx; }
.weekday-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12rpx; }
.weekday-chip { height: 68rpx; line-height: 68rpx; border-radius: 999rpx; background: #edf2f7; color: #2d3748; font-size: 24rpx; text-align: center; }
.weekday-chip.active { background: #101820; color: #fff; font-weight: 800; }
.empty { padding: 34rpx 0; color: #718096; font-size: 26rpx; text-align: center; }
.empty button { margin-top: 18rpx; height: 68rpx; line-height: 68rpx; border-radius: 34rpx; background: #101820; color: #fff; font-size: 24rpx; }
.template-list { display: flex; flex-direction: column; gap: 14rpx; }
.template-card { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; padding: 20rpx; border-radius: 12rpx; background: #f8fafc; border: 2rpx solid transparent; }
.template-card.selected { border-color: #101820; background: #edf2f7; }
.template-info { min-width: 0; flex: 1; }
.template-name { display: block; color: #101820; font-size: 28rpx; font-weight: 800; }
.template-count { display: block; margin-top: 6rpx; color: #718096; font-size: 22rpx; }
.template-actions { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 12rpx; }
.template-action { max-width: 180rpx; padding: 6rpx 12rpx; border-radius: 999rpx; background: #fff; color: #4a5568; font-size: 21rpx; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.template-action.more { background: #e2e8f0; color: #101820; font-weight: 800; }
.selected-mark { color: #101820; font-size: 24rpx; font-weight: 800; }
.preview-list { display: flex; flex-direction: column; gap: 12rpx; }
.preview-day { display: grid; grid-template-columns: 88rpx 92rpx 1fr; gap: 12rpx; align-items: center; padding: 18rpx; border-radius: 12rpx; background: #f8fafc; border-left: 6rpx solid #22c55e; }
.preview-day.rest { border-left-color: #cbd5e1; color: #718096; }
.preview-weekday, .preview-template { color: #101820; font-size: 25rpx; font-weight: 800; }
.preview-date { color: #718096; font-size: 23rpx; }
.preview-day.rest .preview-template { color: #718096; }
.save-bar { position: fixed; left: 0; right: 0; bottom: 0; padding: 18rpx 24rpx 28rpx; background: rgba(255,255,255,.96); box-shadow: 0 -8rpx 24rpx rgba(16,24,32,.08); }
.save-btn { height: 88rpx; line-height: 88rpx; border-radius: 44rpx; background: #101820; color: #fff; font-size: 30rpx; font-weight: 800; }
.save-btn[disabled] { background: #4a5568; color: rgba(255,255,255,.72); }
</style>

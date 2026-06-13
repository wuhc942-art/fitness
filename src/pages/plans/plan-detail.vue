<template>
  <view class="plan-detail-page">
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
    
    <view v-else-if="plan" class="content">
      <!-- 计划头部 -->
      <view class="plan-header" :style="{ background: gradientBg }">
        <view class="plan-status">{{ statusText }}</view>
        <view class="plan-name">{{ plan.name }}</view>
        <view v-if="plan.description" class="plan-desc">{{ plan.description }}</view>
        <view class="plan-meta">
          <text>{{ plan.startDate }}</text>
          <text>·</text>
          <text>{{ plan.weekDuration }}周</text>
        </view>
      </view>

      <!-- 进度卡片 -->
      <view class="progress-card">
        <view class="progress-header">
          <text class="section-title">整体进度</text>
          <text class="progress-percent">{{ plan.progress.completionRate }}%</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: plan.progress.completionRate + '%' }"></view>
        </view>
        <view class="progress-stats">
          <view class="stat">
            <text class="stat-value">{{ plan.progress.currentWeek }}/{{ plan.weekDuration }}</text>
            <text class="stat-label">当前周数</text>
          </view>
          <view class="stat">
            <text class="stat-value">{{ plan.progress.completedSessions }}</text>
            <text class="stat-label">已完成</text>
          </view>
          <view class="stat">
            <text class="stat-value">{{ plan.progress.totalSessions }}</text>
            <text class="stat-label">总训练</text>
          </view>
        </view>
      </view>

      <!-- 周选择器 -->
      <view class="week-selector">
        <button 
          class="week-btn" 
          :class="{ disabled: currentWeek <= 1 }"
          @click="changeWeek(-1)"
        >
          ‹
        </button>
        <view class="week-display">
          <text class="week-label">第</text>
          <text class="week-number">{{ currentWeek }}</text>
          <text class="week-label">周</text>
        </view>
        <button 
          class="week-btn" 
          :class="{ disabled: currentWeek >= plan.weekDuration }"
          @click="changeWeek(1)"
        >
          ›
        </button>
      </view>

      <!-- 本周训练安排 -->
      <view class="week-section">
        <view class="section-header">
          <text class="section-title">本周训练</text>
          <text class="section-progress">{{ currentWeekProgress.completedSessions }}/{{ currentWeekProgress.totalSessions }}</text>
        </view>

        <view class="day-schedule">
          <view 
            v-for="(day, index) in currentWeekDays" 
            :key="index"
            class="day-card"
            :class="{ 
              'rest-day': !day.hasTraining,
              'completed': day.hasTraining && day.completed,
              'today': day.isToday
            }"
            @click="handleDayTap(day)"
          >
            <view 
              v-if="day.hasTraining"
              class="training-content"
            >
              <view class="day-header">
                <view class="day-left">
                  <text class="day-weekday">星期{{ day.weekdayName }}</text>
                  <text class="day-date">{{ day.date.slice(5) }}</text>
                </view>
                <view v-if="day.completed" class="completed-badge">✓</view>
                <view v-else-if="day.isToday" class="today-badge">今</view>
              </view>
              <view class="training-info">
                <text class="template-name">{{ day.templateName }}</text>
                <text v-if="day.completed && day.recordId" class="record-link">已记录</text>
                <text v-else-if="!day.completed" class="start-link">开始记录</text>
              </view>
            </view>

            <view v-else class="rest-content">
              <view class="day-header">
                <view class="day-left">
                  <text class="day-weekday">星期{{ day.weekdayName }}</text>
                  <text class="day-date">{{ day.date.slice(5) }}</text>
                </view>
                <view v-if="day.isToday" class="today-badge">今</view>
              </view>
              <view class="rest-info">
                <text class="rest-label">休息日</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 进阶规则提示 -->
      <view v-if="plan.progressiveRule?.enabled" class="rule-card">
        <view class="rule-header">
          <text class="rule-icon">📈</text>
          <text class="rule-title">渐进超负荷规则</text>
        </view>
        <view class="rule-desc">
          <text>每{{ plan.progressiveRule.frequency }}周{{ ruleTypeText }}{{ plan.progressiveRule.increment }}{{ plan.progressiveRule.type === 'weight' ? 'kg' : '' }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-section">
        <view class="action-row">
          <button 
            v-if="plan.status === 'active'" 
            class="btn btn-secondary"
            :disabled="isPlanActionBusy"
            @click="toggleStatus"
          >
            {{ isToggling ? '处理中...' : '暂停计划' }}
          </button>
          <button 
            v-else-if="plan.status === 'paused'" 
            class="btn btn-primary"
            :disabled="isPlanActionBusy"
            @click="toggleStatus"
          >
            {{ isToggling ? '处理中...' : '恢复计划' }}
          </button>
          <button class="btn btn-outline" :disabled="isPlanActionBusy" @click="editPlan">编辑</button>
        </view>
        <view class="action-row">
          <button class="btn btn-outline" :disabled="isPlanActionBusy" @click="duplicatePlan">{{ isDuplicating ? '复制中...' : '复制计划' }}</button>
          <button class="btn btn-danger" :disabled="isPlanActionBusy" @click="deletePlan">{{ isDeleting ? '删除中...' : '删除计划' }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { trainingPlanServiceLocal } from '@/services/training-plan.local'
import type { TrainingPlan, DailySchedule } from '@/types/training-plan'

const planId = ref<string>('')
const plan = ref<TrainingPlan | null>(null)
const loading = ref(true)
const currentWeek = ref(1)
const isDeleting = ref(false)
const isDuplicating = ref(false)
const isToggling = ref(false)
const isPlanActionBusy = computed(() => isDeleting.value || isDuplicating.value || isToggling.value)

type WeekDayView = {
  date: string
  weekdayName: string
  hasTraining: boolean
  completed: boolean
  templateName?: string
  templateId?: string
  recordId?: string
  isToday: boolean
}

const statusText = computed(() => {
  if (!plan.value) return ''
  return { active: '进行中', paused: '已暂停', completed: '已完成', archived: '已归档' }[plan.value.status] || plan.value.status
})

const gradientBg = computed(() => {
  return plan.value?.color ? 
    `linear-gradient(135deg, ${plan.value.color}dd 0%, ${plan.value.color} 100%)` :
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
})

const ruleTypeText = computed(() => {
  if (!plan.value?.progressiveRule) return ''
  const typeMap: Record<string, string> = { weight: '增加重量', reps: '增加次数', sets: '增加组数' }
  return typeMap[plan.value.progressiveRule.type] || ''
})

const currentWeekData = computed(() => {
  if (!plan.value) return null
  return plan.value.weeklySchedules.find(w => w.weekNumber === currentWeek.value) || null
})

const currentWeekProgress = computed(() => {
  if (!currentWeekData.value) return { completedSessions: 0, totalSessions: 0 }
  return {
    completedSessions: currentWeekData.value.completedSessions,
    totalSessions: currentWeekData.value.totalSessions
  }
})

const currentWeekDays = computed(() => {
  if (!currentWeekData.value) return []
  
  const today = new Date().toISOString().split('T')[0]
  const weekdayNames = ['一', '二', '三', '四', '五', '六', '日']
  
  // 生成完整的周计划（包括休息日）
  const days: WeekDayView[] = []
  
  for (let day = 1; day <= 7; day++) {
    const schedule = currentWeekData.value.dailySchedules.find(d => d.dayOfWeek === day)
    
    if (schedule) {
      days.push({
        date: schedule.date,
        weekdayName: weekdayNames[day - 1],
        hasTraining: true,
        completed: schedule.completed,
        templateName: schedule.templateName,
        templateId: schedule.templateId,
        recordId: schedule.recordId,
        isToday: schedule.date === today
      })
    } else {
      // 休息日
      const startDate = new Date(currentWeekData.value.weekStart)
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + day - 1)
      const dateStr = date.toISOString().split('T')[0]
      
      days.push({
        date: dateStr,
        weekdayName: weekdayNames[day - 1],
        hasTraining: false,
        completed: false,
        isToday: dateStr === today
      })
    }
  }
  
  return days
})

const loadPlan = async () => {
  try {
    plan.value = await trainingPlanServiceLocal.getPlanById(planId.value)
    if (plan.value) {
      // 计算当前周
      const today = new Date().toISOString().split('T')[0]
      for (const week of plan.value.weeklySchedules) {
        if (week.weekStart <= today && week.weekEnd >= today) {
          currentWeek.value = week.weekNumber
          break
        }
      }
    }
  } catch (e) {
    console.error('加载计划失败:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const changeWeek = (delta: number) => {
  const newWeek = currentWeek.value + delta
  if (newWeek < 1 || newWeek > (plan.value?.weekDuration || 1)) return
  currentWeek.value = newWeek
}

const toggleStatus = async () => {
  if (isPlanActionBusy.value) return
  if (!plan.value?._id) return
  try {
    isToggling.value = true
    await trainingPlanServiceLocal.togglePlanStatus(plan.value._id)
    uni.showToast({ title: '操作成功', icon: 'success' })
    loadPlan()
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  } finally {
    isToggling.value = false
  }
}

const editPlan = () => {
  if (isPlanActionBusy.value) return
  if (!plan.value?._id) return
  uni.navigateTo({
    url: `/pages/plans/edit-plan?id=${plan.value._id}`
  })
}

const handleDayTap = (day: WeekDayView) => {
  if (!day.hasTraining || !plan.value?._id) return

  if (day.completed) {
    if (day.recordId) {
      uni.navigateTo({ url: `/pages/training-record/training-record?recordId=${day.recordId}` })
    } else {
      uni.showToast({ title: '这天已完成', icon: 'success' })
    }
    return
  }

  if (!day.templateId) {
    uni.showToast({ title: '这天没有绑定模板', icon: 'none' })
    return
  }

  uni.navigateTo({
    url: `/pages/training-record/training-record?planId=${plan.value._id}&week=${currentWeek.value}&templateId=${day.templateId}&date=${day.date}`
  })
}

const duplicatePlan = async () => {
  if (isPlanActionBusy.value) return
  const currentPlanId = plan.value?._id
  if (!currentPlanId) return
  uni.showModal({
    title: '复制计划',
    content: '确定要复制这个计划吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          isDuplicating.value = true
          await trainingPlanServiceLocal.duplicatePlan(currentPlanId)
          uni.showToast({ title: '复制成功', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 1500)
        } catch (e) {
          uni.showToast({ title: '复制失败', icon: 'none' })
          isDuplicating.value = false
        }
      }
    }
  })
}

const deletePlan = async () => {
  if (isPlanActionBusy.value) return
  const currentPlanId = plan.value?._id
  if (!currentPlanId) return
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个计划吗？此操作不可恢复。',
    success: async (res) => {
      if (res.confirm) {
        try {
          isDeleting.value = true
          await trainingPlanServiceLocal.deletePlan(currentPlanId)
          uni.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 1500)
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
          isDeleting.value = false
        }
      }
    }
  })
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  planId.value = currentPage.options?.id || ''
  if (plan.value) uni.setNavigationBarTitle({ title: plan.value.name })
  loadPlan()
})

onShow(() => {
  if (planId.value) loadPlan()
})
</script>

<style lang="scss" scoped>
.plan-detail-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 28rpx;
  color: #999;
}

.plan-header {
  padding: 60rpx 40rpx 40rpx;
  color: #fff;
  
  .plan-status {
    display: inline-block;
    padding: 8rpx 20rpx;
    background: rgba(255,255,255,0.2);
    border-radius: 20rpx;
    font-size: 24rpx;
    margin-bottom: 16rpx;
  }
  
  .plan-name {
    font-size: 44rpx;
    font-weight: bold;
    margin-bottom: 12rpx;
  }
  
  .plan-desc {
    font-size: 28rpx;
    opacity: 0.9;
    margin-bottom: 20rpx;
  }
  
  .plan-meta {
    font-size: 26rpx;
    opacity: 0.8;
    
    text {
      margin: 0 8rpx;
    }
  }
}

.progress-card {
  background: #fff;
  margin: -40rpx 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08);
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .section-title {
      font-size: 30rpx;
      font-weight: bold;
    }
    
    .progress-percent {
      font-size: 36rpx;
      font-weight: bold;
      color: #667eea;
    }
  }
  
  .progress-bar {
    height: 16rpx;
    background: #f0f0f0;
    border-radius: 8rpx;
    overflow: hidden;
    margin-bottom: 30rpx;
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 8rpx;
    }
  }
  
  .progress-stats {
    display: flex;
    justify-content: space-around;
    
    .stat {
      text-align: center;
      
      .stat-value {
        display: block;
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
      }
      
      .stat-label {
        display: block;
        font-size: 24rpx;
        color: #999;
        margin-top: 8rpx;
      }
    }
  }
}

.week-selector {
  background: #fff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .week-btn {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background: #f5f5f5;
    color: #333;
    font-size: 40rpx;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    padding: 0;
    
    &.disabled {
      opacity: 0.3;
    }
  }
  
  .week-display {
    text-align: center;
    
    .week-label {
      font-size: 28rpx;
      color: #999;
    }
    
    .week-number {
      font-size: 48rpx;
      font-weight: bold;
      color: #667eea;
      margin: 0 12rpx;
    }
  }
}

.week-section {
  background: #fff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    .section-title {
      font-size: 30rpx;
      font-weight: bold;
    }
    
    .section-progress {
      font-size: 26rpx;
      color: #999;
    }
  }
}

.day-schedule {
  .day-card {
    margin-bottom: 16rpx;
    border-radius: 12rpx;
    overflow: hidden;
    border: 2rpx solid transparent;
    
    &.completed {
      background: #f6ffed;
      border-color: #b7eb8f;
      
      .template-name {
        text-decoration: line-through;
        color: #999;
      }
    }
    
    &.today {
      border-color: #667eea;
      background: #f0f5ff;
    }
    
    &.rest-day {
      background: #fafafa;
      
      .rest-info {
        padding: 20rpx 0;
      }
      
      .rest-label {
        font-size: 26rpx;
        color: #999;
      }
    }
    
    .training-content {
      padding: 24rpx;
    }
    
    .rest-content {
      padding: 24rpx;
    }
    
    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12rpx;
      
      .day-left {
        display: flex;
        align-items: center;
        gap: 12rpx;
        
        .day-weekday {
          font-size: 28rpx;
          font-weight: bold;
          color: #333;
        }
        
        .day-date {
          font-size: 24rpx;
          color: #999;
        }
      }
      
      .completed-badge,
      .today-badge {
        width: 36rpx;
        height: 36rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20rpx;
        font-weight: bold;
      }
      
      .completed-badge {
        background: #52c41a;
        color: #fff;
      }
      
      .today-badge {
        background: #667eea;
        color: #fff;
      }
    }
    
    .training-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .template-name {
        font-size: 26rpx;
        color: #666;
      }
      
      .record-link {
        font-size: 24rpx;
        color: #667eea;
      }

      .start-link {
        flex-shrink: 0;
        padding: 8rpx 14rpx;
        border-radius: 999rpx;
        background: #101820;
        color: #fff;
        font-size: 22rpx;
        font-weight: 700;
      }
    }
  }
}

.rule-card {
  background: #fff;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  
  .rule-header {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    
    .rule-icon {
      font-size: 32rpx;
      margin-right: 12rpx;
    }
    
    .rule-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .rule-desc {
    font-size: 26rpx;
    color: #666;
    background: #f8f9fa;
    padding: 16rpx;
    border-radius: 8rpx;
  }
}

.action-section {
  padding: 30rpx;
  
  .action-row {
    display: flex;
    gap: 20rpx;
    margin-bottom: 20rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .btn {
      flex: 1;
      height: 80rpx;
      border-radius: 40rpx;
      font-size: 28rpx;
      font-weight: bold;
      border: none;
      
      &[disabled] {
        opacity: .65;
      }
      
      &.btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
      }
      
      &.btn-secondary {
        background: #ff9800;
        color: #fff;
      }
      
      &.btn-outline {
        background: #fff;
        color: #667eea;
        border: 2rpx solid #667eea;
      }
      
      &.btn-danger {
        background: #fff5f5;
        color: #ff4d4f;
        border: 2rpx solid #ff4d4f;
      }
    }
  }
}
</style>

<template>
  <view class="plans-page">
    <!-- 顶部 Tab -->
    <view class="tabs-header">
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'plans' }"
        @click="currentTab = 'plans'"
      >
        <text class="tab-text">我的计划</text>
        <view v-if="activePlanCount > 0" class="tab-badge">{{ activePlanCount }}</view>
      </view>
      
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'calendar' }"
        @click="currentTab = 'calendar'"
      >
        <text class="tab-text">计划日历</text>
      </view>
    </view>

    <!-- 我的计划列表 -->
    <scroll-view v-if="currentTab === 'plans'" class="plans-scroll" scroll-y>
      <!-- 计划操作入口 -->
      <view class="plan-actions">
        <view class="create-plan-card ai-plan-card" @click="goAiPlan">
          <view class="create-icon ai-icon">AI</view>
          <text class="create-text">AI生成计划</text>
        </view>
        <view class="create-plan-card" @click="createNewPlan">
          <view class="create-icon">+</view>
          <text class="create-text">手动新建</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="plans.length === 0" class="empty-state">
        <view class="empty-icon">📅</view>
        <text class="empty-title">暂无训练计划</text>
        <text class="empty-tip">创建第一个计划，科学安排训练</text>
        <button class="create-btn" @click="createNewPlan">创建计划</button>
      </view>

      <!-- 计划卡片列表 -->
      <view v-else class="plans-list">
        <view
          v-for="plan in plans"
          :key="plan._id"
          class="plan-card"
          :style="{ borderLeftColor: plan.color || '#667eea' }"
          @click="viewPlanDetail(plan._id!)"
        >
          <view class="plan-header">
            <view class="plan-name">{{ plan.name }}</view>
            <view class="plan-status" :class="`status-${plan.status}`">
              <text class="status-text">{{ getStatusText(plan.status) }}</text>
            </view>
          </view>
          
          <view class="plan-period">
            <text class="period-text">{{ plan.startDate }} - {{ plan.endDate }}</text>
          </view>
          
          <view class="plan-progress">
            <view class="progress-info">
              <text class="progress-text">本周进度</text>
              <text class="progress-value">{{ plan.progress.currentWeek }} / {{ plan.progress.weekDuration }} 周</text>
            </view>
            <view class="progress-bar">
              <view 
                class="progress-fill" 
                :style="{ width: `${plan.progress.completionRate}%`, backgroundColor: plan.color || '#667eea' }"
              ></view>
            </view>
            <view class="progress-stats">
              <text class="stats-text">已完成 {{ plan.progress.completionRate }}%</text>
            </view>
          </view>
          
          <view v-if="plan.nextSession" class="next-session">
            <text class="session-label">下次训练</text>
            <text class="session-value">{{ plan.nextSession.date }} · {{ plan.nextSession.templateName }}</text>
          </view>
          
          <view class="plan-actions">
            <button class="action-btn primary" @click.stop="startTodayTraining(plan._id!)">执行今日训练</button>
            <view class="action-menu" @click.stop="showPlanMenu(plan)">
              <text class="menu-icon">⋯</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 计划日历视图 -->
    <scroll-view v-else class="calendar-scroll" scroll-y>
      <view class="calendar-card">
        <view class="calendar-header">
          <text class="calendar-title">{{ calendarYear }}年{{ calendarMonth }}月</text>
          <view class="calendar-nav">
            <text class="nav-btn" @click="prevMonth">‹</text>
            <text class="nav-text">{{ getMonthName(calendarMonth) }}</text>
            <text class="nav-btn" @click="nextMonth">›</text>
          </view>
        </view>
        
        <view class="calendar-weekdays">
          <text v-for="day in ['一', '二', '三', '四', '五', '六', '日']" 
                :key="day" 
                class="weekday-label">
            {{ day }}
          </text>
        </view>
        
        <view class="calendar-days">
          <view 
            v-for="(day, index) in calendarDays" 
            :key="index"
            class="calendar-day"
            :class="{
              'day-empty': !day.date,
              'day-today': day.isToday,
              'day-completed': day.isCompleted,
              'day-scheduled': day.hasTraining && !day.isCompleted
            }"
            @click="onDayClick(day)"
          >
            <text class="day-number">{{ day.dayOfMonth }}</text>
            <view v-if="day.hasTraining" class="day-indicator">
              <view class="indicator-dot" :class="{ completed: day.isCompleted }"></view>
            </view>
            <text v-if="day.planName" class="day-plan">{{ day.planName }}</text>
          </view>
        </view>
        
        <view class="calendar-legend">
          <view class="legend-item">
            <view class="legend-dot legend-dot--empty"></view>
            <text class="legend-text">未安排</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot legend-dot--scheduled"></view>
            <text class="legend-text">待训练</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot legend-dot--completed"></view>
            <text class="legend-text">已完成</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 菜单弹窗 -->
    <view v-if="showMenu" class="menu-overlay" @click="showMenu = false">
      <view class="menu-content" @click.stop>
        <view class="menu-item" @click="editPlan">编辑计划</view>
        <view class="menu-item" @click="togglePlanStatus">{{ isToggling ? '处理中...' : (selectedPlan?.status === 'active' ? '暂停计划' : '恢复计划') }}</view>
        <view class="menu-item" @click="duplicatePlan">{{ isDuplicating ? '复制中...' : '复制计划' }}</view>
        <view class="menu-item delete" @click="deletePlan">{{ isDeleting ? '删除中...' : '删除计划' }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { PlanListItem, PlanCalendarDay, TrainingPlan } from '@/types/training-plan'
import { trainingPlanServiceLocal } from '@/services/training-plan.local'
import { onShow } from '@dcloudio/uni-app'

// Tab 切换
const currentTab = ref<'plans' | 'calendar'>('plans')

// 计划列表
const plans = ref<PlanListItem[]>([])
const activePlanCount = ref(0)

// 日历数据
const calendarYear = ref(new Date().getFullYear())
const calendarMonth = ref(new Date().getMonth() + 1)
const calendarDays = ref<PlanCalendarDay[]>([])

// 菜单
const showMenu = ref(false)
const selectedPlan = ref<PlanListItem | null>(null)
const isDeleting = ref(false)
const isDuplicating = ref(false)
const isToggling = ref(false)
const isPlanActionBusy = computed(() => isDeleting.value || isDuplicating.value || isToggling.value)

// 加载计划列表
const loadPlans = async () => {
  try {
    plans.value = await trainingPlanServiceLocal.getPlans()
    activePlanCount.value = plans.value.filter(p => p.status === 'active').length
  } catch (error) {
    console.error('加载计划失败:', error)
  }
}

// 加载日历
const loadCalendar = async () => {
  try {
    const calendar = await trainingPlanServiceLocal.getCalendar(calendarYear.value, calendarMonth.value)
    calendarDays.value = calendar.days
  } catch (error) {
    console.error('加载日历失败:', error)
  }
}

// 创建新计划
const createNewPlan = () => {
  uni.navigateTo({ url: '/pages/plans/create-plan' })
}

const goAiPlan = () => {
  uni.navigateTo({ url: '/pages/ai-plan/ai-plan' })
}

// 查看计划详情
const viewPlanDetail = (planId: string) => {
  uni.navigateTo({ url: `/pages/plans/plan-detail?id=${planId}` })
}

// 执行今日训练
const startTodayTraining = async (planId: string) => {
  try {
    const plan = await trainingPlanServiceLocal.getPlanById(planId)
    if (!plan) {
      uni.showToast({ title: '计划不存在', icon: 'none' })
      return
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    // 查找今天的训练日
    let todaySchedule: any = null
    for (const week of plan.weeklySchedules) {
      for (const day of week.dailySchedules) {
        if (day.date === today && day.templateId) {
          todaySchedule = { week: week.weekNumber, day }
          break
        }
      }
      if (todaySchedule) break
    }
    
    if (!todaySchedule) {
      uni.showToast({ title: '今天没有计划训练', icon: 'none' })
      return
    }
    
    // 跳转到训练记录页，携带模板 ID
    uni.navigateTo({
      url: `/pages/training-record/training-record?planId=${planId}&week=${todaySchedule.week}&templateId=${todaySchedule.day.templateId}&date=${today}`
    })
  } catch (e) {
    console.error('加载今日训练失败:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

// 显示菜单
const showPlanMenu = (plan: PlanListItem) => {
  selectedPlan.value = plan
  showMenu.value = true
}

// 编辑计划
const editPlan = () => {
  if (isPlanActionBusy.value) return
  showMenu.value = false
  if (selectedPlan.value) {
    uni.navigateTo({ url: `/pages/plans/edit-plan?id=${selectedPlan.value._id}` })
  }
}

// 暂停/恢复计划
const togglePlanStatus = async () => {
  if (isPlanActionBusy.value) return
  if (!selectedPlan.value?._id) return
  
  try {
    isToggling.value = true
    await trainingPlanServiceLocal.togglePlanStatus(selectedPlan.value._id)
    uni.showToast({ title: '操作成功', icon: 'success' })
    showMenu.value = false
    loadPlans()
  } catch (error) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  } finally {
    isToggling.value = false
  }
}

// 复制计划
const duplicatePlan = async () => {
  if (isPlanActionBusy.value) return
  const currentPlanId = selectedPlan.value?._id
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
          showMenu.value = false
          loadPlans()
        } catch (error) {
          uni.showToast({ title: '复制失败', icon: 'none' })
        } finally {
          isDuplicating.value = false
        }
      }
    }
  })
}

// 删除计划
const deletePlan = async () => {
  if (isPlanActionBusy.value) return
  const currentPlanId = selectedPlan.value?._id
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
          showMenu.value = false
          loadPlans()
        } catch (error) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        } finally {
          isDeleting.value = false
        }
      }
    }
  })
}

// 日历导航
const prevMonth = () => {
  if (calendarMonth.value === 1) {
    calendarMonth.value = 12
    calendarYear.value--
  } else {
    calendarMonth.value--
  }
  loadCalendar()
}

const nextMonth = () => {
  if (calendarMonth.value === 12) {
    calendarMonth.value = 1
    calendarYear.value++
  } else {
    calendarMonth.value++
  }
  loadCalendar()
}

// 点击日期
const onDayClick = (day: PlanCalendarDay) => {
  if (!day.date || !day.hasTraining) return
  
  if (day.isCompleted) {
    uni.showToast({
      title: '已完成',
      icon: 'success'
    })
    return
  }

  if (day.planId && day.scheduled?.templateId && day.weekNumber) {
    uni.navigateTo({
      url: `/pages/training-record/training-record?planId=${day.planId}&week=${day.weekNumber}&templateId=${day.scheduled.templateId}&date=${day.date}`
    })
    return
  }

  if (day.planId) {
    uni.navigateTo({ url: `/pages/plans/plan-detail?id=${day.planId}` })
  }
}

// 获取月份名称
const getMonthName = (month: number) => {
  const months = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ]
  return months[month - 1]
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '进行中',
    paused: '已暂停',
    completed: '已完成',
    archived: '已归档'
  }
  return statusMap[status] || status
}

// 生命周期
onMounted(() => {
  loadPlans()
  loadCalendar()
})

onShow(() => {
  loadPlans()
  loadCalendar()
})
</script>

<style lang="scss" scoped>
.plans-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* Tab 头部 */
.tabs-header {
  display: flex;
  background-color: #ffffff;
  border-bottom: 2rpx solid #f0f0f0;
}

.tab-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24rpx 0;
  position: relative;
  
  &.active {
    .tab-text {
      color: #667eea;
      font-weight: 600;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      width: 40rpx;
      height: 4rpx;
      background-color: #667eea;
      border-radius: 2rpx 2rpx 0 0;
    }
  }
  
  .tab-text {
    font-size: 28rpx;
    color: #606266;
  }
  
  .tab-badge {
    margin-left: 8rpx;
    padding: 2rpx 10rpx;
    background-color: #ff4d4f;
    color: #fff;
    font-size: 20rpx;
    border-radius: 20rpx;
  }
}

/* 新建计划卡片 */
.plan-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18rpx;
  margin: 20rpx;
}

.create-plan-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 164rpx;
  padding: 28rpx 20rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  border: 2rpx dashed #d9d9d9;
  
  .create-icon {
    font-size: 44rpx;
    color: #667eea;
    margin-bottom: 16rpx;
  }
  
  .create-text {
    font-size: 24rpx;
    color: #606266;
  }
}

.ai-plan-card {
  border-color: #111827;
  border-style: solid;
  background-color: #111827;

  .create-text,
  .create-icon {
    color: #ffffff;
  }

  .ai-icon {
    width: 64rpx;
    height: 64rpx;
    line-height: 64rpx;
    text-align: center;
    border-radius: 18rpx;
    background: rgba(255, 255, 255, 0.14);
    font-size: 28rpx;
    font-weight: 700;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx;
  background-color: #ffffff;
  margin: 20rpx;
  border-radius: 16rpx;
  
  .empty-icon {
    font-size: 100rpx;
    margin-bottom: 24rpx;
    opacity: 0.5;
  }
  
  .empty-title {
    font-size: 28rpx;
    color: #303133;
    margin-bottom: 12rpx;
  }
  
  .empty-tip {
    font-size: 24rpx;
    color: #909399;
    margin-bottom: 32rpx;
  }
  
  .create-btn {
    width: 280rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border: none;
    border-radius: 36rpx;
    font-size: 28rpx;
  }
}

/* 计划卡片列表 */
.plans-list {
  padding: 20rpx;
}

.plan-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border-left: 6rpx solid;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.plan-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.plan-status {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  font-size: 20rpx;
  
  &.status-active {
    background-color: rgba(102, 126, 234, 0.1);
    .status-text {
      color: #667eea;
    }
  }
  
  &.status-paused {
    background-color: rgba(250, 173, 20, 0.1);
    .status-text {
      color: #faad14;
    }
  }
  
  &.status-completed {
    background-color: rgba(82, 196, 26, 0.1);
    .status-text {
      color: #52c41a;
    }
  }
}

.plan-period {
  margin-bottom: 20rpx;
}

.period-text {
  font-size: 22rpx;
  color: #909399;
}

.plan-progress {
  margin-bottom: 20rpx;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.progress-text {
  font-size: 22rpx;
  color: #606266;
}

.progress-value {
  font-size: 22rpx;
  color: #303133;
  font-weight: 600;
}

.progress-bar {
  height: 12rpx;
  background-color: #f0f0f0;
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: 8rpx;
}

.progress-fill {
  height: 100%;
  background-color: #667eea;
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.progress-stats {
  text-align: right;
}

.stats-text {
  font-size: 20rpx;
  color: #909399;
}

.next-session {
  padding: 16rpx;
  background-color: #f5f7fa;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.session-label {
  display: block;
  font-size: 20rpx;
  color: #909399;
  margin-bottom: 4rpx;
}

.session-value {
  font-size: 24rpx;
  color: #667eea;
  font-weight: 600;
}

.plan-actions {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  flex: 1;
  height: 64rpx;
  border-radius: 32rpx;
  font-size: 24rpx;
  border: none;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }
}

.action-menu {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 32rpx;
  
  .menu-icon {
    font-size: 32rpx;
    color: #606266;
  }
}

/* 日历卡片 */
.calendar-card {
  background-color: #ffffff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 24rpx;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.calendar-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.nav-btn {
  font-size: 40rpx;
  color: #667eea;
  padding: 8rpx 16rpx;
}

.nav-text {
  font-size: 28rpx;
  color: #606266;
  font-weight: 600;
}

.calendar-weekdays {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.weekday-label {
  flex: 1;
  text-align: center;
  font-size: 22rpx;
  color: #606266;
  font-weight: 500;
}

.calendar-days {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.calendar-day {
  width: calc(100% / 7 - 6rpx);
  aspect-ratio: 1;
  background-color: #f5f7fa;
  border-radius: 12rpx;
  padding: 4rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  
  &.day-empty {
    background-color: transparent;
  }
  
  &.day-today {
    border: 3rpx solid #667eea;
    background-color: #fff;
  }
  
  &.day-completed {
    background-color: rgba(82, 196, 26, 0.15);
  }
  
  &.day-scheduled {
    background-color: rgba(102, 126, 234, 0.08);
  }
}

.day-number {
  font-size: 24rpx;
  color: #303133;
  font-weight: 600;
}

.day-indicator {
  margin-top: 8rpx;
}

.indicator-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background-color: #d9d9d9;
  
  &.completed {
    background-color: #52c41a;
  }
}

.day-plan {
  font-size: 16rpx;
  color: #909399;
  margin-top: 4rpx;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 32rpx;
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 2rpx solid #f0f0f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  
  &.legend-dot--empty {
    background-color: #d9d9d9;
  }
  
  &.legend-dot--scheduled {
    background-color: #667eea;
  }
  
  &.legend-dot--completed {
    background-color: #52c41a;
  }
}

.legend-text {
  font-size: 20rpx;
  color: #909399;
}

/* 菜单弹窗 */
.menu-overlay {
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

.menu-content {
  width: 100%;
  background-color: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 20rpx 0;
}

.menu-item {
  padding: 32rpx 40rpx;
  font-size: 28rpx;
  color: #303133;
  border-bottom: 2rpx solid #f0f0f0;
  
  &:active {
    background-color: #f5f7fa;
  }
  
  &.delete {
    color: #ff4d4f;
  }
}

/* Fresh premium visual layer */
.plans-page {
  background:
    radial-gradient(circle at 88% 0%, rgba(83, 215, 182, .16), transparent 30%),
    linear-gradient(180deg, #f9fcff 0%, #f4f8fb 50%, #f7fafc 100%);
}

.tabs-header {
  margin: 20rpx 24rpx 0;
  padding: 8rpx;
  border: 0;
  border-radius: 999rpx;
  background: #e7eef4;
}

.tab-item {
  padding: 18rpx 0;
  border-radius: 999rpx;

  &.active {
    background: #fff;
    box-shadow: 0 6rpx 16rpx rgba(71, 98, 128, .09);

    .tab-text {
      color: #4f8cff;
      font-weight: 900;
    }

    &::after {
      display: none;
    }
  }

  .tab-text {
    color: #768398;
    font-weight: 850;
  }

  .tab-badge {
    background: #e8f1ff;
    color: #4f8cff;
  }
}

.plans-scroll,
.calendar-scroll {
  height: calc(100vh - 96rpx);
}

.plan-actions {
  gap: 18rpx;
  margin: 20rpx 24rpx;
}

.create-plan-card {
  min-height: 156rpx;
  border: 1rpx solid rgba(223, 232, 239, .9);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, .9);
  box-shadow: 0 8rpx 24rpx rgba(71, 98, 128, .07);

  .create-icon,
  .create-text {
    color: #4f8cff;
    font-weight: 900;
  }
}

.ai-plan-card {
  border-color: rgba(220, 236, 255, .95);
  background: linear-gradient(145deg, #ffffff, #edf7ff);

  .create-icon,
  .create-text {
    color: #4f8cff;
  }

  .ai-icon {
    background: #e8f1ff;
  }
}

.empty-state,
.plan-card,
.calendar-card {
  border: 1rpx solid rgba(223, 232, 239, .9);
  border-radius: 26rpx;
  background: rgba(255, 255, 255, .92);
  box-shadow: 0 8rpx 24rpx rgba(71, 98, 128, .07);
}

.plans-list {
  padding: 0 24rpx 24rpx;
}

.plan-card {
  border-left: 0 !important;
  padding: 28rpx;
}

.plan-name,
.calendar-title,
.day-number {
  color: #18212f;
  font-weight: 900;
}

.period-text,
.progress-text,
.stats-text,
.session-label,
.legend-text,
.day-plan,
.weekday-label,
.nav-text,
.empty-tip {
  color: #768398;
}

.plan-status,
.plan-status.status-active,
.plan-status.status-paused,
.plan-status.status-completed {
  background: #e9fbf6;

  .status-text {
    color: #16856c;
    font-weight: 900;
  }
}

.progress-bar {
  height: 14rpx;
  background: #e8eef3;
}

.progress-fill {
  background: linear-gradient(90deg, #4f8cff, #78c7ff) !important;
}

.next-session {
  border: 1rpx solid #d4f4eb;
  border-radius: 18rpx;
  background: #e9fbf6;
}

.session-value {
  color: #16856c;
}

.action-btn.primary,
.create-btn {
  background: linear-gradient(135deg, #4f8cff 0%, #5fb7ff 100%);
  color: #fff;
  box-shadow: 0 12rpx 28rpx rgba(79, 140, 255, .22);
}

.action-menu {
  background: #eef4f8;
}

.menu-icon {
  color: #768398;
}

.calendar-day {
  border-radius: 16rpx;
  background: #eef4f8;
}

.calendar-day.day-today {
  border-color: #4f8cff;
}

.calendar-day.day-scheduled {
  background: #e8f1ff;
}

.calendar-day.day-completed {
  background: #e9fbf6;
}

.indicator-dot,
.legend-dot.legend-dot--scheduled {
  background: #4f8cff;
}

.indicator-dot.completed,
.legend-dot.legend-dot--completed {
  background: #53d7b6;
}

.nav-btn {
  color: #4f8cff;
}

.menu-overlay {
  background: rgba(24, 33, 47, .38);
}

.menu-content {
  border-radius: 34rpx 34rpx 0 0;
}
</style>

<template>
  <view class="home-page">
    <view class="hero">
      <view class="hero-copy">
        <text class="hero-kicker">{{ todayText }}</text>
        <text class="hero-title">{{ heroTitle }}</text>
        <text class="hero-subtitle">{{ heroSubtitle }}</text>
      </view>
      <button class="hero-button" :disabled="isNavigating" @click="primaryAction">{{ isNavigating ? '打开中' : primaryButtonText }}</button>
    </view>

    <view class="metrics">
      <view class="metric">
        <text class="metric-value">{{ statistics.continuousDays }}</text>
        <text class="metric-label">连续天数</text>
      </view>
      <view class="metric">
        <text class="metric-value">{{ statistics.monthCount }}</text>
        <text class="metric-label">本月训练</text>
      </view>
      <view class="metric">
        <text class="metric-value">{{ formatDuration(statistics.totalDuration) }}</text>
        <text class="metric-label">累计小时</text>
      </view>
    </view>

    <view class="section growth-section">
      <view class="card-heading">
        <view>
          <text class="card-title">成长档案</text>
          <text class="card-subtitle">把训练记录转成等级、属性和今日任务</text>
        </view>
        <button class="mini-btn" :disabled="isLoading" @click="loadStatistics">{{ isLoading ? '刷新中' : '刷新' }}</button>
      </view>
      <view v-if="isLoading" class="home-loading">正在整理今日成长任务...</view>
      <view class="growth-card">
        <view class="growth-top">
          <view>
            <text class="growth-label">{{ growthProfile.title }}</text>
            <text class="growth-level">Lv. {{ growthProfile.level }}</text>
          </view>
          <view class="growth-exp">
            <text>{{ growthProfile.experience }}</text>
            <text>EXP</text>
          </view>
        </view>
        <view class="growth-bar">
          <view class="growth-fill" :style="{ width: `${growthProfile.progressPercent}%` }"></view>
        </view>
        <text class="growth-next">距离下一级还差 {{ Math.max(growthProfile.nextLevelExperience - growthProfile.experience, 0) }} 经验</text>
        <view class="quest-card">
          <view class="quest-mark">
            <text>Q</text>
          </view>
          <view class="quest-copy">
            <text class="quest-title">{{ growthProfile.questTitle }}</text>
            <text class="quest-text">{{ growthProfile.questSubtitle }}</text>
            <text class="quest-reward">{{ growthProfile.rewardText }}</text>
          </view>
        </view>
        <view class="attribute-grid">
          <view v-for="attr in growthProfile.attributes" :key="attr.label" class="attribute-item">
            <text class="attribute-value">{{ attr.value }}</text>
            <text class="attribute-label">{{ attr.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="week-card">
      <view class="card-heading">
        <text class="card-title">本周状态</text>
        <text class="card-note">{{ trainedThisWeek }} / 7</text>
      </view>
      <view class="week-grid">
        <view v-for="day in weekDays" :key="day.date" class="week-day">
          <text class="weekday">{{ day.weekday }}</text>
          <view class="date-cell" :class="{ trained: day.hasTraining, today: day.isToday && !day.hasTraining }">
            <text>{{ day.day }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="card-heading">
        <text class="card-title">个人记录 PR</text>
        <text class="card-note">最大重量</text>
      </view>
      <view v-if="prRecords.length === 0" class="empty">完成一次训练后，这里会自动生成你的个人记录。</view>
      <scroll-view v-else scroll-x class="pr-scroll">
        <view class="pr-list">
          <view v-for="pr in prRecords.slice(0, 8)" :key="pr.actionName" class="pr-item">
            <text class="pr-name">{{ pr.actionName }}</text>
            <text class="pr-weight">{{ pr.maxWeight }} kg</text>
            <text class="pr-rm">估算 1RM {{ pr.max1RM.toFixed(1) }} kg</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="quick-grid">
      <view v-for="item in quickActions" :key="item.label" class="quick-item" @click="goQuick(item.url)">
        <view class="quick-icon-wrap" :class="item.tone">
          <text class="quick-icon">{{ item.icon }}</text>
        </view>
        <text class="quick-label">{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useMiniProgramShare } from '@/utils/share'
import type { HomeStatistics } from '@/types'
import { statisticsServiceLocal } from '@/services/statistics.local'
import { trainingPlanServiceLocal } from '@/services/training-plan.local'
import { rpgProgressServiceLocal, type GrowthProfile } from '@/services/rpg-progress.local'

const statistics = ref<HomeStatistics>({
  continuousDays: 0,
  monthCount: 0,
  totalDuration: 0,
  prRecords: [],
  heatMapData: { weekStart: '', days: [] }
})
const todayPlanInfo = ref<any>(null)
const nextPlanInfo = ref<any>(null)
const isLoading = ref(false)
const isNavigating = ref(false)
const growthProfile = ref<GrowthProfile>({
  level: 1,
  experience: 0,
  nextLevelExperience: 250,
  progressPercent: 0,
  title: '待激活训练者',
  questTitle: '今日任务：自由训练',
  questSubtitle: '先建立一次训练基线，后续建议会更准确。',
  rewardText: '完成后预计获得 经验 +60',
  attributes: [
    { label: '力量', value: 8 },
    { label: '耐力', value: 8 },
    { label: '稳定', value: 8 },
    { label: '恢复', value: 72 }
  ]
})

useMiniProgramShare({
  title: 'FitAI 健身记录：训练、计划和进步复盘'
})

const quickActions = [
  { icon: '记', tone: 'primary', label: '记录', url: '/pages/training-record/training-record' },
  { icon: '计', tone: 'default', label: '计划', url: '/pages/plans/plans' },
  { icon: '动', tone: 'default', label: '动作库', url: '/pages/exercises/exercises' },
  { icon: '模', tone: 'default', label: '模板', url: '/pages/templates/templates' },
  { icon: '史', tone: 'default', label: '历史', url: '/pages/history-query/history-query' },
  { icon: '图', tone: 'default', label: '进步', url: '/pages/charts/charts' },
  { icon: '身', tone: 'default', label: '身体', url: '/pages/body-data/body-data' },
  { icon: '食', tone: 'default', label: '饮食', url: '/pages/diet/diet' },
  { icon: 'AI', tone: 'soft', label: 'AI计划', url: '/pages/ai-plan/ai-plan' },
  { icon: '铃', tone: 'soft', label: '提醒', url: '/pages/reminders/reminders' },
  { icon: '我', tone: 'soft', label: '我的', url: '/pages/profile/profile' }
]

const todayText = computed(() => {
  const now = new Date()
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]
  return `${now.getMonth() + 1}月${now.getDate()}日 ${weekday}`
})
const prRecords = computed(() => statistics.value.prRecords || [])
const trainedThisWeek = computed(() => weekDays.value.filter((day) => day.hasTraining).length)
const primaryButtonText = computed(() => {
  if (nextPlanInfo.value && !todayPlanInfo.value) return '查看计划'
  if (!todayPlanInfo.value) return '开始记录'
  return todayPlanInfo.value.day.completed ? '查看记录' : '执行计划'
})
const heroTitle = computed(() => {
  if (todayPlanInfo.value?.day.completed) return '今日训练已完成'
  if (todayPlanInfo.value) return '今日训练已就绪'
  if (nextPlanInfo.value) return '下一次训练已安排'
  return '今天练什么？'
})
const heroSubtitle = computed(() => {
  if (todayPlanInfo.value) return todayPlanInfo.value.day.templateName
  if (nextPlanInfo.value) return `${nextPlanInfo.value.date} · ${nextPlanInfo.value.templateName}`
  return '从计划、模板或临时记录开始，少想一点，多练一点。'
})

const formatDate = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatDuration = (minutes: number) => ((Number(minutes) || 0) / 60).toFixed(1)

const weekDays = computed(() => {
  const days = statistics.value.heatMapData?.days || []
  if (days.length) {
    return days.map((day) => ({
      date: day.date,
      weekday: day.dayLabel.replace('周', ''),
      day: Number(day.date.split('-')[2]),
      hasTraining: day.hasTraining,
      isToday: day.date === formatDate(new Date())
    }))
  }
  const today = new Date()
  const mondayOffset = (today.getDay() || 7) - 1
  return ['一', '二', '三', '四', '五', '六', '日'].map((weekday, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - mondayOffset + index)
    return { date: formatDate(date), weekday, day: date.getDate(), hasTraining: false, isToday: index === mondayOffset }
  })
})

const loadStatistics = async () => {
  if (isLoading.value) return
  try {
    isLoading.value = true
    statistics.value = await statisticsServiceLocal.getHomeStatistics()
  } catch (error) {
    console.error('加载首页数据失败:', error)
    uni.showToast({ title: '首页数据加载失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
  await loadTodayPlan()
  growthProfile.value = await rpgProgressServiceLocal.getHomeGrowthProfile(todayPlanInfo.value)
}

const loadTodayPlan = async () => {
  try {
    const today = formatDate(new Date())
    const plans = await trainingPlanServiceLocal.getPlans()
    const upcoming = plans
      .filter((plan) => plan.status === 'active' && plan._id && plan.nextSession?.date && plan.nextSession.date >= today)
      .sort((a, b) => String(a.nextSession?.date || '').localeCompare(String(b.nextSession?.date || '')))[0]
    nextPlanInfo.value = upcoming?.nextSession
      ? { planId: upcoming._id, planName: upcoming.name, ...upcoming.nextSession }
      : null
    for (const plan of plans) {
      if (plan.status !== 'active' || !plan._id) continue
      const detail = await trainingPlanServiceLocal.getPlanById(plan._id)
      for (const week of detail?.weeklySchedules || []) {
        for (const day of week.dailySchedules || []) {
          if (day.date === today && day.templateId) {
            todayPlanInfo.value = { planId: plan._id, planName: plan.name, week: week.weekNumber, day }
            nextPlanInfo.value = null
            return
          }
        }
      }
    }
    todayPlanInfo.value = null
  } catch (error) {
    console.error('加载今日计划失败:', error)
    todayPlanInfo.value = null
    nextPlanInfo.value = null
  }
}

const primaryAction = () => {
  if (isNavigating.value) return
  isNavigating.value = true
  if (todayPlanInfo.value && !todayPlanInfo.value.day.completed) {
    uni.navigateTo({
      url: `/pages/training-record/training-record?planId=${todayPlanInfo.value.planId}&week=${todayPlanInfo.value.week}&templateId=${todayPlanInfo.value.day.templateId}&date=${todayPlanInfo.value.day.date}`
    })
    return
  }
  if (todayPlanInfo.value?.day.completed && todayPlanInfo.value.day.recordId) {
    uni.navigateTo({ url: `/pages/training-record/training-record?recordId=${todayPlanInfo.value.day.recordId}` })
    return
  }
  if (nextPlanInfo.value?.planId) {
    uni.navigateTo({ url: `/pages/plans/plan-detail?id=${nextPlanInfo.value.planId}` })
    return
  }
  uni.navigateTo({ url: '/pages/training-record/training-record' })
}

const goQuick = (url: string) => {
  if (isNavigating.value) return
  if (url === '/pages/training-record/training-record' && todayPlanInfo.value) {
    primaryAction()
    return
  }
  isNavigating.value = true
  uni.navigateTo({ url })
}

onMounted(loadStatistics)
onShow(() => {
  isNavigating.value = false
  loadStatistics()
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  padding: 24rpx 24rpx 40rpx;
  background: #f3f6f5;
  box-sizing: border-box;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 28rpx;
  padding: 40rpx 36rpx 34rpx;
  border-radius: 28rpx;
  background: linear-gradient(145deg, #101820 0%, #17242d 100%);
  color: #fff;
  box-shadow: 0 18rpx 42rpx rgba(16, 24, 32, .18);
}

.hero-copy {
  min-width: 0;
  flex: 1;
}

.hero-kicker,
.hero-subtitle,
.card-note,
.metric-label,
.pr-rm,
.card-subtitle {
  display: block;
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.45;
}

.hero-kicker,
.hero-subtitle {
  color: rgba(255, 255, 255, .7);
}

.hero-title {
  display: block;
  margin: 12rpx 0 8rpx;
  font-size: 46rpx;
  font-weight: 900;
  line-height: 1.16;
  letter-spacing: 0;
}

.hero-button {
  flex-shrink: 0;
  margin: 0;
  padding: 0 30rpx;
  min-width: 150rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 999rpx;
  background: #22c55e;
  color: #101820;
  font-size: 26rpx;
  font-weight: 900;
  box-shadow: none;
}

.hero-button[disabled],
.mini-btn[disabled] {
  opacity: .62;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
  margin: 18rpx 0;
}

.metric,
.week-card,
.section,
.quick-item {
  background: #fff;
  border: 1rpx solid rgba(226, 232, 240, .9);
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(16, 24, 32, .045);
}

.metric {
  padding: 24rpx 12rpx;
  text-align: center;
}

.metric-value {
  display: block;
  color: #101820;
  font-size: 40rpx;
  font-weight: 900;
  line-height: 1.1;
}

.week-card,
.section {
  margin-bottom: 18rpx;
  padding: 30rpx;
}

.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 20rpx;
}

.card-title {
  display: block;
  color: #101820;
  font-size: 30rpx;
  font-weight: 900;
  line-height: 1.25;
}

.mini-btn {
  flex-shrink: 0;
  margin: 0;
  width: 100rpx;
  height: 58rpx;
  line-height: 58rpx;
  border-radius: 999rpx;
  background: #eef2f4;
  color: #101820;
  font-size: 22rpx;
  font-weight: 900;
}

.home-loading {
  margin-bottom: 16rpx;
  padding: 20rpx 22rpx;
  border-radius: 16rpx;
  background: #f6f8f8;
  color: #64748b;
  font-size: 24rpx;
  line-height: 1.45;
  text-align: center;
}

.growth-section {
  overflow: hidden;
}

.growth-card {
  padding: 26rpx;
  border-radius: 24rpx;
  background: linear-gradient(145deg, #f8fbff 0%, #eef9f5 100%);
  border: 1rpx solid #dbe8f1;
}

.growth-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.growth-label,
.growth-next,
.quest-text,
.quest-reward,
.attribute-label {
  display: block;
}

.growth-label {
  color: #4f637a;
  font-size: 24rpx;
  line-height: 1.35;
  font-weight: 800;
}

.growth-level {
  display: block;
  margin-top: 6rpx;
  color: #101820;
  font-size: 48rpx;
  font-weight: 950;
  line-height: 1.05;
}

.growth-exp {
  flex-shrink: 0;
  min-width: 118rpx;
  padding: 12rpx 16rpx;
  border-radius: 18rpx;
  background: #101820;
  color: #fff;
  text-align: center;
}

.growth-exp text:first-child {
  display: block;
  font-size: 28rpx;
  font-weight: 950;
  line-height: 1.1;
}

.growth-exp text:last-child {
  display: block;
  margin-top: 4rpx;
  color: rgba(255, 255, 255, .72);
  font-size: 18rpx;
  font-weight: 900;
}

.growth-bar {
  height: 14rpx;
  margin-top: 20rpx;
  border-radius: 999rpx;
  overflow: hidden;
  background: #dce7ef;
}

.growth-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4f8cff 0%, #53d7b6 100%);
}

.growth-next {
  margin-top: 10rpx;
  color: #5d6d82;
  font-size: 22rpx;
  line-height: 1.35;
  font-weight: 700;
}

.quest-card {
  display: flex;
  gap: 18rpx;
  margin-top: 22rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: #fff;
  border: 1rpx solid #e1ebf2;
}

.quest-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 58rpx;
  height: 58rpx;
  border-radius: 18rpx;
  background: #4f8cff;
  color: #fff;
  font-size: 26rpx;
  font-weight: 950;
}

.quest-copy {
  min-width: 0;
  flex: 1;
}

.quest-title {
  display: block;
  color: #101820;
  font-size: 28rpx;
  line-height: 1.32;
  font-weight: 950;
}

.quest-text {
  margin-top: 8rpx;
  color: #344154;
  font-size: 24rpx;
  line-height: 1.5;
  font-weight: 700;
}

.quest-reward {
  margin-top: 10rpx;
  color: #16856c;
  font-size: 23rpx;
  line-height: 1.35;
  font-weight: 900;
}

.attribute-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10rpx;
  margin-top: 18rpx;
}

.attribute-item {
  padding: 16rpx 8rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, .72);
  border: 1rpx solid rgba(219, 232, 241, .88);
  text-align: center;
}

.attribute-value {
  display: block;
  color: #101820;
  font-size: 30rpx;
  line-height: 1.1;
  font-weight: 950;
}

.attribute-label {
  margin-top: 6rpx;
  color: #5d6d82;
  font-size: 21rpx;
  line-height: 1.2;
  font-weight: 800;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10rpx;
}

.week-day {
  text-align: center;
}

.weekday {
  display: block;
  margin-bottom: 10rpx;
  color: #64748b;
  font-size: 22rpx;
}

.date-cell {
  width: 70rpx;
  height: 70rpx;
  margin: 0 auto;
  border-radius: 18rpx;
  background: #eef2f4;
  color: #334155;
  line-height: 70rpx;
  font-size: 26rpx;
  font-weight: 800;
}

.date-cell.trained {
  background: #22c55e;
  color: #101820;
}

.date-cell.today {
  background: #fff;
  color: #101820;
  outline: 4rpx solid #101820;
}

.empty {
  padding: 36rpx 20rpx;
  color: #64748b;
  font-size: 26rpx;
  line-height: 1.5;
  text-align: center;
}

.pr-scroll {
  width: 100%;
}

.pr-list {
  display: flex;
  gap: 14rpx;
  padding-bottom: 6rpx;
}

.pr-item {
  flex-shrink: 0;
  width: 214rpx;
  padding: 22rpx;
  border-radius: 18rpx;
  background: #f6f8f8;
  border: 1rpx solid #e2e8f0;
}

.pr-name,
.pr-weight {
  display: block;
}

.pr-name {
  overflow: hidden;
  color: #334155;
  font-size: 24rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.pr-weight {
  margin: 12rpx 0 4rpx;
  color: #101820;
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1.1;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14rpx;
}

.quick-item {
  min-height: 144rpx;
  padding: 18rpx 8rpx;
  text-align: center;
  box-sizing: border-box;
}

.quick-item:active {
  transform: scale(.98);
}

.quick-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  margin: 0 auto;
  border-radius: 20rpx;
  background: #eef2f4;
}

.quick-icon-wrap.primary {
  background: #22c55e;
}

.quick-icon-wrap.soft {
  background: #f0fdf4;
}

.quick-icon {
  display: block;
  color: #101820;
  height: 46rpx;
  font-size: 30rpx;
  line-height: 46rpx;
  font-weight: 900;
}

.quick-label {
  display: block;
  margin-top: 12rpx;
  color: #334155;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.2;
}

</style>

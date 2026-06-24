<template>
  <view class="reminder-page">
    <view class="hero">
      <view class="hero-copy">
        <text class="kicker">提醒中心</text>
        <text class="title">{{ missedSessions.length ? `${missedSessions.length} 次训练待补记` : '训练节奏正常' }}</text>
        <text class="subtitle">{{ heroSubtitle }}</text>
      </view>
      <button class="hero-btn" :disabled="isChecking" @click="checkNow">{{ isChecking ? '检查中' : '检查' }}</button>
    </view>

    <view class="summary-grid">
      <view class="summary-item">
        <text class="summary-value">{{ missedSessions.length }}</text>
        <text class="summary-label">待补记</text>
      </view>
      <view class="summary-item">
        <text class="summary-value">{{ settings.missedPlanReminder.enabled ? '开' : '关' }}</text>
        <text class="summary-label">逾期提醒</text>
      </view>
      <view class="summary-item">
        <text class="summary-value">{{ settings.missedPlanReminder.subscribed ? '已开' : '未开' }}</text>
        <text class="summary-label">微信订阅</text>
      </view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <view>
          <text class="panel-title">待办补记</text>
          <text class="panel-desc">计划里过期但没完成的训练，会集中出现在这里。</text>
        </view>
        <switch :checked="settings.missedPlanReminder.enabled" color="#101820" @change="onMissedPlanReminderChange" />
      </view>

      <view v-if="missedSessions.length === 0" class="empty">
        <text class="empty-title">没有漏练记录</text>
        <text class="empty-desc">当计划训练过了日期还没记录时，这里会显示补记入口。</text>
      </view>

      <view v-else class="missed-list">
        <view v-for="session in missedSessions.slice(0, 8)" :key="`${session.planId}-${session.date}-${session.templateId}`" class="missed-card">
          <view class="date-badge">
            <text class="date-day">{{ session.date.slice(8, 10) }}</text>
            <text class="date-month">{{ Number(session.date.slice(5, 7)) }}月</text>
          </view>
          <view class="missed-copy">
            <text class="missed-name">{{ session.templateName }}</text>
            <text class="missed-meta">{{ session.planName }} · 第 {{ session.weekNumber }} 周</text>
          </view>
          <button class="record-btn" :disabled="activeSessionKey === sessionKey(session)" @click="recordSession(session)">
            {{ activeSessionKey === sessionKey(session) ? '打开中' : (session.templateId ? '补记' : '去计划') }}
          </button>
        </view>
      </view>
    </view>

    <view class="panel subscribe-panel">
      <view class="panel-head compact">
        <view>
          <text class="panel-title">微信消息提醒</text>
          <text class="panel-desc">模板 ID 已配置，可直接申请授权。</text>
        </view>
        <text class="status-pill" :class="{ active: settings.missedPlanReminder.subscribed }">
          {{ settings.missedPlanReminder.subscribed ? '已授权' : '待授权' }}
        </text>
      </view>

      <view class="template-box">
        <text class="template-label">订阅模板</text>
        <text class="template-id">{{ shortTemplateId }}</text>
      </view>

      <button class="subscribe-btn" :disabled="isSubscribing" @click="requestSubscribe">
        {{ isSubscribing ? '申请中...' : (settings.missedPlanReminder.subscribed ? '重新申请授权' : '开启微信提醒') }}
      </button>
      <text class="fine-print">微信要求用户主动授权；真正离线推送还需要后续接云函数定时发送。</text>
    </view>

    <view class="panel">
      <view class="panel-head">
        <view>
          <text class="panel-title">提醒时间</text>
          <text class="panel-desc">先保存你的训练习惯，后续云端推送会按这个时间发。</text>
        </view>
        <switch :checked="settings.dailyReminder.enabled" color="#101820" @change="onDailyReminderChange" />
      </view>
      <view class="time-control">
        <picker mode="time" :value="settings.dailyReminder.time" @change="onTimeChange">
          <view class="time-picker">{{ settings.dailyReminder.time }}</view>
        </picker>
        <button class="ghost-btn" :disabled="isSaving" @click="saveSettings">{{ isSaving ? '保存中' : '保存' }}</button>
      </view>
    </view>

    <view class="save-bar">
      <button class="save-btn" :disabled="isSaving" @click="saveSettings">{{ isSaving ? '保存中...' : '保存提醒设置' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { MISSED_TRAINING_TEMPLATE_ID, reminderServiceLocal, type LocalReminderSettings } from '@/services/reminder.local'
import type { MissedPlanSession } from '@/services/training-plan.local'
import { useMiniProgramShare } from '@/utils/share'

useMiniProgramShare({
  title: 'FitAI 健身记录：别漏掉计划训练'
})

const settings = reactive<LocalReminderSettings>({
  dailyReminder: { enabled: false, time: '19:00' },
  threeDayReminder: { enabled: false },
  missedPlanReminder: { enabled: true, templateId: MISSED_TRAINING_TEMPLATE_ID, subscribed: false },
  updatedAt: new Date().toISOString()
})
const missedSessions = ref<MissedPlanSession[]>([])
const isSaving = ref(false)
const isChecking = ref(false)
const isSubscribing = ref(false)
const activeSessionKey = ref('')

const heroSubtitle = computed(() => {
  if (missedSessions.value.length) return '建议先补记最近一次训练，计划进度会自动跟上。'
  return settings.missedPlanReminder.subscribed ? '微信订阅已授权，打开小程序也会检查漏练。' : '可以开启微信订阅，让提醒能力更完整。'
})

const shortTemplateId = computed(() => {
  const id = settings.missedPlanReminder.templateId || MISSED_TRAINING_TEMPLATE_ID
  return `${id.slice(0, 8)}…${id.slice(-8)}`
})

const load = async () => {
  const saved = await reminderServiceLocal.getSettings()
  Object.assign(settings, saved)
  if (!settings.missedPlanReminder.templateId) settings.missedPlanReminder.templateId = MISSED_TRAINING_TEMPLATE_ID
  missedSessions.value = await reminderServiceLocal.getMissedSessions()
}

const saveSettings = async () => {
  if (isSaving.value) return
  try {
    isSaving.value = true
    await reminderServiceLocal.saveSettings(settings)
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (error: any) {
    uni.showToast({ title: error?.message || '保存失败', icon: 'none' })
  } finally {
    isSaving.value = false
  }
}

const checkNow = async () => {
  if (isChecking.value) return
  try {
    isChecking.value = true
    await reminderServiceLocal.saveSettings(settings)
    missedSessions.value = await reminderServiceLocal.getMissedSessions()
    uni.showToast({
      title: missedSessions.value.length ? `发现 ${missedSessions.value.length} 条待补记` : '没有漏练计划',
      icon: 'none'
    })
  } catch (error: any) {
    uni.showToast({ title: error?.message || '检查失败', icon: 'none' })
  } finally {
    isChecking.value = false
  }
}

const requestSubscribe = async () => {
  if (isSubscribing.value) return
  try {
    isSubscribing.value = true
    const accepted = await reminderServiceLocal.requestMissedPlanSubscribe(settings.missedPlanReminder.templateId)
    settings.missedPlanReminder.subscribed = accepted
    settings.missedPlanReminder.templateId = settings.missedPlanReminder.templateId || MISSED_TRAINING_TEMPLATE_ID
    await reminderServiceLocal.saveSettings(settings)
    uni.showToast({ title: accepted ? '订阅成功' : '未授权订阅', icon: 'none' })
  } catch (error: any) {
    uni.showToast({ title: error?.message || '订阅失败', icon: 'none' })
  } finally {
    isSubscribing.value = false
  }
}

const onMissedPlanReminderChange = (event: any) => {
  settings.missedPlanReminder.enabled = event.detail.value
}

const onDailyReminderChange = (event: any) => {
  settings.dailyReminder.enabled = event.detail.value
}

const onTimeChange = (event: any) => {
  settings.dailyReminder.time = event.detail.value
}

const sessionKey = (session: MissedPlanSession) => `${session.planId}-${session.date}-${session.templateId || 'plan'}`

const recordSession = (session: MissedPlanSession) => {
  const key = sessionKey(session)
  if (activeSessionKey.value) return
  activeSessionKey.value = key
  if (!session.templateId) {
    uni.navigateTo({ url: '/pages/plans/plans' })
    return
  }
  uni.navigateTo({
    url: `/pages/training-record/training-record?planId=${encodeURIComponent(session.planId)}&week=${session.weekNumber}&templateId=${encodeURIComponent(session.templateId)}&date=${encodeURIComponent(session.date)}`
  })
}

onMounted(load)
onShow(() => {
  activeSessionKey.value = ''
  load()
})
</script>

<style lang="scss" scoped>
.reminder-page { min-height: 100vh; padding: 24rpx 24rpx 140rpx; background: #f4f6f8; box-sizing: border-box; }
.hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24rpx; padding: 36rpx; border-radius: 16rpx; background: #101820; color: #fff; }
.hero-copy { min-width: 0; flex: 1; }
.kicker, .subtitle, .panel-desc, .summary-label, .missed-meta, .fine-print, .template-label { display: block; color: #718096; font-size: 23rpx; line-height: 1.45; }
.kicker, .subtitle { color: rgba(255,255,255,.72); }
.title { display: block; margin: 10rpx 0; color: #fff; font-size: 42rpx; font-weight: 800; line-height: 1.2; }
.hero-btn { flex-shrink: 0; margin: 0; width: 112rpx; height: 72rpx; line-height: 72rpx; border-radius: 36rpx; background: #22c55e; color: #101820; font-size: 26rpx; font-weight: 800; }
.hero-btn[disabled], .record-btn[disabled], .subscribe-btn[disabled], .ghost-btn[disabled], .save-btn[disabled] { opacity: .65; }
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; margin: 20rpx 0; }
.summary-item { padding: 24rpx 12rpx; border-radius: 12rpx; background: #fff; text-align: center; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
.summary-value { display: block; color: #101820; font-size: 36rpx; font-weight: 900; }
.panel { margin-top: 20rpx; padding: 28rpx; border-radius: 12rpx; background: #fff; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin-bottom: 16rpx; }
.panel-head.compact { align-items: flex-start; }
.panel-title { display: block; color: #101820; font-size: 30rpx; font-weight: 800; }
.empty { padding: 36rpx 10rpx; text-align: center; }
.empty-title { display: block; color: #101820; font-size: 28rpx; font-weight: 800; }
.empty-desc { display: block; margin-top: 8rpx; color: #718096; font-size: 23rpx; }
.missed-card { display: flex; align-items: center; gap: 18rpx; padding: 20rpx 0; border-top: 1rpx solid #edf2f7; }
.missed-card:first-child { border-top: 0; }
.date-badge { flex-shrink: 0; width: 76rpx; height: 76rpx; border-radius: 14rpx; background: #ecfdf5; text-align: center; }
.date-day { display: block; margin-top: 8rpx; color: #101820; font-size: 30rpx; font-weight: 900; line-height: 1; }
.date-month { color: #16a34a; font-size: 20rpx; font-weight: 800; }
.missed-copy { min-width: 0; flex: 1; }
.missed-name { display: block; overflow: hidden; color: #101820; font-size: 28rpx; font-weight: 800; white-space: nowrap; text-overflow: ellipsis; }
.record-btn { flex-shrink: 0; margin: 0; width: 116rpx; height: 60rpx; line-height: 60rpx; border-radius: 30rpx; background: #101820; color: #fff; font-size: 24rpx; font-weight: 800; }
.subscribe-panel { border: 2rpx solid rgba(34,197,94,.28); }
.status-pill { flex-shrink: 0; padding: 8rpx 16rpx; border-radius: 999rpx; background: #edf2f7; color: #4a5568; font-size: 22rpx; font-weight: 800; }
.status-pill.active { background: #dcfce7; color: #166534; }
.template-box { margin-top: 16rpx; padding: 18rpx 20rpx; border-radius: 12rpx; background: #f8fafc; }
.template-id { display: block; margin-top: 6rpx; color: #101820; font-size: 26rpx; font-weight: 800; }
.subscribe-btn { margin-top: 18rpx; height: 80rpx; line-height: 80rpx; border-radius: 40rpx; background: #22c55e; color: #101820; font-size: 28rpx; font-weight: 900; }
.fine-print { margin-top: 12rpx; }
.time-control { display: flex; gap: 16rpx; align-items: center; }
.time-picker { min-width: 180rpx; height: 76rpx; padding: 0 20rpx; border-radius: 12rpx; background: #f8fafc; color: #101820; font-size: 30rpx; font-weight: 800; line-height: 76rpx; text-align: center; }
.ghost-btn { flex: 1; height: 76rpx; line-height: 76rpx; border-radius: 38rpx; background: #edf2f7; color: #101820; font-size: 26rpx; font-weight: 800; }
.save-bar { position: fixed; left: 0; right: 0; bottom: 0; padding: 18rpx 24rpx 28rpx; background: rgba(255,255,255,.96); box-shadow: 0 -8rpx 24rpx rgba(16,24,32,.08); }
.save-btn { height: 88rpx; line-height: 88rpx; border-radius: 44rpx; background: #101820; color: #fff; font-size: 30rpx; font-weight: 800; }
</style>

<template>
  <view class="ai-plan-page">
    <view class="hero">
      <text class="hero-kicker">AI训练计划</text>
      <text class="hero-title">输入目标，生成一套可执行计划</text>
      <text class="hero-subtitle">当前为本地规则版，后续可接入真正 AI 生成更个性化内容。</text>
    </view>

    <view class="panel">
      <text class="panel-title">训练目标</text>
      <view class="segmented">
        <view v-for="item in goalOptions" :key="item.value" class="seg-item" :class="{ active: form.goal === item.value }" @click="form.goal = item.value">
          {{ item.label }}
        </view>
      </view>

      <view class="field-grid">
        <view class="field">
          <text class="label">训练地点</text>
          <picker :range="placeOptions" range-key="label" :value="placeIndex" @change="onPlaceChange">
            <view class="picker">{{ placeOptions[placeIndex].label }}</view>
          </picker>
        </view>
        <view class="field">
          <text class="label">训练经验</text>
          <picker :range="levelOptions" range-key="label" :value="levelIndex" @change="onLevelChange">
            <view class="picker">{{ levelOptions[levelIndex].label }}</view>
          </picker>
        </view>
      </view>

      <view class="field-grid">
        <view class="field">
          <text class="label">每周训练</text>
          <picker :range="dayOptions" :value="dayIndex" @change="onDayChange">
            <view class="picker">每周 {{ form.weeklyDays }} 天</view>
          </picker>
        </view>
        <view class="field">
          <text class="label">每次时长</text>
          <picker :range="durationOptions" :value="durationIndex" @change="onDurationChange">
            <view class="picker">{{ form.duration }} 分钟</view>
          </picker>
        </view>
      </view>

      <view class="field-grid">
        <view class="field">
          <text class="label">开始日期</text>
          <picker mode="date" :value="form.startDate" @change="onStartDateChange">
            <view class="picker">{{ form.startDate }}</view>
          </picker>
        </view>
        <view class="field">
          <text class="label">计划周期</text>
          <picker :range="weekOptions" :value="weekIndex" @change="onWeekChange">
            <view class="picker">{{ form.weeks }} 周</view>
          </picker>
        </view>
      </view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <view>
          <text class="panel-title">{{ preview.name }}</text>
          <text class="panel-note">{{ preview.description }}</text>
        </view>
        <button class="mini-btn" :disabled="isCreating" @click="refreshPreview">重生成</button>
      </view>

      <view class="plan-days">
        <view v-for="(day, index) in preview.days" :key="`${day.name}-${index}`" class="plan-day">
          <view class="day-index">{{ index + 1 }}</view>
          <view class="day-content">
            <text class="day-name">{{ day.name }}</text>
            <text class="day-focus">{{ day.focus }}</text>
            <view class="action-tags">
              <text v-for="action in day.actions" :key="action" class="action-tag">{{ action }}</text>
            </view>
            <text class="day-advice">{{ day.advice }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="save-bar">
      <button class="save-btn" :disabled="isCreating" @click="createPlan">{{ isCreating ? '生成中...' : '生成并保存计划' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { aiPlanServiceLocal, type AiPlanForm, type AiPlanPreview, type PlanGoal, type PlanLevel, type PlanPlace } from '@/services/ai-plan.local'

const goalOptions: { label: string; value: PlanGoal }[] = [
  { label: '增肌', value: 'muscle' },
  { label: '减脂', value: 'fatLoss' },
  { label: '塑形', value: 'shape' },
  { label: '力量', value: 'strength' }
]
const placeOptions: { label: string; value: PlanPlace }[] = [
  { label: '健身房', value: 'gym' },
  { label: '家里', value: 'home' }
]
const levelOptions: { label: string; value: PlanLevel }[] = [
  { label: '新手', value: 'beginner' },
  { label: '中级', value: 'intermediate' },
  { label: '高级', value: 'advanced' }
]
const dayOptions = [1, 2, 3, 4, 5, 6, 7]
const durationOptions = [30, 60, 90]
const weekOptions = [4, 6, 8, 12]

const form = reactive<AiPlanForm>({
  goal: 'muscle',
  place: 'gym',
  level: 'beginner',
  weeklyDays: 3,
  duration: 60,
  startDate: new Date().toISOString().split('T')[0],
  weeks: 8
})
const preview = ref<AiPlanPreview>(aiPlanServiceLocal.generatePreview(form))
const isCreating = ref(false)

const placeIndex = computed(() => Math.max(0, placeOptions.findIndex((item) => item.value === form.place)))
const levelIndex = computed(() => Math.max(0, levelOptions.findIndex((item) => item.value === form.level)))
const dayIndex = computed(() => Math.max(0, dayOptions.findIndex((item) => item === form.weeklyDays)))
const durationIndex = computed(() => Math.max(0, durationOptions.findIndex((item) => item === form.duration)))
const weekIndex = computed(() => Math.max(0, weekOptions.findIndex((item) => item === form.weeks)))

const refreshPreview = () => {
  if (isCreating.value) return
  preview.value = aiPlanServiceLocal.generatePreview(form)
}

const onPlaceChange = (event: any) => {
  form.place = placeOptions[Number(event.detail.value)].value
}
const onLevelChange = (event: any) => {
  form.level = levelOptions[Number(event.detail.value)].value
}
const onDayChange = (event: any) => {
  form.weeklyDays = dayOptions[Number(event.detail.value)]
}
const onDurationChange = (event: any) => {
  form.duration = durationOptions[Number(event.detail.value)]
}
const onWeekChange = (event: any) => {
  form.weeks = weekOptions[Number(event.detail.value)]
}
const onStartDateChange = (event: any) => {
  form.startDate = event.detail.value
}

const createPlan = async () => {
  if (isCreating.value) return
  try {
    isCreating.value = true
    uni.showLoading({ title: '生成中' })
    await aiPlanServiceLocal.createPlanFromPreview(form, preview.value)
    uni.hideLoading()
    uni.showToast({ title: '计划已保存', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: '/pages/plans/plans' }), 900)
  } catch (error: any) {
    uni.hideLoading()
    uni.showToast({ title: error?.message || '生成失败', icon: 'none' })
    isCreating.value = false
  }
}

watch(form, refreshPreview, { deep: true })
</script>

<style lang="scss" scoped>
.ai-plan-page { min-height: 100vh; padding: 24rpx 24rpx 140rpx; background: #f4f6f8; box-sizing: border-box; }
.hero { margin-bottom: 20rpx; padding: 36rpx; border-radius: 16rpx; background: #101820; color: #fff; }
.hero-kicker, .hero-subtitle, .panel-note, .label, .day-focus, .day-advice { display: block; color: #718096; font-size: 23rpx; line-height: 1.45; }
.hero-kicker, .hero-subtitle { color: rgba(255,255,255,.72); }
.hero-title { display: block; margin: 10rpx 0; color: #fff; font-size: 42rpx; font-weight: 900; line-height: 1.2; }
.panel { margin-bottom: 20rpx; padding: 28rpx; border-radius: 12rpx; background: #fff; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
.panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18rpx; margin-bottom: 20rpx; }
.panel-title { display: block; color: #101820; font-size: 30rpx; font-weight: 900; }
.segmented { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10rpx; margin-top: 18rpx; padding: 8rpx; border-radius: 12rpx; background: #edf2f7; }
.seg-item { height: 64rpx; border-radius: 10rpx; color: #4a5568; font-size: 24rpx; font-weight: 800; line-height: 64rpx; text-align: center; }
.seg-item.active { background: #101820; color: #fff; }
.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18rpx; margin-top: 22rpx; }
.picker { width: 100%; min-height: 76rpx; padding: 0 20rpx; border-radius: 10rpx; background: #f8fafc; color: #101820; font-size: 27rpx; font-weight: 800; line-height: 76rpx; box-sizing: border-box; }
.mini-btn { flex-shrink: 0; margin: 0; width: 112rpx; height: 60rpx; line-height: 60rpx; border-radius: 30rpx; background: #edf2f7; color: #101820; font-size: 23rpx; font-weight: 900; }
.mini-btn[disabled], .save-btn[disabled] { opacity: .65; }
.plan-days { display: flex; flex-direction: column; gap: 16rpx; }
.plan-day { display: flex; gap: 18rpx; padding: 20rpx; border-radius: 12rpx; background: #f8fafc; }
.day-index { flex-shrink: 0; width: 52rpx; height: 52rpx; border-radius: 16rpx; background: #22c55e; color: #101820; font-size: 26rpx; font-weight: 900; line-height: 52rpx; text-align: center; }
.day-content { min-width: 0; flex: 1; }
.day-name { display: block; color: #101820; font-size: 28rpx; font-weight: 900; }
.action-tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin: 14rpx 0; }
.action-tag { max-width: 210rpx; padding: 8rpx 12rpx; border-radius: 999rpx; background: #fff; color: #2d3748; font-size: 22rpx; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.save-bar { position: fixed; left: 0; right: 0; bottom: 0; padding: 18rpx 24rpx 28rpx; background: rgba(255,255,255,.96); box-shadow: 0 -8rpx 24rpx rgba(16,24,32,.08); }
.save-btn { height: 88rpx; line-height: 88rpx; border-radius: 44rpx; background: #101820; color: #fff; font-size: 30rpx; font-weight: 900; }
</style>

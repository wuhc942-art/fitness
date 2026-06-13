<template>
  <view class="body-page">
    <view class="hero">
      <view>
        <text class="hero-kicker">身体数据</text>
        <text class="hero-title">{{ latestRecord ? `${latestRecord.weight}kg` : '记录身体变化' }}</text>
        <text class="hero-subtitle">{{ goalSummary }}</text>
      </view>
      <view v-if="bmi > 0" class="bmi-box">
        <text class="bmi-value">{{ bmi.toFixed(1) }}</text>
        <text class="bmi-label">BMI · {{ getBmiStatus(bmi) }}</text>
      </view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">基础档案</text>
        <button class="mini-btn" :disabled="isSavingProfile" @click="() => saveProfile()">
          {{ isSavingProfile ? '保存中' : '保存' }}
        </button>
      </view>
      <view class="field-grid">
        <view class="field">
          <text class="label">性别</text>
          <picker :range="genderOptions" range-key="label" :value="genderIndex" @change="onGenderChange">
            <view class="picker">{{ genderOptions[genderIndex].label }}</view>
          </picker>
        </view>
        <view class="field">
          <text class="label">年龄</text>
          <input type="number" v-model="profile.age" placeholder="28" />
        </view>
      </view>
      <view class="field-grid">
        <view class="field">
          <text class="label">身高 cm</text>
          <input type="digit" v-model="profile.height" placeholder="175" />
        </view>
        <view class="field">
          <text class="label">目标体重 kg</text>
          <input type="digit" v-model="profile.targetWeight" placeholder="70" />
        </view>
      </view>
      <view class="goal-row">
        <view v-for="item in goalOptions" :key="item.value" class="goal-chip" :class="{ active: profile.goal === item.value }" @click="profile.goal = item.value">
          {{ item.label }}
        </view>
      </view>
    </view>

    <view v-if="latestRecord && Number(profile.targetWeight)" class="target-card">
      <view>
        <text class="target-title">目标进度</text>
        <text class="target-desc">{{ targetText }}</text>
      </view>
      <text class="target-value">{{ Math.abs(Number(latestRecord.weight) - Number(profile.targetWeight)).toFixed(1) }}kg</text>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">{{ editingDate ? '编辑身体数据' : '今日身体记录' }}</text>
        <text class="panel-note">同一天保存会覆盖更新</text>
      </view>
      <view class="field">
        <text class="label">日期</text>
        <picker mode="date" :value="formData.date" @change="onDateChange">
          <view class="picker">{{ formData.date }}</view>
        </picker>
      </view>
      <view class="field-grid">
        <view class="field">
          <text class="label">身高 cm</text>
          <input type="digit" v-model="formData.height" placeholder="175" />
        </view>
        <view class="field">
          <text class="label">体重 kg</text>
          <input type="digit" v-model="formData.weight" placeholder="70" />
        </view>
      </view>
      <view class="field-grid">
        <view class="field">
          <text class="label">体脂 %</text>
          <input type="digit" v-model="formData.bodyFat" placeholder="可选" />
        </view>
        <view class="field">
          <text class="label">腰围 cm</text>
          <input type="digit" v-model="formData.waist" placeholder="可选" />
        </view>
      </view>
      <view class="field-grid">
        <view class="field">
          <text class="label">胸围 cm</text>
          <input type="digit" v-model="extra.chest" placeholder="可选" />
        </view>
        <view class="field">
          <text class="label">臀围 cm</text>
          <input type="digit" v-model="extra.hip" placeholder="可选" />
        </view>
      </view>
      <view class="field-grid">
        <view class="field">
          <text class="label">手臂 cm</text>
          <input type="digit" v-model="formData.arm" placeholder="可选" />
        </view>
        <view class="field">
          <text class="label">睡眠 小时</text>
          <input type="digit" v-model="formData.sleep" placeholder="可选" />
        </view>
      </view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">历史记录</text>
        <text class="view-all" @click="showAllHistory = !showAllHistory">{{ showAllHistory ? '收起' : '查看全部' }}</text>
      </view>
      <view v-if="displayHistory.length === 0" class="empty">暂无身体数据</view>
      <view v-else class="history-list">
        <view v-for="record in displayHistory" :key="record._id" class="history-card" @click="loadRecord(record)">
          <view>
            <text class="history-date">{{ record.date }}</text>
            <text class="history-meta">点击可编辑</text>
          </view>
          <view class="history-values">
            <text>{{ record.weight }}kg</text>
            <text v-if="record.bodyFat">{{ record.bodyFat }}%</text>
            <text v-if="record.waist">{{ record.waist }}cm</text>
          </view>
        </view>
      </view>
    </view>

    <view class="save-bar">
      <button v-if="editingDate" class="delete-btn" :disabled="isDeletingRecord || isSavingRecord" @click="confirmDeleteRecord">
        {{ isDeletingRecord ? '删除中' : '删除' }}
      </button>
      <button class="save-btn" :disabled="isSavingRecord || isDeletingRecord" @click="saveRecord">
        {{ isSavingRecord ? '保存中...' : (editingDate ? '保存修改' : '保存身体数据') }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { BodyDataForm, BodyDataRecord } from '@/types/body-data'
import { getCurrentDate } from '@/utils/date'
import { bodyDataServiceLocal } from '@/services/body-data.local'
import { bodyProfileServiceLocal, type BodyProfile, type FitnessGoal, type Gender } from '@/services/body-profile.local'

const genderOptions: { label: string; value: Gender }[] = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
  { label: '其他', value: 'other' }
]
const goalOptions: { label: string; value: FitnessGoal }[] = [
  { label: '增肌', value: 'muscle' },
  { label: '减脂', value: 'fatLoss' },
  { label: '塑形', value: 'shape' },
  { label: '力量', value: 'strength' }
]

const profile = reactive<BodyProfile>({
  gender: 'male',
  age: '',
  height: '',
  targetWeight: '',
  goal: 'muscle',
  updatedAt: ''
})
const formData = reactive<BodyDataForm>({
  date: getCurrentDate(),
  height: 0,
  weight: 0,
  bodyFat: undefined,
  waist: undefined,
  arm: undefined,
  sleep: undefined,
  water: undefined
})
const extra = reactive({ chest: '', hip: '' })
const historyList = ref<BodyDataRecord[]>([])
const showAllHistory = ref(false)
const editingDate = ref('')
const isSavingProfile = ref(false)
const isSavingRecord = ref(false)
const isDeletingRecord = ref(false)

const genderIndex = computed(() => Math.max(0, genderOptions.findIndex((item) => item.value === profile.gender)))
const latestRecord = computed(() => historyList.value[0])
const displayHistory = computed(() => showAllHistory.value ? historyList.value : historyList.value.slice(0, 5))
const bmi = computed(() => {
  const height = Number(formData.height || profile.height) / 100
  const weight = Number(formData.weight || latestRecord.value?.weight)
  return height > 0 && weight > 0 ? weight / (height * height) : 0
})
const goalSummary = computed(() => {
  const goalName = goalOptions.find((item) => item.value === profile.goal)?.label || '目标'
  if (!latestRecord.value) return `${goalName} · 先记录一次体重`
  if (!Number(profile.targetWeight)) return `${goalName} · 当前 ${latestRecord.value.weight}kg`
  return `${goalName} · 目标 ${profile.targetWeight}kg`
})
const targetText = computed(() => {
  if (!latestRecord.value || !Number(profile.targetWeight)) return ''
  const diff = Number(latestRecord.value.weight) - Number(profile.targetWeight)
  if (Math.abs(diff) < 0.2) return '已接近目标体重'
  return diff > 0 ? '距离目标还需下降' : '距离目标还需增加'
})

const loadProfile = async () => {
  Object.assign(profile, await bodyProfileServiceLocal.getProfile())
  if (Number(profile.height) && !Number(formData.height)) formData.height = Number(profile.height)
}
const loadHistory = async () => {
  historyList.value = await bodyDataServiceLocal.getRecords()
  if (!Number(formData.weight) && latestRecord.value) {
    formData.height = latestRecord.value.height
    formData.weight = latestRecord.value.weight
  }
}
const onGenderChange = (event: any) => {
  profile.gender = genderOptions[Number(event.detail.value)].value
}
const resetBodyFormForDate = (date: string) => {
  editingDate.value = ''
  formData.date = date
  formData.height = Number(profile.height) || latestRecord.value?.height || 0
  formData.weight = latestRecord.value?.weight || 0
  formData.bodyFat = undefined
  formData.waist = undefined
  extra.chest = ''
  extra.hip = ''
  formData.arm = undefined
  formData.sleep = undefined
  formData.water = undefined
}
const onDateChange = (event: any) => {
  const date = event.detail.value
  const existing = historyList.value.find((record) => record.date === date)
  if (existing) {
    loadRecord(existing)
    return
  }
  resetBodyFormForDate(date)
}
const normalizeOptional = (value: any) => {
  const num = Number(value)
  return num > 0 ? num : undefined
}
const loadRecord = (record: BodyDataRecord) => {
  editingDate.value = record.date
  formData.date = record.date
  formData.height = record.height
  formData.weight = record.weight
  formData.bodyFat = record.bodyFat
  formData.waist = record.waist
  extra.chest = record.chest ? String(record.chest) : ''
  extra.hip = record.hip ? String(record.hip) : ''
  formData.arm = record.arm
  formData.sleep = record.sleep
  formData.water = record.water
  uni.showToast({ title: '已加载，可修改后保存', icon: 'none' })
}
const getBmiStatus = (value: number) => {
  if (value < 18.5) return '偏瘦'
  if (value < 24) return '正常'
  if (value < 28) return '偏胖'
  return '肥胖'
}
const saveProfile = async (silent = false) => {
  if (isSavingProfile.value) return
  try {
    isSavingProfile.value = true
    await bodyProfileServiceLocal.saveProfile(profile)
    if (Number(profile.height)) formData.height = Number(profile.height)
    if (!silent) uni.showToast({ title: '档案已保存', icon: 'success' })
  } catch (error: any) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  } finally {
    isSavingProfile.value = false
  }
}
const saveRecord = async () => {
  if (isSavingRecord.value || isDeletingRecord.value) return
  if (!formData.date || Number(formData.height) <= 0 || Number(formData.weight) <= 0) {
    uni.showToast({ title: '请填写日期、身高和体重', icon: 'none' })
    return
  }
  try {
    isSavingRecord.value = true
    await bodyDataServiceLocal.saveRecord({
      date: formData.date,
      height: Number(formData.height),
      weight: Number(formData.weight),
      bodyFat: normalizeOptional(formData.bodyFat),
      waist: normalizeOptional(formData.waist),
      chest: normalizeOptional(extra.chest),
      hip: normalizeOptional(extra.hip),
      arm: normalizeOptional(formData.arm),
      sleep: normalizeOptional(formData.sleep),
      water: normalizeOptional(formData.water)
    })
    if (!Number(profile.height)) profile.height = Number(formData.height)
    await saveProfile(true)
    editingDate.value = ''
    await loadHistory()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error: any) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  } finally {
    isSavingRecord.value = false
  }
}

const confirmDeleteRecord = () => {
  if (isDeletingRecord.value || isSavingRecord.value) return
  const record = historyList.value.find((item) => item.date === editingDate.value)
  if (!record?._id) return
  uni.showModal({
    title: '删除身体数据',
    content: `确定删除 ${record.date} 的身体记录吗？`,
    success: async (res) => {
      if (!res.confirm || !record._id) return
      try {
        isDeletingRecord.value = true
        await bodyDataServiceLocal.deleteRecord(record._id)
        await loadHistory()
        resetBodyFormForDate(getCurrentDate())
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (error: any) {
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
      } finally {
        isDeletingRecord.value = false
      }
    }
  })
}

onMounted(async () => {
  await loadProfile()
  await loadHistory()
})
</script>

<style lang="scss" scoped>
.body-page { min-height: 100vh; padding: 24rpx 24rpx 140rpx; background: #f4f6f8; box-sizing: border-box; }
.hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24rpx; margin-bottom: 20rpx; padding: 36rpx; border-radius: 16rpx; background: #101820; color: #fff; }
.hero-kicker, .hero-subtitle, .panel-note, .label, .history-meta { display: block; color: #718096; font-size: 22rpx; line-height: 1.45; }
.hero-kicker, .hero-subtitle { color: rgba(255,255,255,.72); }
.hero-title { display: block; margin: 10rpx 0; color: #fff; font-size: 44rpx; font-weight: 900; line-height: 1.2; }
.bmi-box { flex-shrink: 0; text-align: right; }
.bmi-value { display: block; color: #22c55e; font-size: 52rpx; font-weight: 900; }
.bmi-label { color: rgba(255,255,255,.72); font-size: 21rpx; }
.panel, .target-card { margin-bottom: 20rpx; padding: 28rpx; border-radius: 12rpx; background: #fff; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin-bottom: 18rpx; }
.panel-title { color: #101820; font-size: 30rpx; font-weight: 900; }
.mini-btn { flex-shrink: 0; margin: 0; width: 104rpx; height: 58rpx; line-height: 58rpx; border-radius: 29rpx; background: #101820; color: #fff; font-size: 23rpx; font-weight: 900; }
.mini-btn[disabled] { background: #4a5568; color: rgba(255,255,255,.72); }
.field { margin-top: 20rpx; }
.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18rpx; }
input, .picker { width: 100%; min-height: 76rpx; padding: 0 20rpx; border-radius: 10rpx; background: #f8fafc; color: #101820; font-size: 28rpx; box-sizing: border-box; }
.picker { line-height: 76rpx; }
.goal-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10rpx; margin-top: 22rpx; padding: 8rpx; border-radius: 12rpx; background: #edf2f7; }
.goal-chip { height: 60rpx; border-radius: 10rpx; color: #4a5568; font-size: 23rpx; font-weight: 800; line-height: 60rpx; text-align: center; }
.goal-chip.active { background: #101820; color: #fff; }
.target-card { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; background: #ecfdf5; }
.target-title { display: block; color: #166534; font-size: 28rpx; font-weight: 900; }
.target-desc { display: block; margin-top: 8rpx; color: #4a5568; font-size: 23rpx; }
.target-value { flex-shrink: 0; color: #101820; font-size: 40rpx; font-weight: 900; }
.view-all { color: #101820; font-size: 22rpx; font-weight: 900; }
.empty { padding: 44rpx 0; color: #718096; font-size: 26rpx; text-align: center; }
.history-list { display: flex; flex-direction: column; gap: 14rpx; }
.history-card { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; padding: 20rpx; border-radius: 12rpx; background: #f8fafc; }
.history-date { display: block; color: #101820; font-size: 28rpx; font-weight: 800; }
.history-values { display: flex; flex-direction: column; align-items: flex-end; gap: 4rpx; color: #2d3748; font-size: 24rpx; font-weight: 700; }
.save-bar { position: fixed; left: 0; right: 0; bottom: 0; display: flex; gap: 16rpx; padding: 18rpx 24rpx 28rpx; background: rgba(255,255,255,.96); box-shadow: 0 -8rpx 24rpx rgba(16,24,32,.08); }
.save-btn, .delete-btn { flex: 1; height: 88rpx; line-height: 88rpx; border-radius: 44rpx; font-size: 30rpx; font-weight: 900; }
.save-btn { background: #101820; color: #fff; }
.delete-btn { max-width: 180rpx; background: #fee2e2; color: #dc2626; }
.save-btn[disabled] { background: #4a5568; color: rgba(255,255,255,.72); }
.delete-btn[disabled] { background: #fee2e2; color: rgba(220,38,38,.52); }
</style>

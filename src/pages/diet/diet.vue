<template>
  <view class="diet-page">
    <view class="nutrition-shell">
      <view class="hero">
        <view class="hero-copy">
          <text class="hero-kicker">训练饮食建议</text>
          <text class="hero-title">{{ analysis.summaryTitle }}</text>
          <text class="hero-subtitle">{{ analysis.summaryText }}</text>
        </view>
        <picker mode="date" :value="record.date" @change="onDateChange">
          <view class="date-btn">{{ record.date.slice(5) }}</view>
        </picker>
      </view>

      <view class="goal-row">
        <view class="goal-chip">
          <text class="goal-label">当前目标</text>
          <text class="goal-title">{{ goalName }}</text>
        </view>
        <button class="ghost-btn" :disabled="isLoading || !canReusePrevious" @click="reusePreviousRecord">复用上一天</button>
      </view>

      <view class="progress-panel">
        <view v-for="item in analysis.progress" :key="item.key" class="progress-row">
          <view class="progress-head">
            <text class="progress-label">{{ item.label }}</text>
            <text class="progress-value">{{ item.value }}{{ item.unit }} / {{ item.target }}{{ item.unit }}</text>
          </view>
          <view class="progress-track">
            <view class="progress-fill" :class="item.state" :style="{ width: `${Math.min(item.percent, 100)}%` }"></view>
          </view>
        </view>
      </view>

      <view class="nutrition-grid">
        <view v-for="item in analysis.highlights" :key="item.label" class="nutrition-card">
          <text class="nutrition-label">{{ item.label }}</text>
          <text class="nutrition-value">{{ item.value }}</text>
          <text class="nutrition-desc">{{ item.desc }}</text>
        </view>
      </view>
    </view>

    <view class="panel meal-panel">
      <view class="panel-head">
        <view>
          <text class="panel-title">{{ record.date === todayDate ? '今日饮食' : '饮食记录' }}</text>
          <text class="panel-note">{{ isLoading ? '正在读取记录...' : recordStateText }}</text>
        </view>
        <button class="mini-btn" :disabled="isSaving" @click="saveDiet">{{ isSaving ? '保存中' : '保存' }}</button>
      </view>
      <view class="meal-list">
        <view v-for="meal in record.meals" :key="meal.type" class="meal-item">
          <view class="meal-head">
            <text class="meal-label">{{ dietServiceLocal.mealLabels[meal.type] }}</text>
            <text class="meal-action" @click="meal.text = ''; refreshAnalysis()">清空</text>
          </view>
          <view class="food-chip-row">
            <text
              v-for="food in dietServiceLocal.quickFoodPresets[meal.type]"
              :key="food"
              class="food-chip"
              @click="appendFood(meal, food)"
            >
              {{ food }}
            </text>
          </view>
          <textarea v-model="meal.text" maxlength="160" :placeholder="placeholderByType(meal.type)" @input="refreshAnalysis" />
        </view>
      </view>
    </view>

    <view class="panel suggestion-panel">
      <view class="panel-head">
        <text class="panel-title">下一餐怎么调整</text>
        <text class="panel-note">{{ analysis.suggestions.length }} 条</text>
      </view>
      <view v-if="analysis.suggestions.length" class="suggestion-list">
        <view v-for="(item, index) in analysis.suggestions" :key="item" class="suggestion-item">
          <text class="suggestion-index">{{ index + 1 }}</text>
          <text>{{ item }}</text>
        </view>
      </view>
      <view v-else class="empty">记录一餐后，这里会给出更具体的训练饮食建议。</view>
    </view>

    <view v-if="recentRecords.length" class="panel">
      <view class="panel-head">
        <text class="panel-title">最近饮食</text>
        <text class="panel-note">可快速参考</text>
      </view>
      <view class="recent-list">
        <view v-for="item in recentRecords" :key="item._id" class="recent-row" @click="loadRecord(item.date)">
          <text class="recent-date">{{ item.date.slice(5) }}</text>
          <text class="recent-text">{{ summarizeRecord(item) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { dietServiceLocal, type DietAnalysis, type DietRecord, type MealType } from '@/services/diet.local'
import { bodyProfileServiceLocal, type FitnessGoal } from '@/services/body-profile.local'

const emptyRecord: DietRecord = {
  _id: '',
  date: new Date().toISOString().split('T')[0],
  meals: [],
  createdAt: '',
  updatedAt: ''
}

const goalLabels: Record<FitnessGoal, string> = {
  muscle: '增肌',
  fatLoss: '减脂',
  shape: '塑形',
  strength: '力量'
}

const record = reactive<DietRecord>(emptyRecord)
const currentGoal = ref<FitnessGoal>('muscle')
const recentRecords = ref<DietRecord[]>([])
const isSaving = ref(false)
const isLoading = ref(false)
const hasSavedRecord = ref(false)
const canReusePrevious = ref(false)
const analysis = ref<DietAnalysis>({
  nutrition: { calories: 0, protein: 0, fat: 0, carbs: 0 },
  targets: { calories: 2200, protein: 120, fat: 65, carbs: 250 },
  progress: [],
  summaryTitle: '先补一条饮食记录',
  summaryText: '记录一餐后，这里会直接告诉你蛋白、热量和训练恢复是否够用。',
  suggestions: [],
  highlights: [
    { label: '总热量', value: '0 kcal', desc: '0% 目标' },
    { label: '蛋白质', value: '0g', desc: '0% 目标' },
    { label: '碳水', value: '0g', desc: '0% 目标' },
    { label: '脂肪', value: '0g', desc: '0% 目标' }
  ]
})

const todayDate = new Date().toISOString().split('T')[0]
const goalName = computed(() => goalLabels[currentGoal.value])
const recordStateText = computed(() => {
  if (hasSavedRecord.value) return record.updatedAt ? `已保存 · ${record.updatedAt.slice(0, 10)}` : '已保存'
  return '未保存，填写后点击保存'
})

const placeholderByType = (type: MealType) => {
  const map: Record<MealType, string> = {
    breakfast: '例如：燕麦、鸡蛋、牛奶',
    lunch: '例如：米饭、鸡胸肉、西兰花',
    dinner: '例如：鱼、红薯、青菜',
    snack: '例如：香蕉、酸奶、蛋白粉'
  }
  return map[type]
}

const refreshAnalysis = () => {
  analysis.value = dietServiceLocal.analyze(record, currentGoal.value)
}

const refreshRecent = async () => {
  recentRecords.value = (await dietServiceLocal.getRecentRecords(5)).filter((item) => item.date !== record.date)
  canReusePrevious.value = !!(await dietServiceLocal.getPreviousRecord(record.date))
}

const loadGoal = async () => {
  const profile = await bodyProfileServiceLocal.getProfile()
  currentGoal.value = profile.goal || 'muscle'
}

const loadRecord = async (date = record.date) => {
  if (isLoading.value) return
  try {
    isLoading.value = true
    hasSavedRecord.value = await dietServiceLocal.hasRecord(date)
    const saved = await dietServiceLocal.getRecord(date)
    Object.assign(record, saved)
    refreshAnalysis()
    await refreshRecent()
  } catch (error: any) {
    uni.showToast({ title: error?.message || '读取失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

const appendFood = (meal: { text: string }, food: string) => {
  const parts = meal.text
    .split(/[、，,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  if (!parts.includes(food)) parts.push(food)
  meal.text = parts.join('、')
  refreshAnalysis()
}

const reusePreviousRecord = async () => {
  if (isLoading.value || isSaving.value) return
  const previous = await dietServiceLocal.getPreviousRecord(record.date)
  if (!previous) {
    uni.showToast({ title: '暂无可复用记录', icon: 'none' })
    return
  }
  Object.assign(record, dietServiceLocal.createRecordFrom(record.date, previous))
  hasSavedRecord.value = false
  refreshAnalysis()
  uni.showToast({ title: '已复用上一天饮食', icon: 'success' })
}

const saveDiet = async () => {
  if (isSaving.value) return
  const hasMeal = record.meals.some((meal) => meal.text.trim())
  if (!hasMeal) {
    uni.showToast({ title: '请至少填写一餐', icon: 'none' })
    return
  }
  try {
    isSaving.value = true
    Object.assign(record, await dietServiceLocal.saveRecord(record))
    hasSavedRecord.value = true
    refreshAnalysis()
    await refreshRecent()
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (error: any) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  } finally {
    isSaving.value = false
  }
}

const onDateChange = async (event: any) => {
  if (isSaving.value || isLoading.value) return
  await loadRecord(event.detail.value)
}

const summarizeRecord = (item: DietRecord) => {
  return item.meals.map((meal) => meal.text).filter(Boolean).join(' / ') || '未填写'
}

onMounted(async () => {
  await loadGoal()
  await loadRecord()
})

onShow(async () => {
  await loadGoal()
  await loadRecord(record.date)
})
</script>

<style lang="scss" scoped>
.diet-page {
  min-height: 100vh;
  padding: 24rpx 24rpx 48rpx;
  background: #f3f6f5;
  box-sizing: border-box;
}

.nutrition-shell {
  margin-bottom: 22rpx;
  padding: 28rpx;
  border-radius: 22rpx;
  background: #ffffff;
  border: 1rpx solid #e2e8f0;
  box-shadow: 0 14rpx 38rpx rgba(16, 24, 32, .08);
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 22rpx;
}

.hero-copy {
  min-width: 0;
  flex: 1;
}

.hero-kicker,
.hero-subtitle,
.nutrition-label,
.nutrition-desc,
.panel-note,
.goal-label {
  display: block;
  color: #64748b;
  font-size: 22rpx;
  line-height: 1.45;
}

.hero-title {
  display: block;
  margin: 10rpx 0 8rpx;
  color: #101820;
  font-size: 40rpx;
  font-weight: 950;
  line-height: 1.18;
}

.date-btn {
  flex-shrink: 0;
  min-width: 112rpx;
  height: 68rpx;
  padding: 0 20rpx;
  border-radius: 34rpx;
  background: #101820;
  color: #ffffff;
  font-size: 25rpx;
  font-weight: 900;
  line-height: 68rpx;
  text-align: center;
  box-shadow: 0 10rpx 22rpx rgba(16, 24, 32, .16);
}

.goal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 24rpx;
  padding: 20rpx 0 22rpx;
  border-top: 1rpx solid #edf2f7;
  border-bottom: 1rpx solid #edf2f7;
}

.goal-chip {
  min-width: 0;
  flex: 1;
}

.goal-title {
  display: block;
  margin-top: 4rpx;
  color: #101820;
  font-size: 32rpx;
  line-height: 1.15;
  font-weight: 950;
}

.ghost-btn {
  flex-shrink: 0;
  margin: 0;
  min-width: 156rpx;
  height: 62rpx;
  line-height: 62rpx;
  border-radius: 31rpx;
  background: #eef4f8;
  color: #334155;
  font-size: 24rpx;
  font-weight: 900;
}

.ghost-btn[disabled] {
  opacity: .48;
}

.progress-panel {
  padding: 24rpx 0 6rpx;
}

.progress-row + .progress-row {
  margin-top: 20rpx;
}

.progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 10rpx;
}

.progress-label {
  color: #101820;
  font-size: 25rpx;
  font-weight: 900;
}

.progress-value {
  flex-shrink: 0;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
}

.progress-track {
  height: 14rpx;
  border-radius: 999rpx;
  overflow: hidden;
  background: #edf2f7;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: #2563eb;
  transition: width .18s ease-out;
}

.progress-fill.good {
  background: #22c55e;
}

.progress-fill.high {
  background: #d97706;
}

.progress-fill.low {
  background: #2563eb;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
  margin-top: 20rpx;
}

.nutrition-card {
  min-height: 124rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  background: #f8fafc;
  box-sizing: border-box;
}

.nutrition-value {
  display: block;
  margin: 8rpx 0 4rpx;
  color: #101820;
  font-size: 30rpx;
  line-height: 1.1;
  font-weight: 950;
}

.panel {
  margin-bottom: 22rpx;
  padding: 28rpx;
  border-radius: 22rpx;
  background: #ffffff;
  border: 1rpx solid #e2e8f0;
  box-shadow: 0 8rpx 24rpx rgba(16, 24, 32, .05);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.panel-title {
  color: #101820;
  font-size: 30rpx;
  line-height: 1.25;
  font-weight: 950;
}

.mini-btn {
  flex-shrink: 0;
  margin: 0;
  width: 112rpx;
  height: 60rpx;
  line-height: 60rpx;
  border-radius: 30rpx;
  background: #101820;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 900;
}

.mini-btn[disabled] {
  background: #64748b;
  color: rgba(255, 255, 255, .76);
}

.mini-btn:active,
.ghost-btn:active,
.food-chip:active,
.recent-row:active {
  transform: translateY(1rpx);
}

.meal-panel {
  padding-bottom: 30rpx;
}

.meal-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.meal-item {
  padding-top: 20rpx;
  border-top: 1rpx solid #edf2f7;
}

.meal-item:first-child {
  padding-top: 0;
  border-top: 0;
}

.meal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.meal-label {
  display: block;
  color: #101820;
  font-size: 27rpx;
  line-height: 1.3;
  font-weight: 950;
}

.meal-action {
  flex-shrink: 0;
  padding: 8rpx 0 8rpx 18rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
}

.food-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 14rpx;
}

.food-chip {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: #eef4f8;
  color: #334155;
  font-size: 22rpx;
  line-height: 1.25;
  font-weight: 900;
}

textarea {
  width: 100%;
  min-height: 118rpx;
  padding: 18rpx 20rpx;
  border-radius: 14rpx;
  background: #f8fafc;
  color: #101820;
  font-size: 26rpx;
  line-height: 1.45;
  box-sizing: border-box;
}

.suggestion-panel {
  background: #f9fbfa;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  padding: 18rpx 20rpx;
  border-radius: 16rpx;
  background: #ffffff;
  border: 1rpx solid #e2e8f0;
  color: #334155;
  font-size: 25rpx;
  line-height: 1.5;
}

.suggestion-index {
  flex-shrink: 0;
  width: 34rpx;
  height: 34rpx;
  border-radius: 17rpx;
  background: #22c55e;
  color: #101820;
  font-size: 20rpx;
  line-height: 34rpx;
  font-weight: 950;
  text-align: center;
}

.empty {
  padding: 40rpx 0;
  color: #64748b;
  font-size: 26rpx;
  line-height: 1.45;
  text-align: center;
}

.recent-list {
  display: flex;
  flex-direction: column;
}

.recent-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid #edf2f7;
}

.recent-row:first-child {
  border-top: 0;
}

.recent-date {
  flex-shrink: 0;
  width: 88rpx;
  height: 44rpx;
  border-radius: 22rpx;
  background: #eef4f8;
  color: #101820;
  font-size: 23rpx;
  line-height: 44rpx;
  font-weight: 950;
  text-align: center;
}

.recent-text {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #64748b;
  font-size: 24rpx;
}
</style>

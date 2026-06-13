<template>
  <view class="diet-page">
    <view class="hero">
      <view>
        <text class="hero-kicker">AI饮食建议</text>
        <text class="hero-title">记录今天吃了什么</text>
        <text class="hero-subtitle">先用本地规则粗略估算热量和营养，后续可接入 AI 做更准确分析。</text>
      </view>
      <picker mode="date" :value="record.date" @change="onDateChange">
        <view class="date-btn">{{ record.date.slice(5) }}</view>
      </picker>
    </view>

    <view class="nutrition-grid">
      <view v-for="item in analysis.highlights" :key="item.label" class="nutrition-card">
        <text class="nutrition-label">{{ item.label }}</text>
        <text class="nutrition-value">{{ item.value }}</text>
        <text class="nutrition-desc">{{ item.desc }}</text>
      </view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <view>
          <text class="panel-title">{{ record.date === todayDate ? '今日饮食' : '饮食记录' }}</text>
          <text class="panel-note">{{ isLoading ? '正在读取这一天的记录...' : recordStateText }}</text>
        </view>
        <button class="mini-btn" :disabled="isSaving" @click="saveDiet">{{ isSaving ? '保存中' : '保存' }}</button>
      </view>
      <view class="meal-list">
        <view v-for="meal in record.meals" :key="meal.type" class="meal-item">
          <text class="meal-label">{{ dietServiceLocal.mealLabels[meal.type] }}</text>
          <textarea v-model="meal.text" maxlength="120" :placeholder="placeholderByType(meal.type)" @input="refreshAnalysis" />
          <view class="food-chip-row">
            <text
              v-for="food in quickFoods[meal.type]"
              :key="food"
              class="food-chip"
              @click="appendFood(meal, food)"
            >
              {{ food }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">AI建议</text>
        <text class="panel-note">{{ analysis.suggestions.length }} 条</text>
      </view>
      <view v-if="analysis.suggestions.length" class="suggestion-list">
        <view v-for="item in analysis.suggestions" :key="item" class="suggestion-item">
          <text>{{ item }}</text>
        </view>
      </view>
      <view v-else class="empty">输入饮食内容后，这里会生成建议。</view>
    </view>

    <view class="tip-panel">
      <text>提示：当前为关键词估算，适合做方向判断，不等同于精确营养数据库。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { dietServiceLocal, type DietAnalysis, type DietRecord, type MealType } from '@/services/diet.local'

const quickFoods: Record<MealType, string[]> = {
  breakfast: ['鸡蛋', '燕麦', '牛奶', '全麦面包', '香蕉'],
  lunch: ['米饭', '鸡胸肉', '牛肉', '鱼', '西兰花'],
  dinner: ['红薯', '虾', '豆腐', '青菜', '玉米'],
  snack: ['酸奶', '蛋白粉', '水果', '坚果', '牛奶']
}

const emptyRecord: DietRecord = {
  _id: '',
  date: new Date().toISOString().split('T')[0],
  meals: [],
  createdAt: '',
  updatedAt: ''
}
const record = reactive<DietRecord>(emptyRecord)
const isSaving = ref(false)
const isLoading = ref(false)
const hasSavedRecord = ref(false)
const analysis = ref<DietAnalysis>({
  nutrition: { calories: 0, protein: 0, fat: 0, carbs: 0 },
  suggestions: [],
  highlights: [
    { label: '总热量', value: '0 kcal', desc: '等待输入' },
    { label: '蛋白质', value: '0g', desc: '等待输入' },
    { label: '碳水', value: '0g', desc: '等待输入' },
    { label: '脂肪', value: '0g', desc: '等待输入' }
  ]
})

const todayDate = new Date().toISOString().split('T')[0]
const recordStateText = computed(() => {
  if (hasSavedRecord.value) {
    return record.updatedAt ? `已保存 · ${record.updatedAt.slice(0, 10)}` : '已保存'
  }
  return '未保存，填写后点击保存'
})

const placeholderByType = (type: MealType) => {
  const map: Record<MealType, string> = {
    breakfast: '例如：燕麦、鸡蛋、牛奶',
    lunch: '例如：米饭、鸡胸肉、西兰花',
    dinner: '例如：牛肉、红薯、青菜',
    snack: '例如：香蕉、酸奶、蛋白粉'
  }
  return map[type]
}

const loadRecord = async (date = record.date) => {
  if (isLoading.value) return
  try {
    isLoading.value = true
    hasSavedRecord.value = await dietServiceLocal.hasRecord(date)
    const saved = await dietServiceLocal.getRecord(date)
    Object.assign(record, saved)
    refreshAnalysis()
  } catch (error: any) {
    uni.showToast({ title: error?.message || '读取失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

const refreshAnalysis = () => {
  analysis.value = dietServiceLocal.analyze(record)
}

const appendFood = (meal: { text: string }, food: string) => {
  const parts = meal.text
    .split(/[、,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  if (!parts.includes(food)) parts.push(food)
  meal.text = parts.join('、')
  refreshAnalysis()
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

onMounted(() => loadRecord())
onShow(() => loadRecord(record.date))
</script>

<style lang="scss" scoped>
.diet-page { min-height: 100vh; padding: 24rpx 24rpx 48rpx; background: #f4f6f8; box-sizing: border-box; }
.hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24rpx; padding: 36rpx; border-radius: 16rpx; background: #101820; color: #fff; }
.hero-kicker, .hero-subtitle, .nutrition-label, .nutrition-desc, .panel-note { display: block; color: #718096; font-size: 22rpx; line-height: 1.45; }
.hero-kicker, .hero-subtitle { color: rgba(255,255,255,.72); }
.hero-title { display: block; margin: 10rpx 0; color: #fff; font-size: 42rpx; font-weight: 900; line-height: 1.2; }
.date-btn { flex-shrink: 0; min-width: 112rpx; height: 72rpx; padding: 0 20rpx; border-radius: 36rpx; background: #22c55e; color: #101820; font-size: 26rpx; font-weight: 900; line-height: 72rpx; text-align: center; }
.nutrition-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16rpx; margin: 20rpx 0; }
.nutrition-card, .panel, .tip-panel { border-radius: 12rpx; background: #fff; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
.nutrition-card { padding: 24rpx; }
.nutrition-value { display: block; margin: 8rpx 0; color: #101820; font-size: 34rpx; font-weight: 900; }
.panel { margin-bottom: 20rpx; padding: 28rpx; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin-bottom: 18rpx; }
.panel-title { color: #101820; font-size: 30rpx; font-weight: 900; }
.mini-btn { flex-shrink: 0; margin: 0; width: 112rpx; height: 60rpx; line-height: 60rpx; border-radius: 30rpx; background: #101820; color: #fff; font-size: 24rpx; font-weight: 900; }
.mini-btn[disabled] { background: #4a5568; color: rgba(255,255,255,.72); }
.meal-list { display: flex; flex-direction: column; gap: 18rpx; }
.meal-label { display: block; margin-bottom: 10rpx; color: #2d3748; font-size: 25rpx; font-weight: 900; }
textarea { width: 100%; height: 118rpx; padding: 18rpx 20rpx; border-radius: 12rpx; background: #f8fafc; color: #101820; font-size: 26rpx; line-height: 1.45; box-sizing: border-box; }
.food-chip-row { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 12rpx; }
.food-chip { padding: 8rpx 14rpx; border-radius: 999rpx; background: #edf2f7; color: #2d3748; font-size: 22rpx; font-weight: 800; }
.suggestion-list { display: flex; flex-direction: column; gap: 12rpx; }
.suggestion-item { padding: 18rpx 20rpx; border-radius: 12rpx; background: #f8fafc; color: #2d3748; font-size: 25rpx; line-height: 1.5; }
.empty { padding: 40rpx 0; color: #718096; font-size: 26rpx; text-align: center; }
.tip-panel { padding: 20rpx 24rpx; color: #718096; font-size: 22rpx; line-height: 1.5; }
</style>

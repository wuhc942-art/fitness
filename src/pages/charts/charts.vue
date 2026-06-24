<template>
  <view class="progress-page">
    <view class="hero">
      <view>
        <text class="hero-kicker">AI训练分析</text>
        <text class="hero-title">看见你的训练趋势</text>
        <text class="hero-subtitle">基于训练记录自动分析频率、训练量、部位分布和力量进步。</text>
      </view>
      <button class="hero-btn" :disabled="isLoading" @click="loadData">{{ isLoading ? '刷新中' : '刷新' }}</button>
    </view>

    <view v-if="isLoading" class="loading-panel">正在整理训练数据...</view>

    <view v-if="analysis.cards.length" class="summary">
      <view v-for="card in analysis.cards" :key="card.title" class="summary-item" :class="card.tone">
        <text class="summary-label">{{ card.title }}</text>
        <text class="summary-value">{{ card.value }}</text>
        <text class="summary-desc">{{ card.desc }}</text>
      </view>
    </view>
    <view v-else-if="!isLoading" class="summary-empty">完成训练记录后，这里会展示频率、训练量和恢复建议。</view>

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
      <view v-else class="empty">训练数据还不够，完成几次训练后会给出建议。</view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">部位分布</text>
        <text class="panel-note">近30天</text>
      </view>
      <view v-if="analysis.bodyPartRows.length" class="body-list">
        <view v-for="item in analysis.bodyPartRows" :key="item.label" class="body-row">
          <text class="body-label">{{ item.label }}</text>
          <view class="body-track">
            <view class="body-fill" :style="{ width: item.percent + '%' }"></view>
          </view>
          <text class="body-count">{{ item.count }}次</text>
        </view>
      </view>
      <view v-else class="empty">暂无部位分布数据。</view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">力量进步</text>
        <text class="panel-note">近30天 vs 上阶段</text>
      </view>
      <view v-if="analysis.progressRows.length" class="progress-list">
        <view v-for="item in analysis.progressRows" :key="item.name" class="progress-row">
          <view>
            <text class="progress-name">{{ item.name }}</text>
            <text class="progress-meta">{{ item.previous }}kg → {{ item.current }}kg</text>
          </view>
          <text class="progress-up">+{{ item.increase }}%</text>
        </view>
      </view>
      <view v-else class="empty">暂未发现明显力量突破，继续稳定记录。</view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">近30天训练量</text>
        <text class="panel-note">kg</text>
      </view>
      <view v-if="volumeData.length" class="bar-chart">
        <view v-for="item in volumeData" :key="item.date" class="bar-item">
          <view class="bar-track">
            <view class="bar" :style="{ height: getVolumeHeight(item.volume) + 'rpx' }"></view>
          </view>
          <text class="bar-label">{{ item.date.slice(5) }}</text>
        </view>
      </view>
      <view v-else class="empty">还没有训练量数据，完成一次训练后会自动展示。</view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">月度训练频率</text>
        <text class="panel-note">次</text>
      </view>
      <view v-if="frequencyData.length" class="frequency-list">
        <view v-for="item in frequencyData" :key="item.month" class="frequency-row">
          <text class="month">{{ item.month }}</text>
          <view class="frequency-track">
            <view class="frequency-fill" :style="{ width: getFrequencyWidth(item.count) + '%' }"></view>
          </view>
          <text class="count">{{ item.count }}</text>
        </view>
      </view>
      <view v-else class="empty">暂无月度训练数据。</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { trainingServiceLocal } from '@/services/training.local'
import { trainingAnalysisServiceLocal, type TrainingAnalysis } from '@/services/training-analysis.local'
import { useMiniProgramShare } from '@/utils/share'

useMiniProgramShare({
  title: 'FitAI 健身记录：查看训练趋势'
})

const volumeData = ref<{ date: string; volume: number }[]>([])
const frequencyData = ref<{ month: string; count: number }[]>([])
const isLoading = ref(false)
const analysis = ref<TrainingAnalysis>({
  cards: [],
  bodyPartRows: [],
  progressRows: [],
  suggestions: []
})

const maxVolume = computed(() => Math.max(...volumeData.value.map((item) => item.volume), 0))
const maxFrequency = computed(() => Math.max(...frequencyData.value.map((item) => item.count), 1))

const loadData = async () => {
  if (isLoading.value) return
  try {
    isLoading.value = true
    const today = new Date()
    const start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recent = await trainingServiceLocal.queryHistory({
      startDate: start.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    })
    volumeData.value = recent
      .map((record) => ({ date: record.date, volume: record.totalVolume || 0 }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const all = await trainingServiceLocal.queryHistory({
      startDate: '2020-01-01',
      endDate: today.toISOString().split('T')[0]
    })
    const monthCount: Record<string, number> = {}
    all.forEach((record) => {
      const month = record.date.slice(0, 7)
      monthCount[month] = (monthCount[month] || 0) + 1
    })
    frequencyData.value = Object.entries(monthCount)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)

    analysis.value = await trainingAnalysisServiceLocal.getAnalysis()
  } catch (error: any) {
    uni.showToast({ title: error?.message || '加载失败', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

const getVolumeHeight = (value: number) => {
  const max = Math.max(maxVolume.value, 1)
  return Math.max(12, Math.round((value / max) * 180))
}
const getFrequencyWidth = (value: number) => Math.max(6, Math.round((value / maxFrequency.value) * 100))

onMounted(loadData)
onShow(loadData)
</script>

<style lang="scss" scoped>
.progress-page { min-height: 100vh; padding: 24rpx; background: #f4f6f8; box-sizing: border-box; }
.hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24rpx; margin-bottom: 20rpx; padding: 36rpx; border-radius: 16rpx; background: #101820; color: #fff; }
.hero-kicker, .hero-subtitle, .summary-label, .summary-desc, .panel-note { display: block; color: #718096; font-size: 22rpx; line-height: 1.45; }
.hero-kicker, .hero-subtitle { color: rgba(255,255,255,.72); }
.hero-title { display: block; margin: 10rpx 0; color: #fff; font-size: 42rpx; font-weight: 900; line-height: 1.2; }
.hero-btn { flex-shrink: 0; margin: 0; width: 112rpx; height: 72rpx; line-height: 72rpx; border-radius: 36rpx; background: #22c55e; color: #101820; font-size: 26rpx; font-weight: 900; }
.hero-btn[disabled] { opacity: .65; }
.summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; margin-bottom: 20rpx; }
.summary-item, .panel { background: #fff; border-radius: 12rpx; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
.loading-panel, .summary-empty { margin-bottom: 20rpx; padding: 24rpx; border-radius: 12rpx; background: #fff; color: #718096; font-size: 25rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
.summary-item { min-width: 0; padding: 24rpx 12rpx; border-top: 6rpx solid #718096; text-align: center; }
.summary-item.good { border-top-color: #16a34a; }
.summary-item.warn { border-top-color: #d97706; }
.summary-item.info { border-top-color: #2563eb; }
.summary-value { display: block; margin: 8rpx 0; color: #101820; font-size: 34rpx; font-weight: 900; }
.panel { margin-bottom: 20rpx; padding: 28rpx; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; margin-bottom: 22rpx; }
.panel-title { color: #101820; font-size: 30rpx; font-weight: 800; }
.suggestion-list { display: flex; flex-direction: column; gap: 12rpx; }
.suggestion-item { padding: 18rpx 20rpx; border-radius: 12rpx; background: #f8fafc; color: #2d3748; font-size: 25rpx; line-height: 1.5; }
.body-row, .frequency-row, .progress-row { display: grid; align-items: center; gap: 14rpx; margin-bottom: 18rpx; }
.body-row { grid-template-columns: 92rpx 1fr 64rpx; }
.frequency-row { grid-template-columns: 110rpx 1fr 48rpx; }
.progress-row { grid-template-columns: 1fr 92rpx; padding: 18rpx 0; border-top: 1rpx solid #edf2f7; }
.progress-row:first-child { border-top: 0; padding-top: 0; }
.progress-name { display: block; color: #101820; font-size: 26rpx; font-weight: 800; }
.progress-meta { display: block; margin-top: 6rpx; color: #718096; font-size: 22rpx; }
.progress-up { color: #16a34a; font-size: 28rpx; font-weight: 900; text-align: right; }
.body-label, .body-count, .month, .count { color: #4a5568; font-size: 24rpx; }
.body-count, .count { text-align: right; font-weight: 800; }
.body-track, .frequency-track { height: 18rpx; border-radius: 999rpx; background: #edf2f7; overflow: hidden; }
.body-fill { height: 100%; border-radius: 999rpx; background: #22c55e; }
.frequency-fill { height: 100%; border-radius: 999rpx; background: #101820; }
.bar-chart { display: flex; align-items: flex-end; gap: 12rpx; min-height: 260rpx; overflow-x: auto; }
.bar-item { flex: 0 0 58rpx; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 10rpx; }
.bar-track { width: 28rpx; height: 190rpx; display: flex; align-items: flex-end; border-radius: 999rpx; background: #edf2f7; overflow: hidden; }
.bar { width: 100%; border-radius: 999rpx 999rpx 0 0; background: #22c55e; }
.bar-label { color: #718096; font-size: 18rpx; transform: rotate(-35deg); white-space: nowrap; }
.empty { padding: 44rpx 0; color: #718096; font-size: 26rpx; text-align: center; }
</style>

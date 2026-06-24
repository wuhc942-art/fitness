<template>
  <view class="history-page">
    <view class="hero">
      <view>
        <text class="hero-kicker">训练历史</text>
        <text class="hero-title">{{ resultList.length }} 条记录</text>
        <text class="hero-subtitle">搜索、复盘、编辑或删除每一次训练。</text>
      </view>
      <button class="hero-btn" @click="handleSearch">刷新</button>
    </view>

    <view class="summary-grid">
      <view class="summary-item">
        <text class="summary-value">{{ summary.totalDuration }}</text>
        <text class="summary-label">分钟</text>
      </view>
      <view class="summary-item">
        <text class="summary-value">{{ summary.totalVolume }}</text>
        <text class="summary-label">kg总量</text>
      </view>
      <view class="summary-item">
        <text class="summary-value">{{ summary.actionCount }}</text>
        <text class="summary-label">动作数</text>
      </view>
    </view>

    <view class="filters">
      <view class="quick-range">
        <view v-for="item in rangeOptions" :key="item.value" class="range-chip" :class="{ active: activeRange === item.value }" @click="applyRange(item.value)">
          {{ item.label }}
        </view>
      </view>

      <view class="date-row">
        <picker mode="date" :value="searchForm.startDate" @change="onStartDateChange">
          <view class="date-box">{{ searchForm.startDate || '开始日期' }}</view>
        </picker>
        <text class="separator">至</text>
        <picker mode="date" :value="searchForm.endDate" @change="onEndDateChange">
          <view class="date-box">{{ searchForm.endDate || '结束日期' }}</view>
        </picker>
      </view>

      <input v-model="searchForm.actionName" class="search-input" placeholder="搜索动作，例如：卧推、蝴蝶机夹胸、坐姿推胸" confirm-type="search" @confirm="handleSearch" />

      <scroll-view scroll-x class="part-scroll">
        <view v-for="item in bodyPartFilters" :key="item.value" class="part-chip" :class="{ active: searchForm.bodyPart === item.value }" @click="selectBodyPart(item.value)">
          {{ item.label }}
        </view>
      </scroll-view>

      <view class="filter-actions">
        <button class="primary" @click="handleSearch">查询</button>
        <button class="secondary" @click="resetSearch">重置</button>
      </view>
    </view>

    <view v-if="resultList.length" class="record-list">
      <view v-for="record in resultList" :key="record._id" class="record-card" @click="viewDetail(record)">
        <view class="record-head">
          <view>
            <text class="record-date">{{ record.date }}</text>
            <text class="record-meta">{{ getBodyPartLabel(record.bodyPart) }} · {{ record.duration }} 分钟 · {{ record.actions.length }} 个动作</text>
          </view>
          <text class="volume">{{ record.totalVolume || 0 }} kg</text>
        </view>
        <view class="action-tags">
          <text v-for="action in record.actions.slice(0, 5)" :key="action.name" class="action-tag">{{ action.name }}</text>
          <text v-if="record.actions.length > 5" class="action-tag">+{{ record.actions.length - 5 }}</text>
        </view>
      </view>
    </view>

    <view v-else-if="hasSearched" class="empty">暂无训练记录</view>

    <view v-if="showDetail" class="modal-mask" @click="closeDetail">
      <view class="modal" @click.stop>
        <view class="modal-head">
          <text class="modal-title">训练详情</text>
          <text class="modal-close" @click="closeDetail">×</text>
        </view>
        <scroll-view scroll-y class="modal-body" v-if="selectedRecord">
          <view class="detail-row"><text>日期</text><text>{{ selectedRecord.date }}</text></view>
          <view class="detail-row"><text>部位</text><text>{{ getBodyPartLabel(selectedRecord.bodyPart) }}</text></view>
          <view class="detail-row"><text>时长</text><text>{{ selectedRecord.duration }} 分钟</text></view>
          <view class="detail-row"><text>训练量</text><text>{{ selectedRecord.totalVolume || 0 }} kg</text></view>
          <view class="action-detail" v-for="action in selectedRecord.actions" :key="action.name">
            <view class="action-detail-head">
              <text class="detail-action-name">{{ action.name }}</text>
              <text class="detail-action-meta">最佳 {{ action.weight }}kg × {{ action.reps }}</text>
            </view>
            <view class="sets-line">
              <text v-for="set in action.setsDetail" :key="set.setNumber" class="set-pill">{{ set.weight }} × {{ set.reps }}</text>
            </view>
          </view>
        </scroll-view>
        <view class="modal-actions">
          <button class="repeat-btn" :disabled="isDeleting" @click="repeatRecord">再练一次</button>
          <button class="edit-btn" :disabled="isDeleting" @click="editRecord">编辑记录</button>
          <button class="delete-btn" :disabled="isDeleting" @click="confirmDelete">{{ isDeleting ? '删除中...' : '删除' }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { BodyPart, TrainingRecord } from '@/types/training'
import { trainingServiceLocal } from '@/services/training.local'
import { trainingPlanServiceLocal } from '@/services/training-plan.local'
import { useMiniProgramShare } from '@/utils/share'

type RangeValue = '7' | '30' | '90' | 'all'

useMiniProgramShare({
  title: 'FitAI 健身记录：复盘训练历史'
})

const bodyPartLabels: Record<BodyPart, string> = {
  chest: '胸',
  back: '背',
  legs: '腿',
  shoulders: '肩',
  arms: '手臂',
  core: '核心',
  cardio: '有氧',
  full: '全身'
}
const bodyPartFilters: { value: BodyPart | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'chest', label: '胸' },
  { value: 'back', label: '背' },
  { value: 'legs', label: '腿' },
  { value: 'shoulders', label: '肩' },
  { value: 'arms', label: '手臂' },
  { value: 'core', label: '核心' },
  { value: 'cardio', label: '有氧' },
  { value: 'full', label: '全身' }
]
const rangeOptions: { value: RangeValue; label: string }[] = [
  { value: '7', label: '7天' },
  { value: '30', label: '30天' },
  { value: '90', label: '90天' },
  { value: 'all', label: '全部' }
]

const searchForm = reactive({
  startDate: '',
  endDate: '',
  bodyPart: '' as BodyPart | '',
  actionName: ''
})
const activeRange = ref<RangeValue>('30')
const resultList = ref<TrainingRecord[]>([])
const hasSearched = ref(false)
const showDetail = ref(false)
const selectedRecord = ref<TrainingRecord | null>(null)
const isDeleting = ref(false)

const summary = computed(() => ({
  totalDuration: resultList.value.reduce((sum, record) => sum + (Number(record.duration) || 0), 0),
  totalVolume: resultList.value.reduce((sum, record) => sum + (Number(record.totalVolume) || 0), 0),
  actionCount: resultList.value.reduce((sum, record) => sum + record.actions.length, 0)
}))

const getDateString = (date: Date) => date.toISOString().split('T')[0]
const getBodyPartLabel = (part: BodyPart) => bodyPartLabels[part] || part

const applyRange = (range: RangeValue) => {
  activeRange.value = range
  const today = new Date()
  searchForm.endDate = getDateString(today)
  if (range === 'all') searchForm.startDate = '2020-01-01'
  else searchForm.startDate = getDateString(new Date(today.getTime() - Number(range) * 24 * 60 * 60 * 1000))
  handleSearch()
}

onMounted(() => {
  applyRange('30')
})

onShow(() => {
  if (hasSearched.value) handleSearch()
})

const onStartDateChange = (event: any) => {
  searchForm.startDate = event.detail.value
  activeRange.value = 'all'
}
const onEndDateChange = (event: any) => {
  searchForm.endDate = event.detail.value
  activeRange.value = 'all'
}
const selectBodyPart = (value: BodyPart | '') => {
  searchForm.bodyPart = value
  handleSearch()
}

const handleSearch = async () => {
  hasSearched.value = true
  resultList.value = await trainingServiceLocal.queryHistory({
    startDate: searchForm.startDate || undefined,
    endDate: searchForm.endDate || undefined,
    bodyPart: searchForm.bodyPart || undefined,
    actionName: searchForm.actionName.trim() || undefined
  })
}

const resetSearch = () => {
  searchForm.bodyPart = ''
  searchForm.actionName = ''
  applyRange('30')
}

const viewDetail = (record: TrainingRecord) => {
  selectedRecord.value = record
  showDetail.value = true
}
const closeDetail = () => {
  if (isDeleting.value) return
  showDetail.value = false
  selectedRecord.value = null
}
const editRecord = () => {
  if (isDeleting.value) return
  if (!selectedRecord.value?._id) return
  const id = selectedRecord.value._id
  closeDetail()
  uni.navigateTo({ url: `/pages/training-record/training-record?recordId=${id}` })
}
const repeatRecord = () => {
  if (isDeleting.value || !selectedRecord.value) return
  const record = selectedRecord.value
  uni.setStorageSync('repeat_workout_record', JSON.stringify({
    bodyPart: record.bodyPart,
    duration: record.duration,
    location: record.location,
    actions: record.actions
  }))
  closeDetail()
  uni.navigateTo({ url: '/pages/training-record/training-record?repeat=1' })
}
const confirmDelete = () => {
  if (isDeleting.value) return
  if (!selectedRecord.value?._id) return
  uni.showModal({
    title: '删除记录',
    content: '确定删除这次训练吗？删除后不会影响历史模板。',
    success: async (res) => {
      if (!res.confirm || !selectedRecord.value?._id) return
      const recordId = selectedRecord.value._id
      try {
        isDeleting.value = true
        await trainingServiceLocal.deleteRecord(recordId)
        await trainingPlanServiceLocal.unmarkSessionByRecordId(recordId)
        uni.showToast({ title: '删除成功', icon: 'success' })
        showDetail.value = false
        selectedRecord.value = null
        handleSearch()
      } catch (error: any) {
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
      } finally {
        isDeleting.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.history-page { min-height: 100vh; padding: 24rpx; background: #f4f6f8; box-sizing: border-box; }
.hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 24rpx; margin-bottom: 20rpx; padding: 36rpx; border-radius: 16rpx; background: #101820; color: #fff; }
.hero-kicker, .hero-subtitle, .summary-label, .record-meta, .detail-action-meta { display: block; color: #718096; font-size: 22rpx; line-height: 1.45; }
.hero-kicker, .hero-subtitle { color: rgba(255,255,255,.72); }
.hero-title { display: block; margin: 10rpx 0; color: #fff; font-size: 42rpx; font-weight: 900; line-height: 1.2; }
.hero-btn { flex-shrink: 0; margin: 0; width: 112rpx; height: 72rpx; line-height: 72rpx; border-radius: 36rpx; background: #22c55e; color: #101820; font-size: 26rpx; font-weight: 900; }
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; margin-bottom: 20rpx; }
.summary-item, .filters, .record-card, .modal { background: #fff; border-radius: 12rpx; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
.summary-item { padding: 22rpx 12rpx; text-align: center; }
.summary-value { display: block; color: #101820; font-size: 34rpx; font-weight: 900; }
.filters { padding: 24rpx; margin-bottom: 20rpx; }
.quick-range { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10rpx; margin-bottom: 18rpx; padding: 8rpx; border-radius: 12rpx; background: #edf2f7; }
.range-chip { height: 58rpx; border-radius: 10rpx; color: #4a5568; font-size: 23rpx; font-weight: 800; line-height: 58rpx; text-align: center; }
.range-chip.active { background: #101820; color: #fff; }
.date-row { display: grid; grid-template-columns: 1fr 48rpx 1fr; align-items: center; gap: 12rpx; margin-bottom: 18rpx; }
.date-box, .search-input { height: 72rpx; border-radius: 10rpx; background: #f8fafc; color: #101820; font-size: 25rpx; box-sizing: border-box; }
.date-box { line-height: 72rpx; text-align: center; }
.search-input { width: 100%; margin-bottom: 18rpx; padding: 0 20rpx; }
.separator { color: #718096; font-size: 24rpx; text-align: center; }
.part-scroll { white-space: nowrap; margin-bottom: 18rpx; }
.part-chip { display: inline-block; padding: 12rpx 22rpx; margin-right: 10rpx; border-radius: 999rpx; background: #edf2f7; color: #2d3748; font-size: 24rpx; }
.part-chip.active { background: #101820; color: #fff; }
.filter-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 14rpx; }
.filter-actions button { height: 72rpx; line-height: 72rpx; border-radius: 36rpx; font-size: 26rpx; font-weight: 800; }
.primary { background: #101820; color: #fff; }
.secondary { background: #edf2f7; color: #2d3748; }
.record-list { display: flex; flex-direction: column; gap: 16rpx; }
.record-card { padding: 24rpx; }
.record-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; margin-bottom: 16rpx; }
.record-date { display: block; color: #101820; font-size: 30rpx; font-weight: 800; }
.volume { color: #22c55e; font-size: 28rpx; font-weight: 900; }
.action-tags { display: flex; flex-wrap: wrap; gap: 10rpx; }
.action-tag { padding: 6rpx 12rpx; border-radius: 8rpx; background: #f8fafc; color: #4a5568; font-size: 22rpx; }
.empty { padding: 80rpx 0; color: #718096; font-size: 28rpx; text-align: center; }
.modal-mask { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 20; display: flex; align-items: flex-end; background: rgba(16,24,32,.52); }
.modal { width: 100%; max-height: 84vh; border-radius: 24rpx 24rpx 0 0; overflow: hidden; }
.modal-head, .modal-actions { display: flex; align-items: center; justify-content: space-between; padding: 28rpx; border-bottom: 1rpx solid #edf2f7; }
.modal-title { color: #101820; font-size: 32rpx; font-weight: 800; }
.modal-close { color: #718096; font-size: 44rpx; }
.modal-body { max-height: 58vh; padding: 0 28rpx 28rpx; }
.detail-row { display: flex; justify-content: space-between; padding: 22rpx 0; border-bottom: 1rpx solid #edf2f7; color: #2d3748; font-size: 26rpx; }
.action-detail { margin-top: 18rpx; padding: 20rpx; border-radius: 12rpx; background: #f8fafc; }
.action-detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12rpx; }
.detail-action-name { display: block; color: #101820; font-size: 28rpx; font-weight: 800; }
.detail-action-meta { text-align: right; }
.sets-line { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 14rpx; }
.set-pill { padding: 6rpx 12rpx; border-radius: 8rpx; background: #fff; color: #101820; font-size: 22rpx; font-weight: 700; }
.modal-actions { gap: 16rpx; border-top: 1rpx solid #edf2f7; border-bottom: 0; }
.modal-actions button { flex: 1; height: 78rpx; line-height: 78rpx; border-radius: 39rpx; font-size: 28rpx; font-weight: 800; }
.edit-btn { background: #101820; color: #fff; }
.repeat-btn { background: #22c55e; color: #101820; }
.delete-btn { background: #fee2e2; color: #dc2626; }
.modal-actions button[disabled] { opacity: .65; }
</style>

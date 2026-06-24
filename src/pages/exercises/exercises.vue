<template>
  <view class="exercise-page">
    <view class="top">
      <view>
        <text class="eyebrow">动作库</text>
        <text class="title">动作演示和训练记录一起用</text>
      </view>
      <button class="refresh" :disabled="onlineLoading" @click="refreshOnline">{{ onlineLoading ? '加载中' : '刷新' }}</button>
    </view>

    <view class="tabs">
      <text class="tab" :class="{ active: sourceMode === 'local' }" @click="sourceMode = 'local'">我的常用</text>
      <text class="tab" :class="{ active: sourceMode === 'online' }" @click="sourceMode = 'online'">ExerciseDB</text>
    </view>

    <view class="search-box">
      <input v-model="keyword" placeholder="搜索动作、肌群或器械" confirm-type="search" />
    </view>

    <scroll-view scroll-x class="filter-scroll">
      <view class="filter-row">
        <text
          v-for="item in BODY_PART_OPTIONS"
          :key="item.value"
          class="chip"
          :class="{ active: bodyPartFilter === item.value }"
          @click="bodyPartFilter = item.value"
        >
          {{ item.label }}
        </text>
      </view>
    </scroll-view>

    <scroll-view scroll-x class="filter-scroll">
      <view class="filter-row">
        <text
          v-for="item in EQUIPMENT_OPTIONS"
          :key="item.value"
          class="chip quiet"
          :class="{ active: equipmentFilter === item.value }"
          @click="equipmentFilter = item.value"
        >
          {{ item.label }}
        </text>
      </view>
    </scroll-view>

    <view v-if="sourceMode === 'online'" class="online-status">
      <text>{{ onlineStatusText }}</text>
      <text v-if="keyword.trim()" class="online-mode" @click="showAllOnline = !showAllOnline">{{ showAllOnline ? '只看有演示动作' : '搜索更多无演示动作' }}</text>
    </view>

    <view class="layout">
      <view class="list">
        <template v-if="sourceMode === 'local'">
          <view
            v-for="item in filteredLocalExercises"
            :key="item.id"
            class="exercise-card"
            :class="{ selected: selectedLocal?.id === item.id }"
            @click="selectLocal(item)"
          >
            <view class="card-main">
              <text class="exercise-name">{{ item.name }}</text>
              <text class="exercise-meta">{{ bodyPartName(item.bodyPart) }} · {{ EQUIPMENT_LABELS[item.equipment] }} · {{ LEVEL_LABELS[item.level] }}</text>
            </view>
            <button class="add-btn" :disabled="isNavigating" @click.stop="addToTraining(item.name, item.bodyPart)">{{ isNavigating ? '打开中' : '加入' }}</button>
          </view>
          <view v-if="filteredLocalExercises.length === 0" class="empty">
            <text>没有找到匹配动作，可以换个关键词或筛选条件。</text>
          </view>
        </template>

        <template v-else>
          <view v-if="onlineLocalMatches.length" class="match-section">
            <text class="match-title">中文动作库匹配</text>
            <view
              v-for="item in onlineLocalMatches"
              :key="`local-${item.id}`"
              class="exercise-card"
              @click="selectLocalMatch(item)"
            >
              <view class="card-main">
                <text class="exercise-name">{{ item.name }}</text>
                <text class="exercise-meta">{{ bodyPartName(item.bodyPart) }} · {{ EQUIPMENT_LABELS[item.equipment] }}</text>
              </view>
              <button class="add-btn" :disabled="isNavigating" @click.stop="addToTraining(item.name, item.bodyPart)">{{ isNavigating ? '打开中' : '加入' }}</button>
            </view>
          </view>
          <view
            v-for="item in visibleOnlineExercises"
            :key="item.exerciseId"
            class="exercise-card"
            :class="{ selected: selectedOnline?.exerciseId === item.exerciseId }"
            @click="selectOnline(item)"
          >
            <image v-if="exerciseGif(item)" class="thumb" :src="exerciseGif(item)" mode="aspectFill" />
            <view class="card-main">
              <text class="exercise-name">{{ formatExerciseName(item.name) }}</text>
              <text class="exercise-meta">{{ formatTags(item.bodyParts) }} · {{ formatTags(item.equipments) }}</text>
            </view>
            <button class="add-btn" :disabled="isNavigating" @click.stop="addToTraining(formatExerciseName(item.name), mapOnlineBodyPart(item.bodyParts))">{{ isNavigating ? '打开中' : '加入' }}</button>
          </view>
          <button v-if="filteredOnlineExercises.length > visibleOnlineExercises.length" class="load-more" @click="onlineLimit += 20">
            加载更多
          </button>
          <view v-if="!onlineLoading && filteredOnlineExercises.length === 0 && onlineLocalMatches.length === 0" class="empty">
            <text>没有找到匹配动作，可以换个关键词或刷新在线库。</text>
          </view>
        </template>
      </view>

      <view v-if="sourceMode === 'local' && selectedLocal" class="detail">
        <view class="detail-head">
          <view>
            <text class="detail-name">{{ selectedLocal.name }}</text>
            <text class="detail-meta">{{ bodyPartName(selectedLocal.bodyPart) }} · {{ EQUIPMENT_LABELS[selectedLocal.equipment] }}</text>
          </view>
          <text class="level">{{ LEVEL_LABELS[selectedLocal.level] }}</text>
        </view>

        <view class="detail-block">
          <text class="block-title">主要发力</text>
          <view class="tags">
            <text v-for="muscle in selectedLocal.primaryMuscles" :key="muscle" class="tag strong">{{ muscle }}</text>
            <text v-for="muscle in selectedLocal.secondaryMuscles" :key="muscle" class="tag">{{ muscle }}</text>
          </view>
        </view>

        <view class="detail-block">
          <text class="block-title">动作提示</text>
          <text v-for="cue in selectedLocal.cues" :key="cue" class="line">· {{ cue }}</text>
        </view>

        <view class="detail-block">
          <text class="block-title">常见问题</text>
          <text v-for="mistake in selectedLocal.mistakes" :key="mistake" class="line warning">· {{ mistake }}</text>
        </view>

        <view class="actions">
          <button class="primary" :disabled="isNavigating" @click="addToTraining(selectedLocal.name, selectedLocal.bodyPart)">{{ isNavigating ? '打开中...' : '加入今日训练' }}</button>
          <button class="secondary" :disabled="isNavigating" @click="addToTemplate(selectedLocal.name, selectedLocal.bodyPart)">{{ isNavigating ? '打开中...' : '加入模板' }}</button>
        </view>
      </view>

      <view v-if="sourceMode === 'online' && selectedOnline" class="detail">
        <image v-if="exerciseGif(selectedOnline)" class="gif" :src="exerciseGif(selectedOnline)" mode="aspectFit" />
        <view class="detail-head online">
          <view>
            <text class="detail-name">{{ formatExerciseName(selectedOnline.name) }}</text>
            <text class="detail-meta">{{ formatTags(selectedOnline.bodyParts) }} · {{ formatTags(selectedOnline.equipments) }}</text>
          </view>
          <text class="level">GIF 演示</text>
        </view>

        <view class="detail-block">
          <text class="block-title">目标肌群</text>
          <view class="tags">
            <text v-for="muscle in selectedOnline.targetMuscles" :key="muscle" class="tag strong">{{ formatTags([muscle]) }}</text>
            <text v-for="muscle in selectedOnline.secondaryMuscles" :key="muscle" class="tag">{{ formatTags([muscle]) }}</text>
          </view>
        </view>

        <view class="detail-block">
          <text class="block-title">动作步骤</text>
          <text v-for="step in selectedOnline.instructions" :key="step" class="line">· {{ formatStep(step) }}</text>
        </view>

        <view class="actions">
          <button class="primary" :disabled="isNavigating" @click="addToTraining(formatExerciseName(selectedOnline.name), mapOnlineBodyPart(selectedOnline.bodyParts))">{{ isNavigating ? '打开中...' : '加入今日训练' }}</button>
          <button class="secondary" :disabled="isNavigating" @click="addToTemplate(formatExerciseName(selectedOnline.name), mapOnlineBodyPart(selectedOnline.bodyParts))">{{ isNavigating ? '打开中...' : '加入模板' }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  BODY_PART_OPTIONS,
  EQUIPMENT_LABELS,
  EQUIPMENT_OPTIONS,
  EXERCISE_LIBRARY,
  LEVEL_LABELS,
  type ExerciseBodyPart,
  type ExerciseEquipment,
  type ExerciseLibraryItem
} from '@/services/exercise-library.local'
import { exerciseDbService, type ExerciseDbItem, type ExerciseDbSource } from '@/services/exercisedb.local'
import { translateExerciseName } from '@/utils/exercise-name-translate'
import { hasExerciseGif, resolveExerciseGif } from '@/services/exercise-media.local'
import { translateExerciseStep, translateExerciseTags } from '@/utils/exercise-content-translate'
import { useMiniProgramShare } from '@/utils/share'

type SourceMode = 'local' | 'online'

useMiniProgramShare({
  title: 'FitAI 动作库：查动作演示和训练提示'
})

const sourceMode = ref<SourceMode>('local')
const keyword = ref('')
const bodyPartFilter = ref<ExerciseBodyPart | 'all'>('all')
const equipmentFilter = ref<ExerciseEquipment | 'all'>('all')
const selectedLocal = ref<ExerciseLibraryItem | null>(EXERCISE_LIBRARY[0] || null)
const selectedOnline = ref<ExerciseDbItem | null>(null)
const onlineExercises = ref<ExerciseDbItem[]>([])
const onlineLoading = ref(false)
const onlineError = ref('')
const onlineNotice = ref('')
const onlineSource = ref<ExerciseDbSource | ''>('')
const onlineLimit = ref(20)
const showAllOnline = ref(false)
const isNavigating = ref(false)

const bodyPartLabels: Record<ExerciseBodyPart, string> = {
  chest: '胸',
  back: '背',
  shoulders: '肩',
  arms: '手臂',
  legs: '腿臀',
  core: '核心',
  full: '全身',
  cardio: '有氧'
}

const onlineStatusText = computed(() => {
  if (onlineLoading.value) return '正在加载 ExerciseDB 动作库，首次打开会多花几秒...'
  if (onlineError.value) return onlineError.value
  if (onlineNotice.value) return onlineNotice.value
  if (!onlineExercises.value.length) return '点击刷新或切换到 ExerciseDB 后加载在线动作，避免免费接口访问过频。'
  if (onlineSource.value === 'cache') return '当前显示本地缓存动作，刷新可尝试获取最新 ExerciseDB。'
  if (onlineSource.value === 'snapshot') return '当前显示内置演示动作，在线库可用后会展示更多 GIF。'
  if (!showAllOnline.value) return `当前优先展示 ${optimizedOnlineCount.value} 个带 GIF 演示的 ExerciseDB 动作。搜不到时再查看更多文字动作。`
  return `正在显示更多文字动作：部分动作没有 GIF 演示，名称仅供搜索参考。`
})

const filteredLocalExercises = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  return EXERCISE_LIBRARY.filter((item) => {
    if (bodyPartFilter.value !== 'all' && item.bodyPart !== bodyPartFilter.value) return false
    if (equipmentFilter.value !== 'all' && item.equipment !== equipmentFilter.value) return false
    if (!key) return true
    const haystack = [
      item.name,
      bodyPartLabels[item.bodyPart],
      EQUIPMENT_LABELS[item.equipment],
      ...(item.aliases || []),
      ...item.primaryMuscles,
      ...item.secondaryMuscles
    ].join(' ').toLowerCase()
    return haystack.includes(key)
  })
})

const filteredOnlineExercises = computed(() => {
  const key = keyword.value.trim().toLowerCase()
  const list = Array.isArray(onlineExercises.value) ? onlineExercises.value : []
  return list.filter((item) => {
    if (!showAllOnline.value && !hasExerciseGif(item.exerciseId, item.gifUrl)) return false
    if (bodyPartFilter.value !== 'all' && mapOnlineBodyPart(item.bodyParts) !== bodyPartFilter.value) return false
    if (equipmentFilter.value !== 'all' && mapOnlineEquipment(item.equipments) !== equipmentFilter.value) return false
    if (!key) return true
    const haystack = [
      item.name,
      formatExerciseName(item.name),
      ...item.bodyParts,
      ...item.equipments,
      ...item.targetMuscles,
      ...item.secondaryMuscles
    ].join(' ').toLowerCase()
    return haystack.includes(key)
  }).sort((a, b) => Number(hasExerciseGif(b.exerciseId, b.gifUrl)) - Number(hasExerciseGif(a.exerciseId, a.gifUrl)))
})

const optimizedOnlineCount = computed(() => {
  return onlineExercises.value.filter((item) => hasExerciseGif(item.exerciseId, item.gifUrl)).length
})

const visibleOnlineExercises = computed(() => filteredOnlineExercises.value.slice(0, onlineLimit.value))
const onlineLocalMatches = computed(() => {
  if (sourceMode.value !== 'online' || !keyword.value.trim()) return []
  return filteredLocalExercises.value.slice(0, 12)
})

watch(sourceMode, (mode) => {
  if (mode === 'online' && onlineExercises.value.length === 0) loadOnlineExercises()
})

watch([keyword, bodyPartFilter, equipmentFilter], () => {
  onlineLimit.value = 20
  if (!keyword.value.trim()) showAllOnline.value = false
})

watch(showAllOnline, () => {
  onlineLimit.value = 20
})

function bodyPartName(value: ExerciseBodyPart) {
  return bodyPartLabels[value]
}

function formatExerciseName(name: string) {
  return translateExerciseName(name)
}

function formatTags(values: string[]) {
  return translateExerciseTags(values)
}

function exerciseGif(item: ExerciseDbItem) {
  return resolveExerciseGif(item.exerciseId, item.gifUrl)
}

function formatStep(step: string) {
  return translateExerciseStep(step)
}

function selectLocal(item: ExerciseLibraryItem) {
  selectedLocal.value = item
}

function selectLocalMatch(item: ExerciseLibraryItem) {
  selectedLocal.value = item
  sourceMode.value = 'local'
}

function selectOnline(item: ExerciseDbItem) {
  selectedOnline.value = item
}

async function loadOnlineExercises(forceRefresh = false) {
  if (onlineLoading.value) return
  onlineLoading.value = true
  onlineError.value = ''
  onlineNotice.value = ''
  try {
    const result = await exerciseDbService.getExercisesWithMeta(forceRefresh)
    onlineExercises.value = Array.isArray(result.items) ? result.items : []
    onlineSource.value = result.source
    onlineNotice.value = result.stale ? result.message : ''
    if (!selectedOnline.value && onlineExercises.value.length) selectedOnline.value = onlineExercises.value[0]
  } catch (error: any) {
    onlineSource.value = ''
    onlineError.value = error?.message || '在线动作库访问失败，本地常用动作仍可正常使用。'
  } finally {
    onlineLoading.value = false
  }
}

function refreshOnline() {
  sourceMode.value = 'online'
  loadOnlineExercises(true)
}

function addToTraining(name: string, bodyPart?: ExerciseBodyPart) {
  if (isNavigating.value) return
  isNavigating.value = true
  uni.setStorageSync('selected_exercise', JSON.stringify({
    name,
    bodyPart: bodyPart === 'cardio' ? 'full' : bodyPart
  }))
  uni.navigateTo({ url: '/pages/training-record/training-record' })
}

function addToTemplate(name: string, bodyPart?: ExerciseBodyPart) {
  if (isNavigating.value) return
  isNavigating.value = true
  uni.setStorageSync('selected_template_action', JSON.stringify({
    name,
    bodyPart: bodyPart === 'cardio' ? 'full' : bodyPart
  }))
  uni.navigateTo({ url: '/pages/templates/templates' })
}

function mapOnlineBodyPart(parts: string[] = []): ExerciseBodyPart {
  const text = parts.join(' ').toLowerCase()
  if (text.includes('chest')) return 'chest'
  if (text.includes('back')) return 'back'
  if (text.includes('shoulder')) return 'shoulders'
  if (text.includes('arm') || text.includes('biceps') || text.includes('triceps')) return 'arms'
  if (text.includes('leg') || text.includes('upper legs') || text.includes('lower legs')) return 'legs'
  if (text.includes('waist') || text.includes('abs')) return 'core'
  if (text.includes('cardio')) return 'cardio'
  return 'full'
}

function mapOnlineEquipment(equipments: string[] = []): ExerciseEquipment {
  const text = equipments.join(' ').toLowerCase()
  if (text.includes('barbell')) return 'barbell'
  if (text.includes('dumbbell')) return 'dumbbell'
  if (text.includes('cable') || text.includes('leverage')) return 'cable'
  if (text.includes('machine') || text.includes('sled')) return 'machine'
  if (text.includes('body weight')) return 'bodyweight'
  if (text.includes('cardio')) return 'cardio'
  return 'other'
}

onShow(() => {
  isNavigating.value = false
})
</script>

<style lang="scss" scoped>
.exercise-page { min-height: 100vh; padding: 24rpx; background: #f4f6f8; box-sizing: border-box; }
.top { display: flex; align-items: flex-end; justify-content: space-between; gap: 24rpx; padding: 34rpx; border-radius: 16rpx; background: #101820; color: #fff; }
.eyebrow, .count, .exercise-meta, .detail-meta, .line, .online-status { display: block; color: #718096; font-size: 24rpx; }
.eyebrow { color: rgba(255,255,255,.72); }
.title { display: block; margin-top: 8rpx; font-size: 40rpx; font-weight: 800; line-height: 1.2; }
.refresh { flex-shrink: 0; margin: 0; padding: 0 24rpx; height: 64rpx; line-height: 64rpx; border-radius: 32rpx; background: #22c55e; color: #101820; font-size: 24rpx; font-weight: 800; }
.refresh[disabled], .add-btn[disabled], .primary[disabled], .secondary[disabled] { opacity: .65; }
.tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8rpx; margin: 20rpx 0 14rpx; padding: 8rpx; border-radius: 14rpx; background: #e2e8f0; }
.tab { height: 68rpx; border-radius: 12rpx; color: #4a5568; font-size: 26rpx; font-weight: 800; line-height: 68rpx; text-align: center; }
.tab.active { background: #fff; color: #101820; box-shadow: 0 8rpx 18rpx rgba(16,24,32,.08); }
.search-box { margin-bottom: 16rpx; padding: 0 22rpx; border-radius: 12rpx; background: #fff; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
input { height: 84rpx; color: #101820; font-size: 28rpx; }
.filter-scroll { width: 100%; margin-bottom: 14rpx; white-space: nowrap; }
.filter-row { display: flex; gap: 12rpx; padding-right: 24rpx; }
.chip { flex-shrink: 0; padding: 14rpx 22rpx; border-radius: 999rpx; background: #fff; color: #2d3748; font-size: 24rpx; font-weight: 700; }
.chip.quiet { background: #edf2f7; }
.chip.active { background: #22c55e; color: #101820; }
.online-status { margin-bottom: 14rpx; padding: 18rpx 22rpx; border-radius: 12rpx; background: #fff; }
.online-mode { display: block; margin-top: 10rpx; color: #101820; font-size: 24rpx; font-weight: 800; }
.layout { display: grid; grid-template-columns: 1fr; gap: 20rpx; }
.exercise-card, .detail { background: #fff; border-radius: 12rpx; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
.match-section { margin-bottom: 18rpx; }
.match-title { display: block; margin: 0 0 12rpx 4rpx; color: #4a5568; font-size: 24rpx; font-weight: 800; }
.exercise-card { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; margin-bottom: 16rpx; padding: 22rpx; border: 2rpx solid transparent; }
.exercise-card.selected { border-color: #22c55e; }
.thumb { flex-shrink: 0; width: 96rpx; height: 96rpx; border-radius: 12rpx; background: #edf2f7; }
.card-main { min-width: 0; flex: 1; }
.exercise-name, .detail-name, .block-title { display: block; color: #101820; font-size: 30rpx; font-weight: 800; }
.exercise-meta { margin-top: 8rpx; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.add-btn { flex-shrink: 0; margin: 0; padding: 0 24rpx; height: 60rpx; line-height: 60rpx; border-radius: 30rpx; background: #101820; color: #fff; font-size: 24rpx; font-weight: 800; }
.load-more { margin: 4rpx 0 20rpx; height: 72rpx; line-height: 72rpx; border-radius: 36rpx; background: #edf2f7; color: #2d3748; font-size: 24rpx; font-weight: 800; }
.empty { padding: 48rpx 20rpx; color: #718096; font-size: 26rpx; text-align: center; }
.detail { padding: 28rpx; }
.gif { width: 100%; height: 420rpx; margin-bottom: 20rpx; border-radius: 12rpx; background: #f8fafc; }
.detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; padding-bottom: 22rpx; border-bottom: 1rpx solid #edf2f7; }
.detail-head.online { border-bottom: 0; padding-bottom: 0; }
.detail-name { font-size: 34rpx; }
.detail-meta { margin-top: 8rpx; }
.level { flex-shrink: 0; padding: 8rpx 14rpx; border-radius: 999rpx; background: #dcfce7; color: #166534; font-size: 22rpx; font-weight: 800; }
.detail-block { margin-top: 24rpx; }
.block-title { margin-bottom: 12rpx; font-size: 26rpx; }
.tags { display: flex; flex-wrap: wrap; gap: 10rpx; }
.tag { padding: 8rpx 14rpx; border-radius: 8rpx; background: #edf2f7; color: #4a5568; font-size: 22rpx; }
.tag.strong { background: #101820; color: #fff; }
.line { margin-top: 8rpx; color: #2d3748; line-height: 1.55; }
.line.warning { color: #b45309; }
.actions { display: grid; grid-template-columns: 1fr; gap: 14rpx; margin-top: 28rpx; }
.primary, .secondary { margin: 0; height: 78rpx; line-height: 78rpx; border-radius: 39rpx; font-size: 26rpx; font-weight: 800; }
.primary { background: #22c55e; color: #101820; }
.secondary { background: #edf2f7; color: #2d3748; }

/* Fresh premium visual layer */
.exercise-page {
  background:
    radial-gradient(circle at 88% 0%, rgba(79, 140, 255, .14), transparent 30%),
    linear-gradient(180deg, #f9fcff 0%, #f4f8fb 48%, #f7fafc 100%);
}

.top {
  display: block;
  border: 1rpx solid rgba(255, 255, 255, .95);
  border-radius: 34rpx;
  background:
    radial-gradient(circle at 90% 12%, rgba(83, 215, 182, .18), transparent 32%),
    linear-gradient(145deg, #ffffff 0%, #edf7ff 100%);
  color: #18212f;
  box-shadow: 0 16rpx 42rpx rgba(71, 98, 128, .12);
}

.eyebrow {
  color: #768398;
}

.title {
  color: #18212f;
  font-size: 44rpx;
  font-weight: 900;
}

.refresh {
  margin-top: 24rpx;
  min-width: 140rpx;
  background: linear-gradient(135deg, #4f8cff 0%, #5fb7ff 100%);
  color: #fff;
  box-shadow: 0 12rpx 28rpx rgba(79, 140, 255, .22);
}

.tabs {
  background: #e7eef4;
}

.tab {
  color: #768398;
}

.tab.active {
  color: #4f8cff;
}

.search-box,
.online-status,
.exercise-card,
.detail {
  border: 1rpx solid rgba(223, 232, 239, .9);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, .92);
  box-shadow: 0 8rpx 24rpx rgba(71, 98, 128, .07);
}

input {
  color: #344154;
}

.chip,
.chip.quiet,
.load-more,
.secondary {
  background: #eef4f8;
  color: #344154;
}

.chip.active {
  background: #e8f1ff;
  color: #4f8cff;
}

.exercise-card {
  border-color: rgba(223, 232, 239, .9);
}

.exercise-card.selected {
  border-color: #4f8cff;
  background: #f7fbff;
}

.exercise-name,
.detail-name,
.block-title {
  color: #18212f;
  font-weight: 900;
}

.count,
.exercise-meta,
.detail-meta,
.line,
.online-status,
.match-title {
  color: #768398;
}

.thumb,
.gif {
  background: #e8f1ff;
}

.add-btn,
.primary {
  background: linear-gradient(135deg, #4f8cff 0%, #5fb7ff 100%);
  color: #fff;
  box-shadow: 0 10rpx 24rpx rgba(79, 140, 255, .2);
}

.level,
.tag.strong {
  background: #e9fbf6;
  color: #16856c;
}

.tag {
  background: #eef4f8;
  color: #344154;
}

.line.warning {
  color: #805421;
}
</style>

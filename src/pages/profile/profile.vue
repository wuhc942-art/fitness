<template>
  <view class="profile-page">
    <view class="hero">
      <view class="avatar">{{ avatarText }}</view>
      <view class="hero-copy">
        <text class="nickname">{{ profile.nickname }}</text>
        <text class="member">本地训练档案 · {{ growth.levelName }}</text>
      </view>
      <button class="edit-btn" @click="showEdit = true">编辑</button>
    </view>

    <view class="level-card">
      <view class="level-head">
        <view>
          <text class="level-title">Lv.{{ growth.level }}</text>
          <text class="level-desc">{{ growth.points }} 成长积分 · 下一级 {{ growth.nextLevelPoints }}</text>
        </view>
        <text class="level-name">{{ growth.levelName }}</text>
      </view>
      <view class="progress-track">
        <view class="progress-fill" :style="{ width: growth.progress + '%' }"></view>
      </view>
    </view>

    <view class="stats-grid">
      <view class="stat-item">
        <text class="stat-value">{{ growth.stats.trainingCount }}</text>
        <text class="stat-label">训练记录</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ Math.round(growth.stats.totalDuration / 60) }}</text>
        <text class="stat-label">训练小时</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ growth.stats.planCount }}</text>
        <text class="stat-label">训练计划</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ growth.stats.bodyRecordCount }}</text>
        <text class="stat-label">身体记录</text>
      </view>
    </view>

    <view class="panel ability-panel">
      <view class="panel-head">
        <text class="panel-title">训练能力</text>
        <text class="panel-note">已启用</text>
      </view>
      <view class="ability-summary">
        <view>
          <text class="ability-kicker">成长积分</text>
          <text class="ability-score">{{ growth.points }}</text>
        </view>
        <view class="ability-next">
          <text class="ability-next-label">下一步</text>
          <text class="ability-next-text">{{ nextAbilityText }}</text>
        </view>
      </view>
      <view class="feature-list">
        <view v-for="item in abilityFeatures" :key="item.title" class="feature-row" :class="item.tone">
          <view class="feature-copy">
            <text class="feature-title">{{ item.title }}</text>
            <text class="feature-desc">{{ item.desc }}</text>
          </view>
          <text class="feature-status">{{ item.status }}</text>
        </view>
      </view>
    </view>

    <view class="panel data-panel">
      <view class="panel-head">
        <text class="panel-title">数据管理</text>
        <text class="panel-note">本机保存</text>
      </view>
      <text class="about-text">训练记录、计划、身体数据和饮食记录会保存在当前小程序本地。建议定期导出备份，换机或清理缓存前先保存数据。</text>
      <button class="settings-btn" @click="goSettings">备份与恢复</button>
    </view>

    <view v-if="showEdit" class="modal-mask" @click="closeEditModal">
      <view class="modal" @click.stop>
        <view class="modal-head">
          <text class="modal-title">编辑资料</text>
          <text class="modal-close" @click="closeEditModal">×</text>
        </view>
        <view class="modal-body">
          <view class="field">
            <text class="label">昵称</text>
            <input v-model="profile.nickname" maxlength="16" placeholder="FitAI 用户" />
          </view>
        </view>
        <view class="modal-actions">
          <button class="cancel" :disabled="isSaving" @click="closeEditModal">取消</button>
          <button class="confirm" :disabled="isSaving" @click="saveProfile">{{ isSaving ? '保存中...' : '保存' }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { userServiceLocal, type UserGrowth, type UserProfile } from '@/services/user.local'

const profile = reactive<UserProfile>({
  nickname: 'FitAI 用户',
  avatar: '',
  memberStatus: 'free',
  createdAt: '',
  updatedAt: ''
})
const growth = reactive<UserGrowth>({
  points: 0,
  level: 1,
  levelName: '刚刚开始',
  nextLevelPoints: 120,
  progress: 0,
  stats: {
    trainingCount: 0,
    bodyRecordCount: 0,
    planCount: 0,
    totalDuration: 0
  }
})
const showEdit = ref(false)
const isSaving = ref(false)

const avatarText = computed(() => (profile.nickname || 'F').slice(0, 1).toUpperCase())
const nextAbilityText = computed(() => {
  if (growth.stats.trainingCount < 3) return '累计 3 次训练，生成更可靠的分析'
  if (growth.stats.planCount === 0) return '创建训练计划，让首页任务更准确'
  if (growth.stats.bodyRecordCount === 0) return '记录一次身体数据，完善成长画像'
  return '保持记录节奏，继续提升等级'
})
const abilityFeatures = computed(() => [
  {
    title: '基础训练记录',
    desc: `已累计 ${growth.stats.trainingCount} 次训练`,
    status: '可用',
    tone: 'ready'
  },
  {
    title: '训练计划',
    desc: growth.stats.planCount > 0 ? `已创建 ${growth.stats.planCount} 个计划` : '创建计划后可安排每周训练',
    status: '可用',
    tone: 'active'
  },
  {
    title: '训练分析',
    desc: growth.stats.trainingCount > 0 ? '结合训练记录查看进步趋势' : '完成训练后开始分析',
    status: growth.stats.trainingCount > 0 ? '可用' : '待记录',
    tone: growth.stats.trainingCount > 0 ? 'active' : 'locked'
  },
  {
    title: '身体数据',
    desc: growth.stats.bodyRecordCount > 0 ? `已记录 ${growth.stats.bodyRecordCount} 条身体数据` : '记录体重和围度，观察长期变化',
    status: growth.stats.bodyRecordCount > 0 ? '可用' : '待记录',
    tone: growth.stats.bodyRecordCount > 0 ? 'ready' : 'locked'
  },
  {
    title: '饮食记录',
    desc: '记录每日饮食并查看基础营养建议',
    status: '可用',
    tone: 'ready'
  },
  {
    title: '数据备份',
    desc: '在设置中导出或导入本地备份文件',
    status: '可用',
    tone: 'active'
  }
])

const goSettings = () => uni.navigateTo({ url: '/pages/settings/settings' })

const load = async () => {
  Object.assign(profile, await userServiceLocal.getProfile())
  Object.assign(growth, await userServiceLocal.getGrowth())
}

const closeEditModal = () => {
  if (isSaving.value) return
  showEdit.value = false
}

const saveProfile = async () => {
  if (isSaving.value) return
  if (!profile.nickname.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  try {
    isSaving.value = true
    Object.assign(profile, await userServiceLocal.saveProfile({ ...profile, nickname: profile.nickname.trim() }))
    showEdit.value = false
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (error: any) {
    uni.showToast({ title: error?.message || '保存失败', icon: 'none' })
  } finally {
    isSaving.value = false
  }
}

onMounted(load)
onShow(load)
</script>

<style lang="scss" scoped>
.profile-page { min-height: 100vh; padding: 24rpx 24rpx 48rpx; background: #f4f6f8; box-sizing: border-box; }
.hero { display: flex; align-items: center; gap: 20rpx; padding: 36rpx; border-radius: 16rpx; background: #101820; color: #fff; }
.avatar { flex-shrink: 0; width: 96rpx; height: 96rpx; border-radius: 28rpx; background: #22c55e; color: #101820; font-size: 44rpx; font-weight: 900; line-height: 96rpx; text-align: center; }
.hero-copy { min-width: 0; flex: 1; }
.nickname { display: block; color: #fff; font-size: 38rpx; font-weight: 900; }
.member, .level-desc, .panel-note, .about-text { display: block; color: #718096; font-size: 23rpx; line-height: 1.45; }
.member { margin-top: 8rpx; color: rgba(255,255,255,.72); }
.edit-btn { flex-shrink: 0; margin: 0; width: 104rpx; height: 64rpx; line-height: 64rpx; border-radius: 32rpx; background: #fff; color: #101820; font-size: 24rpx; font-weight: 900; }
.level-card, .panel, .stat-item { margin-top: 20rpx; border-radius: 12rpx; background: #fff; box-shadow: 0 8rpx 24rpx rgba(16,24,32,.06); }
.level-card { padding: 28rpx; }
.level-head, .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; }
.level-title { display: block; color: #101820; font-size: 40rpx; font-weight: 900; }
.level-name { flex-shrink: 0; color: #16a34a; font-size: 26rpx; font-weight: 900; }
.progress-track { height: 18rpx; margin-top: 22rpx; border-radius: 999rpx; background: #edf2f7; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999rpx; background: #22c55e; }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16rpx; margin-top: 20rpx; }
.stat-item { margin-top: 0; padding: 24rpx 12rpx; text-align: center; }
.stat-value { display: block; color: #101820; font-size: 38rpx; font-weight: 900; }
.stat-label { display: block; margin-top: 8rpx; color: #718096; font-size: 22rpx; }
.panel { padding: 28rpx; }
.panel-head { margin-bottom: 18rpx; }
.panel-title { color: #101820; font-size: 30rpx; font-weight: 900; }
.ability-panel { overflow: hidden; }
.ability-summary { display: flex; align-items: stretch; gap: 16rpx; margin-bottom: 18rpx; padding: 20rpx; border-radius: 18rpx; background: linear-gradient(135deg, #e8f1ff 0%, #e9fbf6 100%); border: 1rpx solid #dbe8f1; }
.ability-summary > view:first-child { flex-shrink: 0; width: 132rpx; }
.ability-kicker, .ability-next-label, .feature-desc { display: block; color: #5d6d82; font-size: 22rpx; line-height: 1.35; font-weight: 800; }
.ability-score { display: block; margin-top: 4rpx; color: #18212f; font-size: 42rpx; line-height: 1.05; font-weight: 950; }
.ability-next { flex: 1; min-width: 0; padding-left: 16rpx; border-left: 1rpx solid rgba(104, 119, 140, .22); }
.ability-next-text { display: block; margin-top: 6rpx; color: #18212f; font-size: 25rpx; line-height: 1.45; font-weight: 900; }
.feature-list { display: flex; flex-direction: column; gap: 12rpx; }
.feature-row { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; padding: 18rpx 18rpx 18rpx 20rpx; border-radius: 16rpx; background: #f8fafc; border: 1rpx solid #edf2f7; }
.feature-row.active { background: #f3f8ff; border-color: #d9e8ff; }
.feature-row.ready { background: #f3fbf8; border-color: #d8f3eb; }
.feature-row.locked { background: #f7f9fb; border-color: #e4ebf1; }
.feature-copy { min-width: 0; flex: 1; }
.feature-title { display: block; color: #18212f; font-size: 26rpx; line-height: 1.35; font-weight: 900; }
.feature-desc { margin-top: 4rpx; color: #5d6d82; font-weight: 700; }
.feature-status { flex-shrink: 0; min-width: 88rpx; padding: 8rpx 12rpx; border-radius: 999rpx; background: #eef4f8; color: #344154; font-size: 21rpx; line-height: 1.2; font-weight: 900; text-align: center; }
.feature-row.active .feature-status { background: #e8f1ff; color: #2f6fd6; }
.feature-row.ready .feature-status { background: #e9fbf6; color: #16856c; }
.feature-row.locked .feature-status { background: #e9eef3; color: #68778c; }
.data-panel { padding-bottom: 24rpx; }
.settings-btn { margin: 20rpx 0 0; width: 100%; height: 76rpx; line-height: 76rpx; border-radius: 38rpx; background: #4f8cff; color: #fff; font-size: 27rpx; font-weight: 900; box-shadow: 0 12rpx 24rpx rgba(79,140,255,.22); }
.settings-btn:active { transform: translateY(1rpx); }
.modal-mask { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 20; display: flex; align-items: flex-end; background: rgba(16,24,32,.52); }
.modal { width: 100%; border-radius: 24rpx 24rpx 0 0; background: #fff; overflow: hidden; }
.modal-head, .modal-actions { display: flex; align-items: center; justify-content: space-between; padding: 28rpx; border-bottom: 1rpx solid #edf2f7; }
.modal-title { color: #101820; font-size: 32rpx; font-weight: 900; }
.modal-close { color: #718096; font-size: 44rpx; }
.modal-body { padding: 0 28rpx 28rpx; }
.field { margin-top: 24rpx; }
.label { display: block; margin-bottom: 12rpx; color: #4a5568; font-size: 24rpx; font-weight: 800; }
input { width: 100%; height: 76rpx; padding: 0 20rpx; border-radius: 10rpx; background: #f8fafc; color: #101820; font-size: 28rpx; box-sizing: border-box; }
.modal-actions { gap: 16rpx; border-top: 1rpx solid #edf2f7; border-bottom: 0; }
.modal-actions button { flex: 1; height: 78rpx; line-height: 78rpx; border-radius: 39rpx; font-size: 28rpx; font-weight: 900; }
.modal-actions button[disabled] { opacity: .65; }
.cancel { background: #edf2f7; color: #2d3748; }
.confirm { background: #22c55e; color: #101820; }
</style>

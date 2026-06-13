<template>
  <view class="profile-page">
    <view class="hero">
      <view class="avatar">{{ avatarText }}</view>
      <view class="hero-copy">
        <text class="nickname">{{ profile.nickname }}</text>
        <text class="member">{{ profile.memberStatus === 'vip' ? 'VIP会员' : '免费版' }} · {{ growth.levelName }}</text>
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

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">会员能力</text>
        <text class="panel-note">{{ profile.memberStatus === 'vip' ? '已开启' : '规划中' }}</text>
      </view>
      <view class="feature-list">
        <view v-for="item in features" :key="item" class="feature-row">
          <text>{{ item }}</text>
        </view>
      </view>
    </view>

    <view class="panel">
      <view class="panel-head">
        <text class="panel-title">微信登录</text>
        <text class="panel-note">待接入</text>
      </view>
      <text class="about-text">当前为本地用户中心。后续接入云端后，可以使用微信头像昵称、同步数据、会员状态和成长积分。</text>
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
          <view class="field">
            <text class="label">会员状态</text>
            <view class="segmented">
              <view class="seg-item" :class="{ active: profile.memberStatus === 'free' }" @click="profile.memberStatus = 'free'">免费版</view>
              <view class="seg-item" :class="{ active: profile.memberStatus === 'vip' }" @click="profile.memberStatus = 'vip'">VIP</view>
            </view>
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
const features = ['基础训练记录', 'AI训练计划', 'AI训练分析', 'AI饮食建议', '数据导出', '云端同步（待接入）']

const avatarText = computed(() => (profile.nickname || 'F').slice(0, 1).toUpperCase())

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
.feature-list { display: flex; flex-direction: column; gap: 12rpx; }
.feature-row { padding: 18rpx 20rpx; border-radius: 12rpx; background: #f8fafc; color: #2d3748; font-size: 25rpx; }
.modal-mask { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 20; display: flex; align-items: flex-end; background: rgba(16,24,32,.52); }
.modal { width: 100%; border-radius: 24rpx 24rpx 0 0; background: #fff; overflow: hidden; }
.modal-head, .modal-actions { display: flex; align-items: center; justify-content: space-between; padding: 28rpx; border-bottom: 1rpx solid #edf2f7; }
.modal-title { color: #101820; font-size: 32rpx; font-weight: 900; }
.modal-close { color: #718096; font-size: 44rpx; }
.modal-body { padding: 0 28rpx 28rpx; }
.field { margin-top: 24rpx; }
.label { display: block; margin-bottom: 12rpx; color: #4a5568; font-size: 24rpx; font-weight: 800; }
input { width: 100%; height: 76rpx; padding: 0 20rpx; border-radius: 10rpx; background: #f8fafc; color: #101820; font-size: 28rpx; box-sizing: border-box; }
.segmented { display: grid; grid-template-columns: 1fr 1fr; gap: 10rpx; padding: 8rpx; border-radius: 12rpx; background: #edf2f7; }
.seg-item { height: 62rpx; border-radius: 10rpx; color: #4a5568; font-size: 24rpx; font-weight: 900; line-height: 62rpx; text-align: center; }
.seg-item.active { background: #101820; color: #fff; }
.modal-actions { gap: 16rpx; border-top: 1rpx solid #edf2f7; border-bottom: 0; }
.modal-actions button { flex: 1; height: 78rpx; line-height: 78rpx; border-radius: 39rpx; font-size: 28rpx; font-weight: 900; }
.modal-actions button[disabled] { opacity: .65; }
.cancel { background: #edf2f7; color: #2d3748; }
.confirm { background: #22c55e; color: #101820; }
</style>

<template>
  <view class="edit-plan-page">
    <view class="page-header">
      <text class="page-title">编辑计划</text>
    </view>

    <view class="form-container">
      <view class="form-section">
        <view class="section-title">基本信息</view>
        
        <view class="form-item">
          <text class="label">计划名称</text>
          <input class="input" v-model="formData.name" placeholder="计划名称" maxlength="30" />
        </view>

        <view class="form-item">
          <text class="label">计划描述</text>
          <textarea class="textarea" v-model="formData.description" placeholder="计划描述" maxlength="200" />
        </view>

        <view class="form-item">
          <text class="label">状态</text>
          <picker :range="statusOptions" :value="statusIndex" @change="onStatusChange">
            <view class="picker">{{ statusOptions[statusIndex] }}</view>
          </picker>
        </view>
      </view>

      <view class="action-buttons">
        <button class="btn btn-primary" :disabled="isSaving" @click="savePlan">{{ isSaving ? '保存中...' : '保存修改' }}</button>
        <button class="btn btn-outline" :disabled="isSaving" @click="navigateBack">取消</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { trainingPlanServiceLocal } from '@/services/training-plan.local'
import type { TrainingPlan } from '@/types/training-plan'
import { useMiniProgramShare } from '@/utils/share'

useMiniProgramShare({
  title: 'FitAI 健身记录：调整训练计划'
})

const planId = ref<string>('')
const plan = ref<TrainingPlan | null>(null)
const isSaving = ref(false)

const formData = ref({ name: '', description: '' })
const statusOptions = ['进行中', '已暂停', '已完成', '已归档']
const statusIndex = ref(0)
const statusMap: Record<string, number> = { active: 0, paused: 1, completed: 2, archived: 3 }
const statusReverse = ['active', 'paused', 'completed', 'archived']

const loadPlan = async () => {
  try {
    plan.value = await trainingPlanServiceLocal.getPlanById(planId.value)
    if (plan.value) {
      formData.value = { name: plan.value.name, description: plan.value.description || '' }
      statusIndex.value = statusMap[plan.value.status] || 0
    }
  } catch (e) {
    console.error('加载计划失败:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const onStatusChange = (e: any) => {
  statusIndex.value = parseInt(e.detail.value)
}

const savePlan = async () => {
  if (isSaving.value) return
  if (!formData.value.name.trim()) {
    uni.showToast({ title: '请输入计划名称', icon: 'none' })
    return
  }

  try {
    isSaving.value = true
    await trainingPlanServiceLocal.updatePlan(planId.value, {
      name: formData.value.name,
      description: formData.value.description,
      status: statusReverse[statusIndex.value] as any
    })

    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch (e: any) {
    console.error('保存失败:', e)
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
    isSaving.value = false
  }
}

const navigateBack = () => uni.navigateBack()

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  planId.value = currentPage.options?.id || ''
  uni.setNavigationBarTitle({ title: '编辑计划' })
  loadPlan()
})
</script>

<style lang="scss" scoped>
.edit-plan-page { min-height: 100vh; background-color: #f5f5f5; padding-bottom: 40rpx; }
.page-header { padding: 30rpx; background: #fff; margin-bottom: 20rpx; }
.page-title { font-size: 36rpx; font-weight: bold; color: #333; }
.form-container { padding: 0 30rpx; }
.form-section { background: #fff; border-radius: 16rpx; padding: 30rpx; margin-bottom: 20rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 24rpx; }
.form-item { margin-bottom: 24rpx; .label { display: block; font-size: 28rpx; color: #666; margin-bottom: 12rpx; } .input, .textarea, .picker { width: 100%; padding: 20rpx; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; } .textarea { min-height: 160rpx; } }
.action-buttons { margin-top: 40rpx; .btn { width: 100%; height: 88rpx; font-size: 32rpx; font-weight: bold; border-radius: 44rpx; border: none; margin-bottom: 20rpx; &[disabled] { opacity: .65; } &.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; } &.btn-outline { background: #fff; color: #667eea; border: 2rpx solid #667eea; } } }
</style>

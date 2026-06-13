<template>
  <view class="chart-container" :style="{ height: height + 'px' }">
    <view v-if="loading" class="chart-loading">
      <view class="loading-spinner"></view>
      <text class="loading-text">{{ loadingText }}</text>
    </view>
    
    <view v-else-if="error" class="chart-error" @click="handleRetry">
      <text class="error-icon">⚠️</text>
      <text class="error-text">{{ errorText || '加载失败，点击重试' }}</text>
    </view>
    
    <view v-else-if="empty" class="chart-empty">
      <text class="empty-icon">📊</text>
      <text class="empty-text">{{ emptyText || '暂无数据' }}</text>
      <text v-if="emptyTip" class="empty-tip">{{ emptyTip }}</text>
    </view>
    
    <view 
      v-show="!loading && !error && !empty" 
      :id="chartId" 
      class="chart-canvas"
      :style="{ height: (height - 40) + 'px' }"
    ></view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ChartContainer',
  props: {
    chartId: {
      type: String,
      default: 'chart-canvas'
    },
    height: {
      type: Number,
      default: 300
    },
    loading: {
      type: Boolean,
      default: true
    },
    error: {
      type: Boolean,
      default: false
    },
    empty: {
      type: Boolean,
      default: false
    },
    loadingText: {
      type: String,
      default: '加载中...'
    },
    errorText: {
      type: String,
      default: '加载失败，点击重试'
    },
    emptyText: {
      type: String,
      default: '暂无数据'
    },
    emptyTip: {
      type: String,
      default: ''
    }
  },
  emits: ['retry'],
  methods: {
    handleRetry(): void {
      this.$emit('retry')
    }
  }
})
</script>

<style lang="scss" scoped>
.chart-container {
  width: 100%;
  position: relative;
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.chart-loading {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e4e7ed;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

.loading-text {
  font-size: 13px;
  color: #909399;
}

.chart-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
}

.error-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.error-text {
  font-size: 13px;
  color: #f56c6c;
}

.chart-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.empty-tip {
  font-size: 12px;
  color: #c0c4cc;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 750rpx) {
  .chart-container {
    padding: 16px;
  }
}

:deep(.echarts-text) {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>

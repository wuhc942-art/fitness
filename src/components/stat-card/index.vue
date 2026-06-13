<template>
  <view class="stat-card" :class="`stat-card--${size}`">
    <view v-if="icon" class="stat-card__icon">
      <text>{{ icon }}</text>
    </view>
    <view class="stat-card__content">
      <view class="stat-card__title">{{ title }}</view>
      <view class="stat-card__value">
        <text class="value-number">{{ value }}</text>
        <text v-if="unit" class="value-unit">{{ unit }}</text>
      </view>
      <view v-if="trend || subtitle" class="stat-card__footer">
        <text v-if="trend" :class="['trend', `trend-${trend === 'up' ? 'positive' : 'negative'}`]">
          {{ trend === 'up' ? '↑' : '↓' }} {{ trendLabel }}
        </text>
        <text v-if="subtitle" class="subtitle">{{ subtitle }}</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'StatCard',
  props: {
    /** 卡片标题 */
    title: {
      type: String,
      required: true
    },
    /** 显示值 */
    value: {
      type: [String, Number],
      required: true
    },
    /** 单位 */
    unit: {
      type: String,
      default: ''
    },
    /** 图标（emoji 或文字） */
    icon: {
      type: String,
      default: ''
    },
    /** 趋势方向：up（正增长）/ down（负增长） */
    trend: {
      type: String,
      default: ''
    },
    /** 趋势标签 */
    trendLabel: {
      type: String,
      default: ''
    },
    /** 副标题/说明文字 */
    subtitle: {
      type: String,
      default: ''
    },
    /** 尺寸：small, medium, large */
    size: {
      type: String,
      default: 'medium',
      validator: (value: string) => ['small', 'medium', 'large'].includes(value)
    }
  }
})
</script>

<style lang="scss" scoped>
.stat-card {
  display: flex;
  align-items: flex-start;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 6rpx 16rpx rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
  }
  
  // 不同配色方案
  &.stat-card--primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 6rpx 16rpx rgba(102, 126, 234, 0.3);
  }
  
  &.stat-card--success {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    box-shadow: 0 6rpx 16rpx rgba(17, 153, 142, 0.3);
  }
  
  &.stat-card--warning {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    box-shadow: 0 6rpx 16rpx rgba(240, 147, 251, 0.3);
  }
  
  &.stat-card--info {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    box-shadow: 0 6rpx 16rpx rgba(79, 172, 254, 0.3);
  }
  
  // 不同尺寸
  &.stat-card--small {
    padding: 16rpx;
    min-height: 100rpx;
    
    .stat-card__title {
      font-size: 20rpx;
    }
    
    .stat-card__value {
      font-size: 32rpx;
    }
  }
  
  &.stat-card--medium {
    padding: 24rpx;
    min-height: 140rpx;
    
    .stat-card__title {
      font-size: 24rpx;
    }
    
    .stat-card__value {
      font-size: 40rpx;
    }
  }
  
  &.stat-card--large {
    padding: 30rpx;
    min-height: 180rpx;
    
    .stat-card__title {
      font-size: 28rpx;
    }
    
    .stat-card__value {
      font-size: 48rpx;
    }
  }
}

.stat-card__icon {
  margin-right: 16rpx;
  font-size: 36rpx;
  
  .stat-card--small & {
    font-size: 30rpx;
    margin-right: 12rpx;
  }
  
  .stat-card--large & {
    font-size: 48rpx;
    margin-right: 24rpx;
  }
}

.stat-card__content {
  flex: 1;
  min-width: 0;
}

.stat-card__title {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  margin-bottom: 8rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-card__value {
  display: flex;
  align-items: baseline;
  color: #ffffff;
  font-weight: 700;
  margin-bottom: 4rpx;
  
  .value-number {
    font-size: inherit;
  }
  
  .value-unit {
    font-size: 0.6em;
    margin-left: 4rpx;
    opacity: 0.9;
  }
}

.stat-card__footer {
  margin-top: 8rpx;
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.8);
  
  .trend {
    display: inline-flex;
    align-items: center;
    font-weight: 500;
    
    &.trend-positive {
      color: #ffd700;
    }
    
    &.trend-negative {
      color: #ff6b6b;
    }
  }
  
  .subtitle {
    display: block;
    margin-top: 4rpx;
    opacity: 0.8;
  }
}
</style>

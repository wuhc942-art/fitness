<template>
  <view class="heat-map">
    <view class="heat-map__header">
      <text class="heat-map__title">{{ title || '本周训练' }}</text>
      <text class="heat-map__subtitle" v-if="weekData.weekStart">{{ weekLabel }}</text>
    </view>
    
    <view class="heat-map__grid">
      <!-- 星期标签 -->
      <view 
        v-for="(day, index) in weekData.days" 
        :key="index" 
        class="heat-map__day"
      >
        <view class="day-label">{{ day.dayLabel }}</view>
        <view 
          class="day-cell"
          :class="{
            'day-cell--has-training': day.hasTraining,
            'day-cell--today': isToday(day.date)
          }"
          :style="{ backgroundColor: getDayColor(day.hasTraining) }"
        >
          <text class="day-date">{{ day.date.slice(-2) }}</text>
        </view>
      </view>
    </view>
    
    <view class="heat-map__legend" v-if="showLegend">
      <view class="legend-item">
        <view class="legend-color legend-color--empty"></view>
        <text class="legend-text">未训练</text>
      </view>
      <view class="legend-item">
        <view class="legend-color legend-color--trained"></view>
        <text class="legend-text">已训练</text>
      </view>
      <view class="legend-item">
        <view class="legend-color legend-color--today"></view>
        <text class="legend-text">今天</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { HeatMapData } from '@/types'
import { isToday } from '@/utils/date'

export default defineComponent({
  name: 'HeatMap',
  props: {
    weekData: {
      type: Object as PropType<HeatMapData>,
      required: false,
      default: () => ({
        weekStart: '',
        days: []
      })
    },
    title: {
      type: String,
      default: '本周训练'
    },
    showLegend: {
      type: Boolean,
      default: true
    },
    highlightColor: {
      type: String,
      default: '#52c41a'
    },
    emptyColor: {
      type: String,
      default: '#f0f0f0'
    }
  },
  methods: {
    isToday,
    
    getDayColor(hasTraining: boolean): string {
      return hasTraining ? this.highlightColor : this.emptyColor
    }
  },
  computed: {
    weekLabel(): string {
      if (!this.weekData.weekStart) return ''
      return this.weekData.weekStart
    }
  }
})
</script>

<style lang="scss" scoped>
.heat-map {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.heat-map__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.heat-map__title {
  font-size: 28rpx;
  font-weight: 600;
  color: #303133;
}

.heat-map__subtitle {
  font-size: 20rpx;
  color: #909399;
}

.heat-map__grid {
  display: flex;
  justify-content: space-between;
  gap: 12rpx;
}

.heat-map__day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
}

.day-label {
  font-size: 20rpx;
  color: #606266;
  font-weight: 500;
}

.day-cell {
  width: 100%;
  height: 80rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  flex-shrink: 0;
  
  &.day-cell--has-training {
    box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.4);
    
    .day-date {
      color: #fff;
      font-weight: 600;
    }
  }
  
  &.day-cell--today {
    border: 4rpx solid #1890ff;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -6rpx;
      width: 8rpx;
      height: 8rpx;
      background-color: #1890ff;
      border-radius: 50%;
    }
  }
}

.day-date {
  font-size: 24rpx;
  color: #909399;
}

.heat-map__legend {
  display: flex;
  justify-content: center;
  gap: 24rpx;
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 2rpx solid #ebeef5;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.legend-color {
  width: 20rpx;
  height: 20rpx;
  border-radius: 4rpx;
  
  &.legend-color--empty {
    background-color: #f0f0f0;
  }
  
  &.legend-color--trained {
    background-color: #52c41a;
  }
  
  &.legend-color--today {
    background-color: transparent;
    border: 4rpx solid #1890ff;
  }
}

.legend-text {
  font-size: 18rpx;
  color: #909399;
}
</style>

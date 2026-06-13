<template>
  <view class="action-table">
    <!-- 表头 -->
    <view class="table-header">
      <view class="table-row header-row">
        <view class="table-cell cell-name">动作名称</view>
        <view class="table-cell cell-weight">重量 (kg)</view>
        <view class="table-cell cell-reps">次数</view>
        <view class="table-cell cell-sets">组数</view>
        <view class="table-cell cell-volume">训练量</view>
        <view class="table-cell cell-1rm">估算 1RM</view>
        <view v-if="editable" class="table-cell cell-action">操作</view>
      </view>
    </view>

    <!-- 数据行 -->
    <view class="table-body">
      <view v-for="(action, index) in actions" :key="index" class="table-row data-row">
        <view class="table-cell cell-name">
          {{ action.name }}
          <view v-if="action.notes" class="action-notes">{{ action.notes }}</view>
        </view>
        <view class="table-cell cell-weight">{{ action.weight }}</view>
        <view class="table-cell cell-reps">{{ action.reps }}</view>
        <view class="table-cell cell-sets">{{ action.sets }}</view>
        <view class="table-cell cell-volume">{{ action.volume || calculateVolume(action) }}</view>
        <view class="table-cell cell-1rm">{{ (action.estimated1RM || calculate1RM(action)).toFixed(1) }}</view>
        <view v-if="editable" class="table-cell cell-action">
          <button class="action-btn edit-btn" @click="handleEdit(index)">编辑</button>
          <button class="action-btn delete-btn" @click="handleDelete(index)">删除</button>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!actions || actions.length === 0" class="empty-state">
        暂无动作记录
      </view>
    </view>
  </view>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { ActionRecord } from '@/types/training'

export default defineComponent({
  name: 'ActionTable',
  props: {
    /** 动作列表数据 */
    actions: {
      type: Array as PropType<ActionRecord[]>,
      default: () => []
    },
    /** 是否可编辑 */
    editable: {
      type: Boolean,
      default: false
    }
  },
  emits: ['edit', 'delete', 'update'],
  methods: {
    /**
     * 计算训练量
     */
    calculateVolume(action: ActionRecord): number {
      return action.weight * action.reps * action.sets
    },

    /**
     * 计算估算 1RM
     */
    calculate1RM(action: ActionRecord): number {
      return action.weight * (1 + 0.0333 * action.reps)
    },

    /**
     * 处理编辑按钮点击
     */
    handleEdit(index: number): void {
      this.$emit('edit', index)
    },

    /**
     * 处理删除按钮点击
     */
    handleDelete(index: number): void {
      this.$emit('delete', index)
    }
  }
})
</script>

<style lang="scss" scoped>
.action-table {
  width: 100%;
  overflow-x: auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-header {
  background-color: #f5f7fa;
  border-bottom: 2px solid #e4e7ed;
}

.header-row {
  font-weight: 600;
  font-size: 14px;
  color: #606266;
}

.table-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
  
  &:last-child {
    border-bottom: none;
  }
}

.data-row {
  min-height: 60px;
  
  &:hover {
    background-color: #f9fafc;
  }
}

.table-cell {
  padding: 12px 8px;
  text-align: center;
  font-size: 13px;
  color: #303133;
  
  &.cell-name {
    flex: 2;
    min-width: 120px;
    text-align: left;
    font-weight: 500;
  }
  
  &.cell-weight,
  &.cell-reps,
  &.cell-sets {
    flex: 1;
    min-width: 60px;
  }
  
  &.cell-volume,
  &.cell-1rm {
    flex: 1;
    min-width: 70px;
    color: #409eff;
    font-weight: 500;
  }
  
  &.cell-action {
    flex: 1.5;
    min-width: 140px;
    display: flex;
    justify-content: center;
    gap: 8px;
  }
}

.action-notes {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.action-btn {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  
  &.edit-btn {
    background-color: #e6f7ff;
    color: #1890ff;
    
    &:active {
      background-color: #bae7ff;
    }
  }
  
  &.delete-btn {
    background-color: #fff1f0;
    color: #ff4d4f;
    
    &:active {
      background-color: #ffccc7;
    }
  }
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

// 小程序适配
@media (max-width: 750rpx) {
  .table-cell {
    padding: 10px 6px;
    font-size: 12px;
  }
  
  .cell-name {
    min-width: 100px;
  }
  
  .cell-weight,
  .cell-reps,
  .cell-sets {
    min-width: 50px;
  }
  
  .cell-volume,
  .cell-1rm {
    min-width: 60px;
  }
  
  .cell-action {
    min-width: 120px;
  }
}
</style>

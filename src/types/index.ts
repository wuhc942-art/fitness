/**
 * 通用类型和常量定义
 */

import type { PRRecord, BodyPart } from './training'

export type { PRRecord, BodyPart }

/**
 * 提醒设置
 */
export interface ReminderSettings {
  /** 云数据库文档 ID */
  _id?: string
  /** 用户 openid（云数据库自动添加） */
  _openid?: string
  /** 每日提醒配置 */
  dailyReminder: {
    /** 是否启用 */
    enabled: boolean
    /** 提醒时间 HH:mm 格式 */
    time: string
  }
  /** 三天未训练提醒配置 */
  threeDayReminder: {
    /** 是否启用 */
    enabled: boolean
  }
  /** 部位提醒配置 */
  bodyPartReminder: {
    /** 是否启用 */
    enabled: boolean
    /** 提醒规则描述 */
    rule?: string
  }
  /** 更新时间 ISO 8601 */
  updatedAt: string
}

/**
 * 本周热力图数据
 */
export interface HeatMapData {
  /** 本周周一日期 YYYY-MM-DD */
  weekStart: string
  /** 每日数据 */
  days: {
    /** 日期 YYYY-MM-DD */
    date: string
    /** 是否有训练 */
    hasTraining: boolean
    /** 星期几（0-6，0 为周一） */
    dayIndex: number
    /** 星期中文 */
    dayLabel: string
  }[]
}

/**
 * 月份训练频率数据
 */
export interface MonthFrequencyData {
  /** 月份 YYYY-MM */
  month: string
  /** 训练次数 */
  count: number
}

/**
 * 肌群训练分布
 */
export interface BodyPartDistribution {
  /** 胸部训练次数 */
  chest: number
  /** 背部训练次数 */
  back: number
  /** 腿部训练次数 */
  legs: number
  /** 肩部训练次数 */
  shoulders: number
  /** 手臂训练次数 */
  arms: number
  /** 有氧训练次数 */
  cardio: number
}

/**
 * 首页统计数据
 */
export interface HomeStatistics {
  /** 连续训练天数 */
  continuousDays: number
  /** 本月训练次数 */
  monthCount: number
  /** 总训练时长（分钟） */
  totalDuration: number
  /** PR 记录列表 */
  prRecords: PRRecord[]
  /** 本周训练热力图 */
  heatMapData: HeatMapData
}

/**
 * 云函数调用结果包装
 */
export interface CloudFunctionResult<T = any> {
  /** 错误码，0 表示成功 */
  err: number
  /** 错误信息 */
  errMsg: string
  /** 返回数据 */
  data: T
}

/**
 * 日期范围
 */
export interface DateRange {
  /** 开始日期 YYYY-MM-DD */
  start: string
  /** 结束日期 YYYY-MM-DD */
  end: string
}

/**
 * 查询历史记录的参数类型
 */
export type HistoryQueryType = 'date' | 'bodyPart' | 'action'

/**
 * 查询历史记录的参数（支持多条件组合）
 */
export interface HistoryQueryParams {
  /** 开始日期 YYYY-MM-DD */
  startDate?: string
  /** 结束日期 YYYY-MM-DD */
  endDate?: string
  /** 训练部位 */
  bodyPart?: BodyPart
  /** 动作名称（支持模糊匹配） */
  actionName?: string
}

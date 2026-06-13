/**
 * 数据统计服务
 * 
 * 负责统计数据的计算和获取
 */

import type {
  PRRecord,
  HeatMapData,
  BodyPartDistribution,
  BodyPart
} from '@/types'
import type { ActionRecord } from '@/types/training'
import { trainingService } from './training'
import { getWeekDates, getMonth, calculateContinuousDays } from '@/utils/date'

/**
 * 训练部位中文映射
 */
const BODY_PART_MAP: Record<string, BodyPart> = {
  chest: 'chest',
  back: 'back',
  legs: 'legs',
  shoulders: 'shoulders',
  arms: 'arms',
  cardio: 'cardio'
}

/**
 * 数据统计服务类
 */
export class StatisticsService {
  /**
   * 获取首页统计数据
   */
  async getHomeStatistics(): Promise<{
    continuousDays: number
    monthCount: number
    totalDuration: number
    prRecords: PRRecord[]
    heatMapData: HeatMapData
  }> {
    // 获取所有训练记录
    const records = await trainingService.getRecordsByDateRange(
      '2020-01-01',
      new Date().toISOString().split('T')[0]
    )
    
    // 计算连续训练天数
    const dates = records.map(r => r.date).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime()
    })
    const continuousDays = calculateContinuousDays(dates)
    
    // 计算本月训练次数
    const currentMonth = getMonth()
    const monthCount = records.filter(r => r.date.startsWith(currentMonth)).length
    
    // 计算总训练时长
    const totalDuration = records.reduce((sum, r) => sum + r.duration, 0)
    
    // 获取 PR 记录
    const prRecords = await this.getPRRecords(records)
    
    // 获取热力图数据
    const heatMapData = await this.getWeekHeatMapData(records)
    
    return {
      continuousDays,
      monthCount,
      totalDuration,
      prRecords,
      heatMapData
    }
  }

  /**
   * 获取 PR 记录（各动作最大重量）
   * 
   * @param records 训练记录列表
   */
  async getPRRecords(records?: any[]): Promise<PRRecord[]> {
    if (!records) {
      records = await trainingService.getRecordsByDateRange(
        '2020-01-01',
        new Date().toISOString().split('T')[0]
      )
    }
    
    const actionMaxMap = new Map<string, PRRecord>()
    
    records.forEach(record => {
      record.actions.forEach((action: ActionRecord) => {
        const existing = actionMaxMap.get(action.name)
        const current1RM = action.estimated1RM || action.weight
        
        if (!existing || current1RM > existing.max1RM) {
          actionMaxMap.set(action.name, {
            actionName: action.name,
            maxWeight: action.weight,
            max1RM: current1RM,
            date: record.date
          })
        }
      })
    })
    
    return Array.from(actionMaxMap.values())
  }

  /**
   * 获取本周训练热力图数据
   * 
   * @param records 训练记录列表
   */
  async getWeekHeatMapData(records?: any[]): Promise<HeatMapData> {
    if (!records) {
      records = await trainingService.getRecordsByDateRange(
        '2020-01-01',
        new Date().toISOString().split('T')[0]
      )
    }
    
    const weekDates = getWeekDates()
    const trainingDates = new Set(records.map(r => r.date))
    
    const weekDayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    
    return {
      weekStart: weekDates[0],
      days: weekDates.map((date, index) => ({
        date,
        hasTraining: trainingDates.has(date),
        dayIndex: index,
        dayLabel: weekDayLabels[index]
      }))
    }
  }

  /**
   * 获取月训练频率
   * 
   * @param months 统计最近几个月，默认 6 个月
   */
  async getMonthFrequency(months: number = 6): Promise<{ month: string; count: number }[]> {
    const records = await trainingService.getRecordsByDateRange(
      '2020-01-01',
      new Date().toISOString().split('T')[0]
    )
    
    const monthCountMap = new Map<string, number>()
    
    // 初始化最近几个月的计数
    const now = new Date()
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = getMonth(date)
      monthCountMap.set(monthKey, 0)
    }
    
    // 统计训练记录
    records.forEach(record => {
      const monthKey = getMonth(record.date)
      if (monthCountMap.has(monthKey)) {
        monthCountMap.set(monthKey, monthCountMap.get(monthKey)! + 1)
      }
    })
    
    // 转换为数组并按月份排序
    return Array.from(monthCountMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  /**
   * 获取肌群训练分布
   */
  async getBodyPartDistribution(): Promise<BodyPartDistribution> {
    const records = await trainingService.getRecordsByDateRange(
      '2020-01-01',
      new Date().toISOString().split('T')[0]
    )
    
    const distribution: BodyPartDistribution = {
      chest: 0,
      back: 0,
      legs: 0,
      shoulders: 0,
      arms: 0,
      cardio: 0
    }
    
    records.forEach(record => {
      if (record.bodyPart in distribution) {
        distribution[record.bodyPart as keyof BodyPartDistribution]++
      }
    })
    
    return distribution
  }

  /**
   * 获取训练次数总计
   */
  async getTotalTrainingCount(): Promise<number> {
    const records = await trainingService.getRecordsByDateRange(
      '2020-01-01',
      new Date().toISOString().split('T')[0]
    )
    return records.length
  }

  /**
   * 获取平均训练时长
   * 
   * @param days 最近多少天，默认 30 天
   */
  async getAverageDuration(days: number = 30): Promise<number> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const records = await trainingService.getRecordsByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    )
    
    if (records.length === 0) {
      return 0
    }
    
    const totalDuration = records.reduce((sum, r) => sum + r.duration, 0)
    return Math.round(totalDuration / records.length)
  }
}

/**
 * 导出单例
 */
export const statisticsService = new StatisticsService()

export default statisticsService

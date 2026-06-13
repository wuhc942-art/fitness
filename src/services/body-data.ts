/**
 * 身体数据服务
 * 
 * 负责身体数据的 CRUD 操作和趋势分析
 */

import type { BodyDataRecord, BodyDataForm, BodyDataTrendPoint } from '@/types/body-data'

/**
 * 身体数据服务类
 */
export class BodyDataService {
  /**
   * 云数据库集合名称
   */
  private static readonly COLLECTION_NAME = 'body_data_records'

  /**
   * 保存身体数据
   * 
   * @param form 身体数据表单
   * @returns 保存的身体数据记录
   */
  async saveRecord(form: BodyDataForm): Promise<BodyDataRecord> {
    const now = new Date().toISOString()
    
    const record: BodyDataRecord = {
      date: form.date,
      height: form.height,
      weight: form.weight,
      bodyFat: form.bodyFat,
      waist: form.waist,
      arm: form.arm,
      sleep: form.sleep,
      water: form.water,
      createdAt: now,
      updatedAt: now
    }
    
    // 调用云函数保存
    const result = await wx.cloud.callFunction({
      name: 'saveBodyDataRecord',
      data: { record }
    })
    
    return {
      ...record,
      _id: result.result._id,
      _openid: result.result._openid
    }
  }

  /**
   * 获取所有身体数据记录
   * 
   * @returns 身体数据记录列表（按日期倒序）
   */
  async getRecords(): Promise<BodyDataRecord[]> {
    const result = await wx.cloud.callFunction({
      name: 'getBodyDataRecords'
    })
    
    return result.result.data || []
  }

  /**
   * 获取最新的身体数据记录
   * 
   * @returns 最新的身体数据记录，无记录则返回 null
   */
  async getLatestRecord(): Promise<BodyDataRecord | null> {
    const records = await this.getRecords()
    return records.length > 0 ? records[0] : null
  }

  /**
   * 根据日期范围查询身体数据
   * 
   * @param start 开始日期
   * @param end 结束日期
   * @returns 身体数据记录列表
   */
  async getRecordsByDateRange(start: string, end: string): Promise<BodyDataRecord[]> {
    const result = await wx.cloud.callFunction({
      name: 'getBodyDataRecords',
      data: { start, end }
    })
    
    return result.result.data || []
  }

  /**
   * 获取身体数据趋势点（用于图表）
   * 
   * @param limit 限制返回数量，默认 100
   * @returns 趋势点列表
   */
  async getTrendPoints(limit: number = 100): Promise<BodyDataTrendPoint[]> {
    const records = await this.getRecords()
    
    // 按日期正序排序并限制数量
    const sorted = records
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-limit)
    
    return sorted.map(record => ({
      date: record.date,
      weight: record.weight,
      bodyFat: record.bodyFat,
      waist: record.waist,
      arm: record.arm
    }))
  }

  /**
   * 获取指定指标的趋势数据
   * 
   * @param metric 指标名称（weight/bodyFat/waist/arm）
   * @param limit 限制返回数量
   * @returns 趋势点列表
   */
  async getMetricTrend(
    metric: 'weight' | 'bodyFat' | 'waist' | 'arm',
    limit: number = 100
  ): Promise<{ date: string; value: number }[]> {
    const points = await this.getTrendPoints(limit)
    
    return points
      .filter(point => point[metric] !== undefined)
      .map(point => ({
        date: point.date,
        value: point[metric]!
      }))
  }

  /**
   * 删除身体数据记录
   * 
   * @param id 记录 ID
   */
  async deleteRecord(id: string): Promise<void> {
    await wx.cloud.callFunction({
      name: 'deleteBodyDataRecord',
      data: { id }
    })
  }

  /**
   * 更新身体数据记录
   * 
   * @param id 记录 ID
   * @param updates 更新内容
   */
  async updateRecord(id: string, updates: Partial<BodyDataRecord>): Promise<void> {
    const now = new Date().toISOString()
    
    await wx.cloud.callFunction({
      name: 'updateBodyDataRecord',
      data: {
        id,
        updates: {
          ...updates,
          updatedAt: now
        }
      }
    })
  }

  /**
   * 计算身体数据的变化量
   * 
   * @param metric 指标名称
   * @returns 变化量（最新值 - 最旧值）
   */
  async getMetricChange(metric: 'weight' | 'bodyFat' | 'waist' | 'arm'): Promise<{
    change: number
    percentage: number
    startDate: string
    endDate: string
  } | null> {
    const points = await this.getTrendPoints()
    
    if (points.length < 2) {
      return null
    }
    
    const first = points[0]
    const last = points[points.length - 1]
    
    const firstValue = first[metric]
    const lastValue = last[metric]
    
    if (firstValue === undefined || lastValue === undefined) {
      return null
    }
    
    const change = lastValue - firstValue
    const percentage = firstValue !== 0 ? (change / firstValue) * 100 : 0
    
    return {
      change,
      percentage,
      startDate: first.date,
      endDate: last.date
    }
  }

  /**
   * 获取平均指标值
   * 
   * @param metric 指标名称
   * @param days 最近多少天，默认 30 天
   * @returns 平均值
   */
  async getAverageMetric(
    metric: 'weight' | 'bodyFat' | 'waist' | 'arm',
    days: number = 30
  ): Promise<number | null> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const records = await this.getRecordsByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    )
    
    if (records.length === 0) {
      return null
    }
    
    const sum = records.reduce((acc, record) => {
      const value = record[metric]
      return value !== undefined ? acc + value : acc
    }, 0)
    
    const validCount = records.filter(r => r[metric] !== undefined).length
    
    return validCount > 0 ? sum / validCount : null
  }
}

/**
 * 导出单例
 */
export const bodyDataService = new BodyDataService()

export default bodyDataService

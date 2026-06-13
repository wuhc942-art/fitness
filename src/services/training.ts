/**
 * 训练记录服务
 * 
 * 负责训练记录的 CRUD 操作和查询
 */

import type {
  TrainingRecord,
  TrainingRecordForm,
  PRRecord,
  ActionHistoryItem,
  BodyPart
} from '@/types/training'
import type { DateRange, HistoryQueryParams } from '@/types'
import { calculate1RM, calculateVolume } from '@/utils/calculator'

/**
 * 训练记录服务类
 */
export class TrainingService {
  /**
   * 云数据库集合名称
   */
  private static readonly COLLECTION_NAME = 'training_records'

  /**
   * 保存训练记录
   * 
   * @param form 训练记录表单
   * @returns 保存的训练记录
   */
  async saveRecord(form: TrainingRecordForm): Promise<TrainingRecord> {
    const now = new Date().toISOString()
    
    // 计算每个动作的训练量和 1RM
    const actionsWithCalculations = form.actions.map(action => ({
      ...action,
      volume: calculateVolume(action.weight, action.reps, action.sets),
      estimated1RM: calculate1RM(action.weight, action.reps)
    }))
    
    // 计算总训练量
    const totalVolume = actionsWithCalculations.reduce(
      (sum, action) => sum + action.volume!,
      0
    )
    
    const record: TrainingRecord = {
      date: form.date,
      bodyPart: form.bodyPart,
      duration: form.duration,
      location: form.location,
      feeling: form.feeling,
      actions: actionsWithCalculations,
      totalVolume,
      createdAt: now,
      updatedAt: now
    }
    
    // 调用云函数保存
    const result = await wx.cloud.callFunction({
      name: 'saveTrainingRecord',
      data: { record }
    })
    
    return {
      ...record,
      _id: result.result._id,
      _openid: result.result._openid
    }
  }

  /**
   * 根据 ID 获取训练记录
   * 
   * @param id 记录 ID
   * @returns 训练记录
   */
  async getRecordById(id: string): Promise<TrainingRecord | null> {
    const result = await wx.cloud.callFunction({
      name: 'queryHistory',
      data: {
        type: 'id',
        value: id
      }
    })
    
    return result.result.data?.[0] || null
  }

  /**
   * 查询历史记录（支持多条件组合查询）
   * 
   * @param params 查询参数
   * @returns 训练记录列表
   */
  async queryHistory(params?: HistoryQueryParams): Promise<TrainingRecord[]> {
    const result = await wx.cloud.callFunction({
      name: 'queryHistory',
      data: params || {}
    })
    
    return result.result.data || []
  }

  /**
   * 根据日期范围查询训练记录
   * 
   * @param start 开始日期
   * @param end 结束日期
   * @returns 训练记录列表（按日期倒序）
   */
  async getRecordsByDateRange(start: string, end: string): Promise<TrainingRecord[]> {
    return this.queryHistory({ startDate: start, endDate: end })
  }

  /**
   * 根据训练部位查询训练记录
   * 
   * @param bodyPart 训练部位
   * @returns 训练记录列表（按日期倒序）
   */
  async getRecordsByBodyPart(bodyPart: BodyPart): Promise<TrainingRecord[]> {
    const result = await wx.cloud.callFunction({
      name: 'queryHistory',
      data: {
        type: 'bodyPart',
        value: bodyPart
      }
    })
    
    return result.result.data || []
  }

  /**
   * 根据动作名称查询训练记录
   * 
   * @param actionName 动作名称（支持模糊匹配）
   * @returns 训练记录列表（按日期倒序）
   */
  async getRecordsByAction(actionName: string): Promise<TrainingRecord[]> {
    const result = await wx.cloud.callFunction({
      name: 'queryHistory',
      data: {
        type: 'action',
        value: actionName
      }
    })
    
    return result.result.data || []
  }

  /**
   * 获取某动作的上次训练记录
   * 
   * @param actionName 动作名称
   * @returns 上次训练记录，无记录则返回 null
   */
  async getLastRecord(actionName: string): Promise<TrainingRecord | null> {
    const records = await this.getRecordsByAction(actionName)
    return records.length > 0 ? records[0] : null
  }

  /**
   * 获取某动作的历史记录（扁平化）
   * 
   * @param actionName 动作名称
   * @returns 动作历史记录列表
   */
  async getActionHistory(actionName: string): Promise<ActionHistoryItem[]> {
    const records = await this.getRecordsByAction(actionName)
    
    const history: ActionHistoryItem[] = []
    
    records.forEach(record => {
      record.actions.forEach(action => {
        if (action.name.toLowerCase().includes(actionName.toLowerCase())) {
          history.push({
            date: record.date,
            name: action.name,
            weight: action.weight,
            reps: action.reps,
            sets: action.sets,
            estimated1RM: action.estimated1RM || 0,
            bodyPart: record.bodyPart
          })
        }
      })
    })
    
    // 按日期倒序
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  /**
   * 更新训练记录
   * 
   * @param id 记录 ID
   * @param updates 更新内容
   */
  async updateRecord(id: string, updates: Partial<TrainingRecord>): Promise<void> {
    const now = new Date().toISOString()
    
    await wx.cloud.callFunction({
      name: 'updateTrainingRecord',
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
   * 删除训练记录
   * 
   * @param id 记录 ID
   */
  async deleteRecord(id: string): Promise<void> {
    await wx.cloud.callFunction({
      name: 'deleteTrainingRecord',
      data: { id }
    })
  }

  /**
   * 获取 PR 记录（各动作最大重量）
   * 
   * @returns PR 记录列表
   */
  async getPRRecords(): Promise<PRRecord[]> {
    const result = await wx.cloud.callFunction({
      name: 'getStatistics'
    })
    
    return result.result.prRecords || []
  }

  /**
   * 搜索动作名称
   * 
   * @param keyword 搜索关键词
   * @returns 匹配的动作名称列表
   */
  async searchActionNames(keyword: string): Promise<string[]> {
    const records = await this.getRecordsByDateRange(
      '2020-01-01',
      new Date().toISOString().split('T')[0]
    )
    
    const actionNames = new Set<string>()
    
    records.forEach(record => {
      record.actions.forEach(action => {
        if (action.name.toLowerCase().includes(keyword.toLowerCase())) {
          actionNames.add(action.name)
        }
      })
    })
    
    return Array.from(actionNames).sort()
  }
}

/**
 * 导出单例
 */
export const trainingService = new TrainingService()

export default trainingService

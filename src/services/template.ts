/**
 * 训练模板服务
 * 
 * 负责训练模板的 CRUD 操作
 */

import type { TrainingTemplate, TrainingTemplateForm, TemplateListItem } from '@/types/template'
import type { ActionRecord } from '@/types/training'

/**
 * 训练模板服务类
 */
export class TemplateService {
  /**
   * 云数据库集合名称
   */
  private static readonly COLLECTION_NAME = 'training_templates'

  /**
   * 创建训练模板
   * 
   * @param form 训练模板表单
   * @returns 创建的模板
   */
  async createTemplate(form: TrainingTemplateForm): Promise<TrainingTemplate> {
    const now = new Date().toISOString()
    
    const template: TrainingTemplate = {
      name: form.name,
      actions: form.actions,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await wx.cloud.callFunction({
      name: 'saveTemplate',
      data: { template }
    })
    
    return {
      ...template,
      _id: result.result._id,
      _openid: result.result._openid
    }
  }

  /**
   * 获取所有训练模板
   * 
   * @returns 模板列表（按更新时间倒序）
   */
  async getTemplates(): Promise<TemplateListItem[]> {
    const result = await wx.cloud.callFunction({
      name: 'getTrainingTemplate'
    })
    
    const templates: TrainingTemplate[] = result.result.data || []
    
    // 转换为列表项格式
    return templates.map(template => ({
      _id: template._id!,
      name: template.name,
      actionCount: template.actions.length,
      updatedAt: template.updatedAt
    })).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  /**
   * 根据 ID 获取训练模板
   * 
   * @param id 模板 ID
   * @returns 模板详情，不存在则返回 null
   */
  async getTemplateById(id: string): Promise<TrainingTemplate | null> {
    const result = await wx.cloud.callFunction({
      name: 'getTrainingTemplate',
      data: { id }
    })
    
    return result.result.data?.[0] || null
  }

  /**
   * 更新训练模板
   * 
   * @param id 模板 ID
   * @param updates 更新内容
   */
  async updateTemplate(id: string, updates: Partial<TrainingTemplate>): Promise<void> {
    const now = new Date().toISOString()
    
    await wx.cloud.callFunction({
      name: 'saveTemplate',
      data: {
        id,
        template: {
          ...updates,
          updatedAt: now
        }
      }
    })
  }

  /**
   * 删除训练模板
   * 
   * @param id 模板 ID
   */
  async deleteTemplate(id: string): Promise<void> {
    await wx.cloud.callFunction({
      name: 'deleteTemplate',
      data: { id }
    })
  }

  /**
   * 使用模板开始训练
   * 
   * @param id 模板 ID
   * @returns 预填充的动作列表（需要用户填写重量、次数、组数）
   */
  async useTemplate(id: string): Promise<ActionRecord[]> {
    const template = await this.getTemplateById(id)
    
    if (!template) {
      throw new Error('模板不存在')
    }
    
    // 将预设动作名称转换为动作记录（等待用户填写重量等数据）
    return template.actions.map(name => ({
      name,
      weight: 0,  // 需要用户填写
      reps: 0,    // 需要用户填写
      sets: 0     // 需要用户填写
    }))
  }

  /**
   * 搜索模板
   * 
   * @param keyword 搜索关键词
   * @returns 匹配的模板列表
   */
  async searchTemplates(keyword: string): Promise<TemplateListItem[]> {
    const templates = await this.getTemplates()
    
    return templates.filter(template =>
      template.name.toLowerCase().includes(keyword.toLowerCase())
    )
  }
}

/**
 * 导出单例
 */
export const templateService = new TemplateService()

export default templateService

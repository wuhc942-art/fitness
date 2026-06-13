/**
 * 训练模板本地存储服务
 */

import type { TrainingTemplate, TrainingTemplateForm } from '@/types/template'

const STORAGE_KEY = 'fitness_training_templates'

function getLocalTemplates(): TrainingTemplate[] {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    const templates = typeof data === 'string' ? JSON.parse(data) : data
    return Array.isArray(templates) ? templates : []
  } catch (e) {
    console.error('读取模板失败:', e)
    return []
  }
}

function saveLocalTemplates(templates: TrainingTemplate[]): void {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(templates))
  } catch (e) {
    console.error('保存模板失败:', e)
  }
}

export const trainingTemplateServiceLocal = {
  async createTemplate(form: TrainingTemplateForm): Promise<TrainingTemplate> {
    const now = new Date().toISOString()
    const template: TrainingTemplate = {
      _id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      _openid: 'local_user',
      name: form.name,
      actions: form.actions,
      createdAt: now,
      updatedAt: now
    }
    
    const templates = getLocalTemplates()
    templates.unshift(template)
    saveLocalTemplates(templates)
    return template
  },

  async getTemplates(): Promise<TrainingTemplate[]> {
    return getLocalTemplates().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  },

  async getTemplateById(id: string): Promise<TrainingTemplate | null> {
    const templates = getLocalTemplates()
    return templates.find(t => t._id === id) || null
  },

  async updateTemplate(id: string, updates: Partial<TrainingTemplate>): Promise<void> {
    const templates = getLocalTemplates()
    const index = templates.findIndex(t => t._id === id)
    if (index !== -1) {
      templates[index] = { ...templates[index], ...updates, updatedAt: new Date().toISOString() }
      saveLocalTemplates(templates)
    }
  },

  async deleteTemplate(id: string): Promise<void> {
    const templates = getLocalTemplates()
    const filtered = templates.filter(t => t._id !== id)
    saveLocalTemplates(filtered)
  }
}

// 兼容旧版导入
export { trainingTemplateServiceLocal as templateServiceLocal }

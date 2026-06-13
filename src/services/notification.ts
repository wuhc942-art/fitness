/**
 * 提醒服务
 * 
 * 负责训练提醒的设置和管理
 */

import type { ReminderSettings } from '@/types'

/**
 * 提醒服务类
 */
export class NotificationService {
  /**
   * 云数据库集合名称
   */
  private static readonly COLLECTION_NAME = 'reminder_settings'

  /**
   * 获取提醒设置
   */
  async getReminderSettings(): Promise<ReminderSettings | null> {
    const result = await wx.cloud.callFunction({
      name: 'getReminderSettings'
    })
    
    return result.result.data?.[0] || null
  }

  /**
   * 开启每日提醒
   * 
   * @param time 提醒时间（HH:mm 格式）
   */
  async enableDailyReminder(time: string = '19:00'): Promise<void> {
    const settings = await this.getReminderSettings()
    
    const updates: Partial<ReminderSettings> = {
      dailyReminder: {
        enabled: true,
        time
      }
    }
    
    if (settings) {
      await this.updateSettings(settings._id!, updates)
    } else {
      await this.createSettings(updates)
    }
  }

  /**
   * 关闭每日提醒
   */
  async disableDailyReminder(): Promise<void> {
    const settings = await this.getReminderSettings()
    
    if (settings) {
      await this.updateSettings(settings._id!, {
        dailyReminder: {
          enabled: false,
          time: settings.dailyReminder.time
        }
      })
    }
  }

  /**
   * 开启三天未训练提醒
   */
  async enableThreeDayReminder(): Promise<void> {
    const settings = await this.getReminderSettings()
    
    const updates: Partial<ReminderSettings> = {
      threeDayReminder: {
        enabled: true
      }
    }
    
    if (settings) {
      await this.updateSettings(settings._id!, updates)
    } else {
      await this.createSettings(updates)
    }
  }

  /**
   * 关闭三天未训练提醒
   */
  async disableThreeDayReminder(): Promise<void> {
    const settings = await this.getReminderSettings()
    
    if (settings) {
      await this.updateSettings(settings._id!, {
        threeDayReminder: {
          enabled: false
        }
      })
    }
  }

  /**
   * 开启部位提醒
   * 
   * @param rule 提醒规则描述
   */
  async enableBodyPartReminder(rule?: string): Promise<void> {
    const settings = await this.getReminderSettings()
    
    const updates: Partial<ReminderSettings> = {
      bodyPartReminder: {
        enabled: true,
        rule
      }
    }
    
    if (settings) {
      await this.updateSettings(settings._id!, updates)
    } else {
      await this.createSettings(updates)
    }
  }

  /**
   * 关闭部位提醒
   */
  async disableBodyPartReminder(): Promise<void> {
    const settings = await this.getReminderSettings()
    
    if (settings) {
      await this.updateSettings(settings._id!, {
        bodyPartReminder: {
          enabled: false,
          rule: settings.bodyPartReminder.rule
        }
      })
    }
  }

  /**
   * 保存完整的提醒设置
   * 
   * @param settings 提醒设置
   */
  async saveSettings(settings: Partial<ReminderSettings>): Promise<void> {
    const existing = await this.getReminderSettings()
    
    if (existing) {
      await this.updateSettings(existing._id!, settings)
    } else {
      await this.createSettings(settings)
    }
  }

  /**
   * 创建提醒设置
   * 
   * @param settings 设置内容
   */
  private async createSettings(settings: Partial<ReminderSettings>): Promise<void> {
    const now = new Date().toISOString()
    
    const newSettings: ReminderSettings = {
      dailyReminder: {
        enabled: false,
        time: '19:00',
        ...settings.dailyReminder
      },
      threeDayReminder: {
        enabled: false,
        ...settings.threeDayReminder
      },
      bodyPartReminder: {
        enabled: false,
        ...settings.bodyPartReminder
      },
      updatedAt: now,
      ...settings
    }
    
    await wx.cloud.callFunction({
      name: 'saveReminderSettings',
      data: { settings: newSettings }
    })
  }

  /**
   * 更新提醒设置
   * 
   * @param id 设置 ID
   * @param updates 更新内容
   */
  private async updateSettings(id: string, updates: Partial<ReminderSettings>): Promise<void> {
    const now = new Date().toISOString()
    
    await wx.cloud.callFunction({
      name: 'saveReminderSettings',
      data: {
        id,
        settings: {
          ...updates,
          updatedAt: now
        }
      }
    })
  }

  /**
   * 检查是否需要推送三天未训练提醒
   * 
   * @param lastTrainingDate 最后训练日期
   * @returns 是否应该推送
   */
  checkThreeDayReminder(lastTrainingDate: string): boolean {
    const lastDate = new Date(lastTrainingDate)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return diffDays >= 3
  }

  /**
   * 获取默认提醒时间
   * 
   * @returns 默认提醒时间（19:00）
   */
  getDefaultReminderTime(): string {
    return '19:00'
  }
}

/**
 * 导出单例
 */
export const notificationService = new NotificationService()

export default notificationService

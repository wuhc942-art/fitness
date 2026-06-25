import { trainingPlanServiceLocal, type MissedPlanSession } from '@/services/training-plan.local'
import { formatDate } from '@/utils/date'

const STORAGE_KEY = 'fitness_local_reminder_settings'
const LAST_SHOWN_KEY = 'fitness_missed_plan_reminder_last_shown'
export const MISSED_TRAINING_TEMPLATE_ID = '6TkLklsfN0aqs8AkyVbZtSQ0jGVNT1pHI6reULAp5TE'

export interface LocalReminderSettings {
  dailyReminder: {
    enabled: boolean
    time: string
  }
  threeDayReminder: {
    enabled: boolean
  }
  missedPlanReminder: {
    enabled: boolean
    templateId: string
    subscribed: boolean
    subscribedAt?: string
  }
  cloudSync?: {
    status: 'idle' | 'synced' | 'failed'
    syncedAt?: string
    error?: string
  }
  updatedAt: string
}

const defaultSettings = (): LocalReminderSettings => ({
  dailyReminder: { enabled: false, time: '19:00' },
  threeDayReminder: { enabled: false },
  missedPlanReminder: {
    enabled: true,
    templateId: MISSED_TRAINING_TEMPLATE_ID,
    subscribed: false
  },
  cloudSync: { status: 'idle' },
  updatedAt: new Date().toISOString()
})

let cloudInitialized = false

function getCloudApi() {
  const wxApi = typeof wx !== 'undefined' ? wx : undefined
  return wxApi?.cloud
}

function ensureCloudReady() {
  const cloud = getCloudApi()
  if (!cloud) throw new Error('当前环境不支持云开发')
  if (!cloudInitialized) {
    cloud.init({ traceUser: true })
    cloudInitialized = true
  }
  return cloud
}

function readSettings(): LocalReminderSettings {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return defaultSettings()
    const saved = typeof raw === 'string' ? JSON.parse(raw) : raw
    const defaults = defaultSettings()
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return defaults
    return {
      ...defaults,
      ...saved,
      dailyReminder: { ...defaults.dailyReminder, ...(saved.dailyReminder || {}) },
      threeDayReminder: { ...defaults.threeDayReminder, ...(saved.threeDayReminder || {}) },
      missedPlanReminder: {
        ...defaults.missedPlanReminder,
        ...(saved.missedPlanReminder || {}),
        templateId: saved.missedPlanReminder?.templateId || MISSED_TRAINING_TEMPLATE_ID
      },
      cloudSync: { ...defaults.cloudSync, ...(saved.cloudSync || {}) }
    }
  } catch (error) {
    console.error('读取提醒设置失败:', error)
    return defaultSettings()
  }
}

function writeSettings(settings: LocalReminderSettings) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify({ ...settings, updatedAt: new Date().toISOString() }))
}

async function syncSettingsToCloud(settings: LocalReminderSettings): Promise<LocalReminderSettings> {
  const now = new Date().toISOString()
  const next: LocalReminderSettings = {
    ...settings,
    cloudSync: { status: 'idle', syncedAt: settings.cloudSync?.syncedAt, error: '' },
    updatedAt: now
  }

  try {
    const cloud = ensureCloudReady()
    const result = await cloud.callFunction({
      name: 'saveReminderSettings',
      data: {
        settings: {
          dailyReminder: next.dailyReminder,
          threeDayReminder: next.threeDayReminder,
          missedPlanReminder: next.missedPlanReminder,
          updatedAt: now
        }
      }
    })
    if (result?.result?.success === false) throw new Error(result.result.error || '云端同步失败')
    next.cloudSync = { status: 'synced', syncedAt: new Date().toISOString(), error: '' }
  } catch (error: any) {
    next.cloudSync = {
      status: 'failed',
      syncedAt: settings.cloudSync?.syncedAt,
      error: error?.message || '云端同步失败'
    }
  }

  writeSettings(next)
  return next
}

function buildRecordUrl(session: MissedPlanSession) {
  return `/pages/training-record/training-record?planId=${encodeURIComponent(session.planId)}&week=${session.weekNumber}&templateId=${encodeURIComponent(session.templateId)}&date=${encodeURIComponent(session.date)}`
}

export const reminderServiceLocal = {
  async getSettings(): Promise<LocalReminderSettings> {
    return readSettings()
  },

  async saveSettings(settings: LocalReminderSettings): Promise<LocalReminderSettings> {
    const next = {
      ...settings,
      missedPlanReminder: {
        ...settings.missedPlanReminder,
        templateId: settings.missedPlanReminder.templateId || MISSED_TRAINING_TEMPLATE_ID
      },
      updatedAt: new Date().toISOString()
    }
    writeSettings(next)
    return syncSettingsToCloud(next)
  },

  async requestMissedPlanSubscribe(templateId = MISSED_TRAINING_TEMPLATE_ID): Promise<boolean> {
    const tmplId = templateId.trim() || MISSED_TRAINING_TEMPLATE_ID
    return new Promise((resolve, reject) => {
      uni.requestSubscribeMessage({
        tmplIds: [tmplId],
        success: (res: any) => {
          const accepted = res[tmplId] === 'accept'
          const settings = readSettings()
          settings.missedPlanReminder.templateId = tmplId
          settings.missedPlanReminder.subscribed = accepted
          if (accepted) settings.missedPlanReminder.subscribedAt = new Date().toISOString()
          writeSettings(settings)
          syncSettingsToCloud(settings).finally(() => resolve(accepted))
        },
        fail: reject
      })
    })
  },

  async syncSettingsToCloud(): Promise<LocalReminderSettings> {
    return syncSettingsToCloud(readSettings())
  },

  async getMissedSessions(): Promise<MissedPlanSession[]> {
    return trainingPlanServiceLocal.getMissedSessions()
  },

  async checkAndShowMissedPlanReminder(): Promise<void> {
    const settings = readSettings()
    if (!settings.missedPlanReminder.enabled) return

    const today = formatDate(new Date())
    const lastShown = uni.getStorageSync(LAST_SHOWN_KEY)
    if (lastShown === today) return

    const missed = await trainingPlanServiceLocal.getMissedSessions(today)
    if (!missed.length) return

    const latest = missed.find((session) => !!session.templateId) || missed[0]
    const canRecord = !!latest.templateId
    uni.setStorageSync(LAST_SHOWN_KEY, today)
    uni.showModal({
      title: '有计划训练未完成',
      content: canRecord
        ? `你有 ${missed.length} 次计划训练还没记录。最近一次是 ${latest.date} 的「${latest.templateName}」。`
        : `你有 ${missed.length} 次计划训练还没处理，但相关模板已删除，建议先到计划里重新安排。`,
      cancelText: '稍后',
      confirmText: canRecord ? '去补记' : '去计划',
      success: (res) => {
        if (!res.confirm) return
        uni.navigateTo({ url: canRecord ? buildRecordUrl(latest) : '/pages/plans/plans' })
      }
    })
  }
}

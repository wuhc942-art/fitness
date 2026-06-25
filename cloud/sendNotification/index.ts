/**
 * 云函数：发送训练提醒订阅消息
 *
 * 定时触发器调用。前端负责申请订阅授权并保存 reminder_settings；
 * 这里负责扫描已授权用户，按规则发送微信订阅消息，并记录同日去重状态。
 */

import cloud = require('wx-server-sdk')

const {
  buildReminderMessages,
  buildSubscribePayload
} = require('./notificationRules')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

interface ReminderMessage {
  type: 'daily' | 'threeDay'
  title: string
  content: string
}

interface ReminderSettingsDoc {
  _id: string
  _openid: string
  dailyReminder?: {
    enabled?: boolean
    time?: string
  }
  threeDayReminder?: {
    enabled?: boolean
  }
  missedPlanReminder?: {
    enabled?: boolean
    subscribed?: boolean
    templateId?: string
  }
  deliveryState?: Record<string, any>
}

function getChinaDate() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(new Date())
}

async function fetchSubscribedSettings(): Promise<ReminderSettingsDoc[]> {
  const result = await db.collection('reminder_settings')
    .where({
      'missedPlanReminder.subscribed': true
    })
    .limit(1000)
    .get()

  return result.data as ReminderSettingsDoc[]
}

async function getTodayTrainingCount(openid: string, today: string) {
  const result = await db.collection('training_records')
    .where({
      _openid: openid,
      date: today
    })
    .get()

  return result.data.length
}

async function getLastTrainingDate(openid: string) {
  const result = await db.collection('training_records')
    .where({
      _openid: openid
    })
    .orderBy('date', 'desc')
    .limit(1)
    .get()

  return result.data[0]?.date || ''
}

async function markDelivery(settingsId: string, message: ReminderMessage, today: string, status: 'sent' | 'failed', error?: string) {
  const now = new Date().toISOString()
  const deliveryState = status === 'sent'
    ? {
        lastSentDate: today,
        lastAttemptDate: today,
        lastAttemptAt: now,
        lastStatus: status,
        lastError: ''
      }
    : {
        lastAttemptDate: today,
        lastAttemptAt: now,
        lastStatus: status,
        lastError: error || ''
      }

  await db.collection('reminder_settings').doc(settingsId).update({
    data: {
      [`deliveryState.${message.type}`]: deliveryState,
      updatedAt: now
    }
  })
}

async function sendForUser(settings: ReminderSettingsDoc, today: string) {
  const templateId = settings.missedPlanReminder?.templateId
  if (!settings._openid || !templateId) {
    return { openid: settings._openid || '', sent: 0, failed: 0, skipped: 'missing_openid_or_template' }
  }

  const todayTrainingCount = await getTodayTrainingCount(settings._openid, today)
  const lastTrainingDate = await getLastTrainingDate(settings._openid)
  const messages: ReminderMessage[] = buildReminderMessages({
    settings,
    today,
    todayTrainingCount,
    lastTrainingDate
  })

  let sent = 0
  let failed = 0

  for (const message of messages) {
    try {
      await cloud.openapi.subscribeMessage.send(buildSubscribePayload({
        openid: settings._openid,
        templateId,
        page: 'pages/index/index',
        message,
        today,
        lastTrainingDate
      }))
      await markDelivery(settings._id, message, today, 'sent')
      sent += 1
    } catch (error: any) {
      failed += 1
      await markDelivery(settings._id, message, today, 'failed', error?.errMsg || error?.message || String(error))
    }
  }

  return { openid: settings._openid, sent, failed, skipped: messages.length ? '' : 'no_message' }
}

exports.main = async () => {
  const today = getChinaDate()

  try {
    const settingsList = await fetchSubscribedSettings()
    const results = []

    for (const settings of settingsList) {
      try {
        results.push(await sendForUser(settings, today))
      } catch (error: any) {
        results.push({
          openid: settings._openid || '',
          sent: 0,
          failed: 1,
          skipped: 'user_failed',
          error: error?.message || String(error)
        })
      }
    }

    const sent = results.reduce((sum, item) => sum + item.sent, 0)
    const failed = results.reduce((sum, item) => sum + item.failed, 0)

    return {
      success: true,
      today,
      checkedUsers: settingsList.length,
      sent,
      failed,
      results
    }
  } catch (error: any) {
    console.error('Send notification error:', error)
    return {
      success: false,
      today,
      error: error?.message || String(error)
    }
  }
}

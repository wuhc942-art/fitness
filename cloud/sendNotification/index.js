/**
 * 云函数：发送训练提醒订阅消息
 */

const cloud = require('wx-server-sdk')
const {
  buildReminderMessages,
  buildSubscribePayload,
  formatChinaDate,
  resolveReminderInputs
} = require('./notificationRules')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const FUNCTION_VERSION = 'reminder-force-debug-20260626'

async function fetchSubscribedSettings() {
  const result = await db.collection('reminder_settings')
    .where({
      'missedPlanReminder.subscribed': true
    })
    .limit(1000)
    .get()

  return result.data || []
}

async function getTodayTrainingCount(openid, today) {
  const result = await db.collection('training_records')
    .where({
      _openid: openid,
      date: today
    })
    .get()

  return result.data.length
}

async function getLastTrainingDate(openid) {
  const result = await db.collection('training_records')
    .where({
      _openid: openid
    })
    .orderBy('date', 'desc')
    .limit(1)
    .get()

  return (result.data[0] && result.data[0].date) || ''
}

async function markDelivery(settingsId, message, today, status, error) {
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

async function sendForUser(settings, today, options) {
  const templateId = settings.missedPlanReminder && settings.missedPlanReminder.templateId
  if (!settings._openid || !templateId) {
    return { openid: settings._openid || '', sent: 0, failed: 0, skipped: 'missing_openid_or_template' }
  }

  const todayTrainingCount = await getTodayTrainingCount(settings._openid, today)
  const lastTrainingDate = await getLastTrainingDate(settings._openid)
  const reminderInputs = resolveReminderInputs({
    settings,
    today,
    cloudTodayTrainingCount: todayTrainingCount,
    cloudLastTrainingDate: lastTrainingDate
  })
  const messages = buildReminderMessages({
    settings,
    today,
    todayTrainingCount: reminderInputs.todayTrainingCount,
    lastTrainingDate: reminderInputs.lastTrainingDate,
    force: options && options.force
  })

  let sent = 0
  let failed = 0
  const errors = []

  for (const message of messages) {
    try {
      await cloud.openapi.subscribeMessage.send(buildSubscribePayload({
        openid: settings._openid,
        templateId,
        page: 'pages/index/index',
        message,
        today,
        lastTrainingDate: reminderInputs.lastTrainingDate
      }))
      await markDelivery(settings._id, message, today, 'sent')
      sent += 1
    } catch (err) {
      failed += 1
      const errorMessage = err && (err.errMsg || err.message) || String(err)
      errors.push({
        type: message.type,
        message: errorMessage
      })
      await markDelivery(settings._id, message, today, 'failed', errorMessage)
    }
  }

  return { openid: settings._openid, sent, failed, skipped: messages.length ? '' : 'no_message', errors }
}

exports.main = async (event = {}) => {
  const today = event.today || formatChinaDate()
  const force = event.force === true

  try {
    const settingsList = await fetchSubscribedSettings()
    const results = []

    for (const settings of settingsList) {
      try {
        results.push(await sendForUser(settings, today, { force }))
      } catch (err) {
        results.push({
          openid: settings._openid || '',
          sent: 0,
          failed: 1,
          skipped: 'user_failed',
          error: err && err.message || String(err)
        })
      }
    }

    const sent = results.reduce((sum, item) => sum + item.sent, 0)
    const failed = results.reduce((sum, item) => sum + item.failed, 0)

    return {
      success: true,
      version: FUNCTION_VERSION,
      today,
      force,
      checkedUsers: settingsList.length,
      sent,
      failed,
      results
    }
  } catch (err) {
    console.error('Send notification error:', err)
    return {
      success: false,
      version: FUNCTION_VERSION,
      today,
      error: err && err.message || String(err)
    }
  }
}

function clampText(value, maxLength) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text
  return text.slice(0, Math.max(0, maxLength - 1)) + '…'
}

function daysBetween(fromDate, toDate) {
  if (!fromDate || !toDate) return 0
  const from = new Date(`${fromDate}T00:00:00+08:00`)
  const to = new Date(`${toDate}T00:00:00+08:00`)
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

function shouldSendReminder(settings, type, today) {
  const lastSentDate = settings && settings.deliveryState && settings.deliveryState[type] && settings.deliveryState[type].lastSentDate
  return lastSentDate !== today
}

function buildReminderMessages(options) {
  const settings = options.settings || {}
  const today = options.today

  const diffDays = daysBetween(options.lastTrainingDate, today)
  if (settings.threeDayReminder && settings.threeDayReminder.enabled && diffDays >= 3 && shouldSendReminder(settings, 'threeDay', today)) {
    return [{
      type: 'threeDay',
      title: '训练节奏提醒',
      content: `已经 ${diffDays} 天没有训练了，今天找回节奏`
    }]
  }

  if (settings.dailyReminder && settings.dailyReminder.enabled && options.todayTrainingCount === 0 && shouldSendReminder(settings, 'daily', today)) {
    return [{
      type: 'daily',
      title: '今日训练提醒',
      content: '今天还没有训练记录，安排一组轻量训练吧'
    }]
  }

  return []
}

function buildSubscribePayload(options) {
  return {
    touser: options.openid,
    templateId: options.templateId,
    page: options.page || 'pages/index/index',
    data: {
      thing1: { value: clampText(options.message.title, 20) },
      thing2: { value: clampText(options.message.content, 20) },
      date3: { value: options.today }
    }
  }
}

module.exports = {
  buildReminderMessages,
  buildSubscribePayload,
  shouldSendReminder
}

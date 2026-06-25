const {
  buildReminderMessages,
  shouldSendReminder,
  buildSubscribePayload
} = require('./notificationRules')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const today = '2026-06-25'

const settings = {
  dailyReminder: { enabled: true, time: '19:00' },
  threeDayReminder: { enabled: true },
  missedPlanReminder: {
    enabled: true,
    subscribed: true,
    templateId: 'template_123'
  },
  deliveryState: {
    daily: { lastSentDate: '2026-06-24' },
    threeDay: { lastSentDate: '2026-06-24' }
  }
}

const messages = buildReminderMessages({
  settings,
  today,
  todayTrainingCount: 0,
  lastTrainingDate: '2026-06-20'
})

assert(messages.length === 1, 'buildReminderMessages should emit one message per user per run')
assert(messages[0].type === 'threeDay', 'three-day reminder should take priority over daily')
assert(messages[0].content.includes('5 天'), 'three-day reminder should include diff days')

assert(shouldSendReminder(settings, 'daily', today), 'shouldSendReminder should allow a new day')
assert(!shouldSendReminder({
  ...settings,
  deliveryState: { daily: { lastSentDate: today } }
}, 'daily', today), 'shouldSendReminder should prevent duplicate same-day sends')

const payload = buildSubscribePayload({
  openid: 'openid_1',
  templateId: 'template_123',
  page: 'pages/index/index',
  message: messages[0],
  today,
  lastTrainingDate: '2026-06-20'
})

assert(payload.touser === 'openid_1', 'payload should include recipient openid')
assert(payload.templateId === 'template_123', 'payload should include template id')
assert(payload.data.thing3.value.length <= 20, 'thing3 should fit 温馨提示 thing field limit')
assert(payload.data.time1.value === '2026-06-20', 'time1 should use last training date')
assert(!payload.data.thing1 && !payload.data.thing2 && !payload.data.date3, 'payload should only use fields configured by the selected template')

console.log('notification rules assertions passed')

const {
  buildReminderMessages,
  shouldSendReminder,
  buildSubscribePayload,
  resolveReminderInputs,
  formatChinaDate
} = require('./notificationRules')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const today = '2026-06-25'

assert(formatChinaDate(new Date('2026-06-26T08:28:00Z')) === '2026-06-26', 'formatChinaDate should return YYYY-MM-DD in China timezone')

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
  },
  reminderSnapshot: {
    today,
    todayTrainingCount: 1,
    lastTrainingDate: '2026-06-23'
  }
}

const resolved = resolveReminderInputs({
  settings,
  today,
  cloudTodayTrainingCount: 0,
  cloudLastTrainingDate: '2026-06-20'
})

assert(resolved.todayTrainingCount === 1, 'resolveReminderInputs should prefer same-day local snapshot training count')
assert(resolved.lastTrainingDate === '2026-06-23', 'resolveReminderInputs should prefer local snapshot last training date')

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

const forced = buildReminderMessages({
  settings: {
    ...settings,
    deliveryState: { daily: { lastSentDate: today }, threeDay: { lastSentDate: today } }
  },
  today,
  todayTrainingCount: 1,
  lastTrainingDate: today,
  force: true
})

assert(forced.length === 1, 'force mode should emit a test message even when normal conditions do not match')
assert(forced[0].type === 'daily', 'force mode should use daily test reminder')

console.log('notification rules assertions passed')

/**
 * 云函数：发送提醒推送
 * 
 * 定时触发器调用，发送训练提醒
 * 定时配置：每天 19:00 触发
 */

import cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 主函数（定时触发器入口）
 */
exports.main = async (event: any, context: any) => {
  try {
    const { OPENID } = context
    
    // 获取用户的提醒设置
    const settingsResult = await db.collection('reminder_settings')
      .where({
        _openid: OPENID
      })
      .get()
    
    if (settingsResult.data.length === 0) {
      return {
        success: true,
        message: '未设置提醒'
      }
    }
    
    const settings = settingsResult.data[0]
    const today = new Date().toISOString().split('T')[0]
    
    // 获取今日训练记录
    const todayTraining = await db.collection('training_records')
      .where({
        _openid: OPENID,
        date: today
      })
      .get()
    
    // 获取最后训练日期
    const lastTraining = await db.collection('training_records')
      .where({
        _openid: OPENID
      })
      .orderBy('date', 'desc')
      .limit(1)
      .get()
    
    const messages: string[] = []
    
    // 每日提醒
    if (settings.dailyReminder?.enabled) {
      if (todayTraining.data.length === 0) {
        messages.push('今日还未训练，加油！💪')
      }
    }
    
    // 三天未训练提醒
    if (settings.threeDayReminder?.enabled && lastTraining.data.length > 0) {
      const lastDate = new Date(lastTraining.data[0].date)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 3) {
        messages.push(`已经${diffDays}天没有训练了，快行动起来！🏋️`)
      }
    }
    
    // 部位提醒（智能推荐）
    if (settings.bodyPartReminder?.enabled) {
      const recommendedPart = await getRecommendedBodyPart(OPENID)
      if (recommendedPart) {
        messages.push(`今日推荐训练：${recommendedPart} 🔥`)
      }
    }
    
    // 发送推送消息
    if (messages.length > 0) {
      // 注意：实际部署时需要配置订阅消息
      // 这里仅作为示例，实际推送需要用户订阅消息模板
      console.log('推送消息:', messages.join('\n'))
      
      // 如果有订阅消息模板，可以调用 sendSubscribeMessage
      // await cloud.openapi.subscribeMessage.send({
      //   touser: OPENID,
      //   templateId: 'YOUR_TEMPLATE_ID',
      //   page: 'pages/index/index',
      //   data: {
      //     thing1: { value: messages.join('\n') }
      //   }
      // })
    }
    
    return {
      success: true,
      message: messages.length > 0 ? messages.join('\n') : '无提醒消息'
    }
  } catch (err) {
    console.error('Send notification error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

/**
 * 智能推荐训练部位
 * 基于历史训练频率和用户习惯推荐
 */
async function getRecommendedBodyPart(OPENID: string): Promise<string | null> {
  // 获取最近 30 天的训练记录
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const recordsResult = await db.collection('training_records')
    .where({
      _openid: OPENID,
      date: _.gte(thirtyDaysAgo.toISOString().split('T')[0])
    })
    .get()
  
  const records = recordsResult.data
  
  if (records.length === 0) {
    return null
  }
  
  // 统计各部位训练次数
  const partCount: { [key: string]: number } = {
    chest: 0,
    back: 0,
    legs: 0,
    shoulders: 0,
    arms: 0,
    cardio: 0
  }
  
  records.forEach(record => {
    if (record.bodyPart && partCount.hasOwnProperty(record.bodyPart)) {
      partCount[record.bodyPart]++
    }
  })
  
  // 找出训练次数最少的部位
  const partLabels: { [key: string]: string } = {
    chest: '胸',
    back: '背',
    legs: '腿',
    shoulders: '肩',
    arms: '手臂',
    cardio: '有氧'
  }
  
  let minPart = ''
  let minCount = Infinity
  
  for (const [part, count] of Object.entries(partCount)) {
    if (count < minCount) {
      minCount = count
      minPart = part
    }
  }
  
  return minPart ? partLabels[minPart] : null
}

// 引入命令式 API 用于条件查询
const _ = db.command

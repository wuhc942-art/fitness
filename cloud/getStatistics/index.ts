/**
 * 云函数：获取统计数据
 * 
 * 用于首页展示训练统计数据
 */

import cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 主函数
 */
exports.main = async (event: any, context: any) => {
  try {
    const { OPENID } = context
    
    // 获取所有训练记录
    const trainingRecords = await db.collection('training_records')
      .where({
        _openid: OPENID
      })
      .orderBy('date', 'desc')
      .get()
    
    const records = trainingRecords.data
    
    // 计算连续训练天数
    const continuousDays = calculateContinuousDays(records)
    
    // 计算本月训练次数
    const monthCount = calculateMonthCount(records)
    
    // 计算总训练时长
    const totalDuration = calculateTotalDuration(records)
    
    // 获取 PR 记录
    const prRecords = calculatePRRecords(records)
    
    // 获取本周热力图数据
    const heatMapData = calculateHeatMapData(records)
    
    return {
      success: true,
      data: {
        continuousDays,
        monthCount,
        totalDuration,
        prRecords,
        heatMapData
      }
    }
  } catch (err) {
    console.error('Get statistics error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

/**
 * 计算连续训练天数
 * 从最近一次训练日期开始，向前统计连续有训练记录的天数
 */
function calculateContinuousDays(records: any[]): number {
  if (records.length === 0) return 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const mostRecent = new Date(records[0].date)
  mostRecent.setHours(0, 0, 0, 0)
  
  // 检查最近一次训练是否是今天或昨天
  const diffDays = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays > 1) return 0
  
  // 连续计数
  let consecutiveDays = 1
  for (let i = 1; i < records.length; i++) {
    const currentDate = new Date(records[i - 1].date)
    const prevDate = new Date(records[i].date)
    
    currentDate.setHours(0, 0, 0, 0)
    prevDate.setHours(0, 0, 0, 0)
    
    const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (dayDiff === 1) {
      consecutiveDays++
    } else {
      break
    }
  }
  
  return consecutiveDays
}

/**
 * 计算本月训练次数
 */
function calculateMonthCount(records: any[]): number {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
  const currentMonthPrefix = `${currentYear}-${currentMonth}`
  
  return records.filter(record => record.date.startsWith(currentMonthPrefix)).length
}

/**
 * 计算总训练时长（分钟）
 */
function calculateTotalDuration(records: any[]): number {
  return records.reduce((sum, record) => sum + (record.duration || 0), 0)
}

/**
 * 计算 PR 记录（各动作最大重量和 1RM）
 */
function calculatePRRecords(records: any[]): any[] {
  const actionMaxMap = new Map<string, any>()
  
  records.forEach(record => {
    if (!record.actions || !Array.isArray(record.actions)) return
    
    record.actions.forEach((action: any) => {
      const estimated1RM = action.estimated1RM || (action.weight * (1 + 0.0333 * action.reps))
      
      const existing = actionMaxMap.get(action.name)
      
      if (!existing || estimated1RM > existing.max1RM) {
        actionMaxMap.set(action.name, {
          actionName: action.name,
          maxWeight: action.weight,
          max1RM: estimated1RM,
          date: record.date
        })
      }
    })
  })
  
  return Array.from(actionMaxMap.values())
}

/**
 * 计算本周热力图数据
 */
function calculateHeatMapData(records: any[]): any {
  // 获取本周一的日期
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  
  const weekStart = formatDate(monday)
  const weekDates = getWeekDates(weekStart)
  
  // 构建训练日期集合
  const trainingDates = new Set(records.map(r => r.date))
  
  const weekDayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  
  const days = weekDates.map((date, index) => ({
    date,
    hasTraining: trainingDates.has(date),
    dayIndex: index,
    dayLabel: weekDayLabels[index]
  }))
  
  return {
    weekStart,
    days
  }
}

/**
 * 获取本周所有日期（从周一开始）
 */
function getWeekDates(weekStart: string): string[] {
  const dates: string[] = []
  const start = new Date(weekStart)
  
  for (let i = 0; i < 7; i++) {
    const current = new Date(start)
    current.setDate(start.getDate() + i)
    dates.push(formatDate(current))
  }
  
  return dates
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

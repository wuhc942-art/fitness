/**
 * 日期处理工具函数
 */

/**
 * 获取当前日期的字符串表示（YYYY-MM-DD）
 * 
 * @returns 日期字符串
 */
export function getCurrentDate(): string {
  return formatDate(new Date())
}

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * 
 * @param date Date 对象或时间戳
 * @returns 日期字符串
 */
export function formatDate(date: Date | number | string): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取本周的周一日期
 * 
 * @param date 基准日期，默认为今天
 * @returns 本周一的日期字符串
 */
export function getWeekStart(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 调整为周一
  const monday = new Date(d.setDate(diff))
  return formatDate(monday)
}

/**
 * 获取本周的周日日期
 * 
 * @param date 基准日期，默认为今天
 * @returns 本周日的日期字符串
 */
export function getWeekEnd(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = d.getDay()
  const diff = d.getDate() + (day === 0 ? 0 : 7 - day)
  const sunday = new Date(d.setDate(diff))
  return formatDate(sunday)
}

/**
 * 获取本周所有日期（周一到周日）
 * 
 * @param date 基准日期，默认为今天
 * @returns 包含本周所有日期的数组
 */
export function getWeekDates(date: Date | string = new Date()): string[] {
  const d = typeof date === 'string' ? new Date(date) : date
  const weekStart = getWeekStart(d)
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
 * 获取星期几的中文标签
 * 
 * @param date 日期
 * @returns 星期几（周一 - 周日）
 */
export function getWeekdayLabel(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[d.getDay()]
}

/**
 * 获取日期是星期几
 * 
 * @param date 日期字符串
 * @returns 星期几的字符串
 */
export function getWeekDay(date: string): string {
  const d = new Date(date)
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[d.getDay()]
}

/**
 * 计算两个日期之间的天数差
 * 
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 天数差
 */
export function getDaysDiff(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  const diffTime = end.getTime() - start.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 判断两个日期是否连续（相差 1 天）
 * 
 * @param date1 日期 1
 * @param date2 日期 2
 * @returns 是否连续
 */
export function isConsecutiveDay(date1: string | Date, date2: string | Date): boolean {
  const diff = getDaysDiff(date1, date2)
  return Math.abs(diff) === 1
}

/**
 * 判断日期是否是今天
 * 
 * @param date 日期
 * @returns 是否是今天
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return d.getFullYear() === today.getFullYear() &&
         d.getMonth() === today.getMonth() &&
         d.getDate() === today.getDate()
}

/**
 * 判断日期是否是昨天
 * 
 * @param date 日期
 * @returns 是否是昨天
 */
export function isYesterday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return d.getFullYear() === yesterday.getFullYear() &&
         d.getMonth() === yesterday.getMonth() &&
         d.getDate() === yesterday.getDate()
}

/**
 * 获取月份字符串（YYYY-MM）
 * 
 * @param date 日期
 * @returns 月份字符串
 */
export function getMonth(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * 获取某月的所有日期
 * 
 * @param year 年份
 * @param month 月份（0-11）
 * @returns 该月所有日期数组
 */
export function getMonthDates(year: number, month: number): string[] {
  const date = new Date(year, month, 1)
  const dates: string[] = []
  
  while (date.getMonth() === month) {
    dates.push(formatDate(new Date(date)))
    date.setDate(date.getDate() + 1)
  }
  
  return dates
}

/**
 * 计算从指定日期开始向前连续有记录的天数
 * 
 * @param records 日期字符串数组（已按倒序排序）
 * @returns 连续天数
 */
export function calculateContinuousDays(records: string[]): number {
  if (records.length === 0) return 0
  
  const today = new Date()
  const mostRecent = new Date(records[0])
  
  // 检查最近一次训练是否是今天或昨天
  const diffDays = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays > 1) return 0
  
  // 连续计数
  let consecutiveDays = 1
  for (let i = 1; i < records.length; i++) {
    const prevDate = new Date(records[i - 1])
    const currDate = new Date(records[i])
    
    if (isConsecutiveDay(prevDate, currDate)) {
      consecutiveDays++
    } else {
      break
    }
  }
  
  return consecutiveDays
}

/**
 * 统计指定月份的训练次数
 * 
 * @param records 训练记录日期数组
 * @param targetMonth 目标月份（YYYY-MM）
 * @returns 训练次数
 */
export function countRecordsInMonth(records: string[], targetMonth: string): number {
  return records.filter(date => date.startsWith(targetMonth)).length
}

/**
 * 获取最近的日期（如果记录不为空）
 * 
 * @param records 训练记录日期数组
 * @returns 最近的日期或 null
 */
export function getMostRecentDate(records: string[]): string | null {
  if (records.length === 0) return null
  return records[0]
}

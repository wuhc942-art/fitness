/**
 * 数据验证工具函数
 */

import type { TrainingRecord, ActionRecord, TrainingRecordForm } from '@/types/training'
import type { BodyDataRecord, BodyDataForm } from '@/types/body-data'

/**
 * 验证动作记录
 * 
 * @param action 动作记录
 * @returns 验证结果
 */
export function validateAction(action: ActionRecord): { valid: boolean; error?: string } {
  if (!action.name || action.name.trim() === '') {
    return { valid: false, error: '动作名称不能为空' }
  }
  
  if (typeof action.weight !== 'number' || action.weight <= 0) {
    return { valid: false, error: '重量必须是正数' }
  }
  
  if (typeof action.reps !== 'number' || action.reps <= 0 || !Number.isInteger(action.reps)) {
    return { valid: false, error: '次数必须是正整数' }
  }
  
  if (typeof action.sets !== 'number' || action.sets <= 0 || !Number.isInteger(action.sets)) {
    return { valid: false, error: '组数必须是正整数' }
  }
  
  if (action.rpe !== undefined && (action.rpe < 1 || action.rpe > 10)) {
    return { valid: false, error: 'RPE 必须在 1-10 之间' }
  }
  
  return { valid: true }
}

/**
 * 验证训练记录表单
 * 
 * @param form 训练记录表单
 * @returns 验证结果
 */
export function validateTrainingForm(form: TrainingRecordForm): { valid: boolean; error?: string } {
  if (!form.date) {
    return { valid: false, error: '请选择训练日期' }
  }
  
  if (!form.bodyPart) {
    return { valid: false, error: '请选择训练部位' }
  }
  
  if (typeof form.duration !== 'number' || form.duration <= 0) {
    return { valid: false, error: '训练时长必须大于 0' }
  }
  
  if (!form.location) {
    return { valid: false, error: '请选择训练地点' }
  }
  
  if (!form.actions || form.actions.length === 0) {
    return { valid: false, error: '请至少添加一个动作' }
  }
  
  // 验证每个动作
  for (const action of form.actions) {
    const result = validateAction(action)
    if (!result.valid) {
      return { valid: false, error: `动作 "${action.name}": ${result.error}` }
    }
  }
  
  // 验证日期不能是未来
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // 将日期字符串解析为本地时间的午夜，避免时区问题
  const recordDate = new Date(form.date + 'T00:00:00')
  if (recordDate > today) {
    return { valid: false, error: '训练日期不能是未来日期' }
  }
  
  return { valid: true }
}

/**
 * 验证训练记录（用于从服务器获取的数据）
 * 
 * @param record 训练记录
 * @returns 验证结果
 */
export function validateTrainingRecord(record: TrainingRecord): { valid: boolean; error?: string } {
  if (!record.date) {
    return { valid: false, error: '缺少训练日期' }
  }
  
  if (!record.bodyPart) {
    return { valid: false, error: '缺少训练部位' }
  }
  
  if (typeof record.duration !== 'number' || record.duration <= 0) {
    return { valid: false, error: '训练时长无效' }
  }
  
  if (!record.location) {
    return { valid: false, error: '缺少训练地点' }
  }
  
  if (!record.actions || record.actions.length === 0) {
    return { valid: false, error: '训练记录必须包含至少一个动作' }
  }
  
  // 验证每个动作
  for (const action of record.actions) {
    const result = validateAction(action)
    if (!result.valid) {
      return { valid: false, error: `动作 "${action.name}": ${result.error}` }
    }
  }
  
  return { valid: true }
}

/**
 * 验证身体数据表单
 * 
 * @param form 身体数据表单
 * @returns 验证结果
 */
export function validateBodyDataForm(form: BodyDataForm): { valid: boolean; error?: string } {
  if (!form.date) {
    return { valid: false, error: '请选择记录日期' }
  }
  
  if (typeof form.height !== 'number' || form.height <= 0 || form.height > 300) {
    return { valid: false, error: '身高必须在 0-300cm 之间' }
  }
  
  if (typeof form.weight !== 'number' || form.weight <= 0 || form.weight > 500) {
    return { valid: false, error: '体重必须在 0-500kg 之间' }
  }
  
  // 验证可选字段
  if (form.bodyFat !== undefined && (form.bodyFat < 0 || form.bodyFat > 100)) {
    return { valid: false, error: '体脂率必须在 0-100% 之间' }
  }
  
  if (form.waist !== undefined && (form.waist <= 0 || form.waist > 200)) {
    return { valid: false, error: '腰围必须在 0-200cm 之间' }
  }
  
  if (form.arm !== undefined && (form.arm <= 0 || form.arm > 100)) {
    return { valid: false, error: '手臂围度必须在 0-100cm 之间' }
  }
  
  if (form.sleep !== undefined && (form.sleep < 0 || form.sleep > 24)) {
    return { valid: false, error: '睡眠时长必须在 0-24 小时之间' }
  }
  
  if (form.water !== undefined && (form.water < 0 || form.water > 10000)) {
    return { valid: false, error: '饮水量必须在 0-10000ml 之间' }
  }
  
  // 验证日期不能是未来
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // 将日期字符串解析为本地时间的午夜，避免时区问题
  const recordDate = new Date(form.date + 'T00:00:00')
  if (recordDate > today) {
    return { valid: false, error: '记录日期不能是未来日期' }
  }
  
  return { valid: true }
}

/**
 * 验证身体数据记录
 * 
 * @param record 身体数据记录
 * @returns 验证结果
 */
export function validateBodyDataRecord(record: BodyDataRecord): { valid: boolean; error?: string } {
  if (!record.date) {
    return { valid: false, error: '缺少记录日期' }
  }
  
  if (typeof record.height !== 'number' || record.height <= 0) {
    return { valid: false, error: '身高无效' }
  }
  
  if (typeof record.weight !== 'number' || record.weight <= 0) {
    return { valid: false, error: '体重无效' }
  }
  
  return { valid: true }
}

/**
 * 验证数字输入
 * 
 * @param value 输入值
 * @param min 最小值
 * @param max 最大值
 * @param allowDecimal 是否允许小数
 * @returns 验证结果
 */
export function validateNumber(
  value: any,
  min: number = 0,
  max: number = Infinity,
  allowDecimal: boolean = false
): { valid: boolean; error?: string } {
  if (typeof value !== 'number') {
    return { valid: false, error: '必须是数字' }
  }
  
  if (value < min || value > max) {
    return { valid: false, error: `数值必须在 ${min}-${max} 之间` }
  }
  
  if (!allowDecimal && !Number.isInteger(value)) {
    return { valid: false, error: '必须是整数' }
  }
  
  return { valid: true }
}

/**
 * 验证日期字符串格式
 * 
 * @param date 日期字符串
 * @returns 验证结果
 */
export function validateDateString(date: string): { valid: boolean; error?: string } {
  if (!date || typeof date !== 'string') {
    return { valid: false, error: '日期不能为空' }
  }
  
  // 检查格式 YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(date)) {
    return { valid: false, error: '日期格式必须是 YYYY-MM-DD' }
  }
  
  // 验证日期是否有效
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) {
    return { valid: false, error: '无效的日期' }
  }
  
  // 验证格式是否一致（处理 Feb 30 等情况）
  const formatted = parsed.toISOString().split('T')[0]
  if (formatted !== date) {
    return { valid: false, error: '无效的日期' }
  }
  
  return { valid: true }
}

/**
 * 验证时间字符串格式（HH:mm）
 * 
 * @param time 时间字符串
 * @returns 验证结果
 */
export function validateTimeString(time: string): { valid: boolean; error?: string } {
  if (!time || typeof time !== 'string') {
    return { valid: false, error: '时间不能为空' }
  }
  
  const regex = /^\d{2}:\d{2}$/
  if (!regex.test(time)) {
    return { valid: false, error: '时间格式必须是 HH:mm' }
  }
  
  const [hours, minutes] = time.split(':').map(Number)
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return { valid: false, error: '无效的时间' }
  }
  
  return { valid: true }
}

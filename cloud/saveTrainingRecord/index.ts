/**
 * 云函数：保存训练记录
 * 
 * 用于保存或更新训练记录
 */

import cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * 主函数
 */
exports.main = async (event: any, context: any) => {
  try {
    const { OPENID } = context
    const { record, id } = event
    
    // 验证必填字段
    if (!record || !record.date || !record.bodyPart || !record.duration || !record.location) {
      return {
        success: false,
        error: '缺少必填字段'
      }
    }
    
    if (!record.actions || !Array.isArray(record.actions) || record.actions.length === 0) {
      return {
        success: false,
        error: '训练记录必须包含至少一个动作'
      }
    }
    
    // 验证每个动作的必填字段
    for (const action of record.actions) {
      if (!action.name || action.weight <= 0 || action.reps <= 0 || action.sets <= 0) {
        return {
          success: false,
          error: `动作 "${action.name}" 的重量、次数、组数必须为正数`
        }
      }
    }
    
    // 添加用户 openid
    const recordData = {
      ...record,
      _openid: OPENID
    }
    
    let result
    
    if (id) {
      // 更新已有记录
      const now = new Date().toISOString()
      await db.collection('training_records').doc(id).update({
        data: {
          ...recordData,
          updatedAt: now
        }
      })
      result = { _id: id }
    } else {
      // 创建新记录
      const now = new Date().toISOString()
      recordData.createdAt = now
      recordData.updatedAt = now
      result = await db.collection('training_records').add({
        data: recordData
      })
    }
    
    return {
      success: true,
      _id: result._id,
      _openid: OPENID
    }
  } catch (err) {
    console.error('Save training record error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

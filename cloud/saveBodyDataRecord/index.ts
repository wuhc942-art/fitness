/**
 * 云函数：保存身体数据
 * 
 * 用于保存或更新身体数据记录
 */

import cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event: any, context: any) => {
  try {
    const { OPENID } = context
    const { record, id } = event
    
    // 验证必填字段
    if (!record || !record.date || !record.height || !record.weight) {
      return {
        success: false,
        error: '缺少必填字段（日期、身高、体重）'
      }
    }
    
    if (record.height <= 0 || record.height > 300) {
      return {
        success: false,
        error: '身高必须在 0-300cm 之间'
      }
    }
    
    if (record.weight <= 0 || record.weight > 500) {
      return {
        success: false,
        error: '体重必须在 0-500kg 之间'
      }
    }
    
    const recordData = {
      ...record,
      _openid: OPENID
    }
    
    let result
    
    if (id) {
      const now = new Date().toISOString()
      await db.collection('body_data_records').doc(id).update({
        data: {
          ...recordData,
          updatedAt: now
        }
      })
      result = { _id: id }
    } else {
      const now = new Date().toISOString()
      recordData.createdAt = now
      recordData.updatedAt = now
      result = await db.collection('body_data_records').add({
        data: recordData
      })
    }
    
    return {
      success: true,
      _id: result._id,
      _openid: OPENID
    }
  } catch (err) {
    console.error('Save body data error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

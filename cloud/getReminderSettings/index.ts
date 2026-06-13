/**
 * 云函数：获取提醒设置
 * 
 * 获取用户的提醒设置
 */

import cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event: any, context: any) => {
  try {
    const { OPENID } = context
    
    const result = await db.collection('reminder_settings').where({
      _openid: OPENID
    }).get()
    
    return {
      success: true,
      data: result.data
    }
  } catch (err) {
    console.error('Get reminder settings error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

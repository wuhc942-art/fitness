/**
 * 云函数：更新训练记录
 * 
 * 用于更新已有的训练记录
 */

import cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event: any, context: any) => {
  try {
    const { OPENID } = context
    const { id, updates } = event
    
    if (!id) {
      return {
        success: false,
        error: '缺少记录 ID'
      }
    }
    
    // 验证记录是否属于当前用户
    const record = await db.collection('training_records').doc(id).get()
    
    if (!record.data) {
      return {
        success: false,
        error: '记录不存在'
      }
    }
    
    if (record.data._openid !== OPENID) {
      return {
        success: false,
        error: '无权限修改此记录'
      }
    }
    
    // 更新记录
    await db.collection('training_records').doc(id).update({
      data: updates
    })
    
    return {
      success: true
    }
  } catch (err) {
    console.error('Update training record error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

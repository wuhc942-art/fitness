/**
 * 云函数：删除训练记录
 * 
 * 用于删除训练记录
 */

import cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event: any, context: any) => {
  try {
    const { OPENID } = context
    const { id } = event
    
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
        error: '无权限删除此记录'
      }
    }
    
    // 删除记录
    await db.collection('training_records').doc(id).remove()
    
    return {
      success: true
    }
  } catch (err) {
    console.error('Delete training record error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

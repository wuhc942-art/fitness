/**
 * 云函数：删除训练模板
 * 
 * 用于删除训练模板
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
        error: '缺少模板 ID'
      }
    }
    
    // 先验证模板是否属于当前用户
    const template = await db.collection('training_templates')
      .doc(id)
      .get()
    
    if (!template.data) {
      return {
        success: false,
        error: '模板不存在'
      }
    }
    
    if (template.data._openid !== OPENID) {
      return {
        success: false,
        error: '无权限删除此模板'
      }
    }
    
    // 删除模板
    await db.collection('training_templates').doc(id).remove()
    
    return {
      success: true
    }
  } catch (err) {
    console.error('Delete template error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

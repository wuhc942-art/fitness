/**
 * 云函数：保存训练模板
 * 
 * 用于创建或更新训练模板
 */

import cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event: any, context: any) => {
  try {
    const { OPENID } = context
    const { template, id } = event
    
    // 验证必填字段
    if (!template || !template.name || !template.actions) {
      return {
        success: false,
        error: '缺少必填字段（名称、动作列表）'
      }
    }
    
    if (!Array.isArray(template.actions)) {
      return {
        success: false,
        error: '动作列表必须是数组'
      }
    }
    
    const templateData = {
      ...template,
      _openid: OPENID
    }
    
    let result
    
    if (id) {
      // 更新已有模板
      const now = new Date().toISOString()
      await db.collection('training_templates').doc(id).update({
        data: {
          ...templateData,
          updatedAt: now
        }
      })
      result = { _id: id }
    } else {
      // 创建新模板
      const now = new Date().toISOString()
      templateData.createdAt = now
      templateData.updatedAt = now
      result = await db.collection('training_templates').add({
        data: templateData
      })
    }
    
    return {
      success: true,
      _id: result._id,
      _openid: OPENID
    }
  } catch (err) {
    console.error('Save template error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

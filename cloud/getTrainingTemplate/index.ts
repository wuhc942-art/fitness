/**
 * 云函数：获取训练模板
 * 
 * 获取用户的训练模板列表或单个模板详情
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
    
    let query = db.collection('training_templates').where({
      _openid: OPENID
    })
    
    if (id) {
      // 获取单个模板详情
      const result = await query.doc(id).get()
      return {
        success: true,
        data: result.data ? [result.data] : []
      }
    } else {
      // 获取所有模板（按更新时间倒序）
      const result = await query.orderBy('updatedAt', 'desc').get()
      return {
        success: true,
        data: result.data
      }
    }
  } catch (err) {
    console.error('Get template error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

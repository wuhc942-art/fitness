/**
 * 云函数：获取身体数据记录
 * 
 * 获取用户的身体数据记录列表
 */

import cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event: any, context: any) => {
  try {
    const { OPENID } = context
    const { start, end } = event || {}
    
    let query = db.collection('body_data_records').where({
      _openid: OPENID
    })
    
    // 如果提供了日期范围，进行过滤
    if (start && end) {
      query = query.where({
        date: _.gte(start).and(_.lte(end))
      })
    }
    
    // 按日期倒序排列
    const result = await query.orderBy('date', 'desc').get()
    
    return {
      success: true,
      data: result.data
    }
  } catch (err) {
    console.error('Get body data error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

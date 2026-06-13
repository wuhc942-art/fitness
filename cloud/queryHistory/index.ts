/**
 * 云函数：查询历史记录
 * 
 * 支持按日期、部位、动作查询训练记录
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
    const { startDate, endDate, bodyPart, actionName } = event
    
    let query = db.collection('training_records').where({
      _openid: OPENID
    })
    
    // 日期范围查询
    if (startDate && endDate) {
      query = query.where({
        date: _.gte(startDate).and(_.lte(endDate))
      })
    } else if (startDate) {
      query = query.where({
        date: _.gte(startDate)
      })
    } else if (endDate) {
      query = query.where({
        date: _.lte(endDate)
      })
    }
    
    // 训练部位查询
    if (bodyPart) {
      query = query.where({
        bodyPart
      })
    }
    
    // 动作名称查询（模糊匹配）
    if (actionName) {
      const allRecords = await query.orderBy('date', 'desc').get()
      const filtered = allRecords.data.filter((record: any) => {
        if (!record.actions || !Array.isArray(record.actions)) return false
        return record.actions.some((action: any) => 
          action.name.toLowerCase().includes(actionName.toLowerCase())
        )
      })
      return {
        success: true,
        data: filtered
      }
    }
    
    const result = await query.orderBy('date', 'desc').get()
    
    return {
      success: true,
      data: result.data
    }
  } catch (err) {
    console.error('Query history error:', err)
    return {
      success: false,
      error: err.message
    }
  }
}

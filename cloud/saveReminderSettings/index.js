/**
 * 云函数：保存提醒设置
 */

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

function getOpenId(context) {
  const wxContext = cloud.getWXContext ? cloud.getWXContext() : {}
  return wxContext.OPENID || context.OPENID || ''
}

exports.main = async (event, context) => {
  try {
    const OPENID = getOpenId(context || {})
    const { settings, id } = event

    if (!settings) {
      return {
        success: false,
        error: '缺少设置数据'
      }
    }

    if (!OPENID) {
      return {
        success: false,
        error: '获取 openid 失败，请用真机或已登录的小程序环境重试'
      }
    }

    const settingsData = {
      ...settings,
      _openid: OPENID
    }

    let result

    if (id) {
      const now = new Date().toISOString()
      await db.collection('reminder_settings').doc(id).update({
        data: {
          ...settingsData,
          updatedAt: now
        }
      })
      result = { _id: id }
    } else {
      const existing = await db.collection('reminder_settings').where({
        _openid: OPENID
      }).get()

      if (existing.data.length > 0) {
        const now = new Date().toISOString()
        await db.collection('reminder_settings').doc(existing.data[0]._id).update({
          data: {
            ...settingsData,
            updatedAt: now
          }
        })
        result = { _id: existing.data[0]._id }
      } else {
        const now = new Date().toISOString()
        settingsData.createdAt = now
        settingsData.updatedAt = now
        result = await db.collection('reminder_settings').add({
          data: settingsData
        })
      }
    }

    return {
      success: true,
      _id: result._id,
      _openid: OPENID
    }
  } catch (err) {
    console.error('Save reminder settings error:', err)
    return {
      success: false,
      error: err && err.message || String(err)
    }
  }
}

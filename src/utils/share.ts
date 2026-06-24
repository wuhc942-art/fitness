import { onShareAppMessage, onShareTimeline, onShow } from '@dcloudio/uni-app'

export interface ShareConfig {
  title?: string
  path?: string
  imageUrl?: string
  query?: string
}

const DEFAULT_SHARE_TITLE = 'FitAI 健身记录'
const DEFAULT_SHARE_PATH = '/pages/index/index'

export function useMiniProgramShare(config: ShareConfig = {}) {
  const title = config.title || DEFAULT_SHARE_TITLE
  const path = config.path || DEFAULT_SHARE_PATH
  const imageUrl = config.imageUrl || ''

  onShow(() => {
    const shareMenu = (uni as any).showShareMenu
    if (typeof shareMenu !== 'function') return
    shareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  })

  onShareAppMessage(() => ({
    title,
    path,
    imageUrl
  }))

  onShareTimeline(() => ({
    title,
    query: config.query || '',
    imageUrl
  }))
}

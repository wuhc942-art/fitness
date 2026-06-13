/**
 * uni-app 和微信小程序云开发全局类型声明
 */

declare const wx: {
  /**
   * 调用云函数
   */
  cloud: {
    callFunction(options: {
      name: string
      data?: any
      success?: (result: any) => void
      fail?: (err: any) => void
      complete?: (res: any) => void
    }): Promise<any>
    
    /**
     * 初始化云开发环境
     */
    init(options?: {
      env?: string | {
        database?: string
        functions?: string
        storage?: string
      }
      traceUser?: boolean
    }): void
    
    /**
     * 云开发当前环境 ID
     */
    DYNAMIC_CURRENT_ENV: string
  }
  
  /**
   * 显示提示框
   */
  showToast(options: {
    title: string
    icon?: 'success' | 'loading' | 'none'
    image?: string
    duration?: number
    mask?: boolean
  }): void
  
  /**
   * 显示模态框
   */
  showModal(options: {
    title: string
    content: string
    showCancel?: boolean
    cancelText?: string
    cancelColor?: string
    confirmText?: string
    confirmColor?: string
    success?: (res: any) => void
  }): void
  
  /**
   * 页面导航
   */
  navigateTo(options: {
    url: string
    events?: any
    success?: () => void
    fail?: () => void
    complete?: () => void
  }): void
  
  /**
   * 返回上一页
   */
  navigateBack(options: {
    delta?: number
  }): void
  
  /**
   * 跳转到 tabBar 页面
   */
  switchTab(options: {
    url: string
  }): void
  
  /**
   * 关闭当前页面，跳转到应用内的某个页面
   */
  redirectTo(options: {
    url: string
  }): void
  
  /**
   * 设置存储
   */
  setStorageSync(key: string, data: any): void
  
  /**
   * 获取存储
   */
  getStorageSync(key: string): any
  
  /**
   * 删除存储
   */
  removeStorageSync(key: string): void
  
  /**
   * 清空存储
   */
  clearStorageSync(): void
}

/**
 * 微信小程序云数据库
 */
declare namespace wx.cloud {
  interface Database {
    collection(name: string): Collection
  }
  
  interface Collection {
    add(options: { data: any }): Promise<any>
    doc(id: string): Document
    where(query: any): Query
    orderBy(field: string, order: string): Query
    limit(max: number): Query
    skip(offset: number): Query
    get(): Promise<any>
    update(data: any): Promise<any>
    remove(): Promise<any>
  }
  
  interface Document {
    get(): Promise<any>
    update(data: any): Promise<any>
    remove(): Promise<any>
  }
  
  interface Query {
    orderBy(field: string, order: string): Query
    limit(max: number): Query
    skip(offset: number): Query
    get(): Promise<any>
    update(data: any): Promise<any>
    remove(): Promise<any>
  }
}

declare namespace WechatMiniprogram {
  interface Page {
    data: any
    setData(data: any): void
  }
  
  interface App {
    globalData: any
  }
}

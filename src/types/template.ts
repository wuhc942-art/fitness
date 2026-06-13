/**
 * 训练模板相关类型定义
 */

/**
 * 训练模板
 */
export interface TrainingTemplate {
  /** 云数据库文档 ID */
  _id?: string
  /** 用户 openid（云数据库自动添加） */
  _openid?: string
  /** 模板名称 */
  name: string
  /** 预设动作名称列表 */
  actions: string[]
  /** 创建时间 ISO 8601 */
  createdAt: string
  /** 更新时间 ISO 8601 */
  updatedAt: string
}

/**
 * 训练模板表单（用于页面输入）
 */
export interface TrainingTemplateForm {
  name: string
  actions: string[]
}

/**
 * 模板列表项（用于列表展示）
 */
export interface TemplateListItem {
  _id: string
  name: string
  actionCount: number
  updatedAt: string
}

/**
 * 身体数据相关类型定义
 */

/**
 * 身体数据记录
 */
export interface BodyDataRecord {
  /** 云数据库文档 ID */
  _id?: string
  /** 用户 openid（云数据库自动添加） */
  _openid?: string
  /** 记录日期 YYYY-MM-DD */
  date: string
  /** 身高（cm，必填） */
  height: number
  /** 体重（kg，必填） */
  weight: number
  /** 体脂率（%，可选） */
  bodyFat?: number
  /** 腰围（cm，可选） */
  waist?: number
  /** 胸围（cm，可选） */
  chest?: number
  /** 臀围（cm，可选） */
  hip?: number
  /** 手臂围度（cm，可选） */
  arm?: number
  /** 睡眠时长（小时，可选） */
  sleep?: number
  /** 饮水量（ml，可选） */
  water?: number
  /** 创建时间 ISO 8601 */
  createdAt: string
  /** 更新时间 ISO 8601 */
  updatedAt: string
}

/**
 * 身体数据表单（用于页面输入）
 */
export interface BodyDataForm {
  date: string
  height: number
  weight: number
  bodyFat?: number
  waist?: number
  chest?: number
  hip?: number
  arm?: number
  sleep?: number
  water?: number
}

/**
 * 身体数据趋势点（用于图表）
 */
export interface BodyDataTrendPoint {
  /** 日期 */
  date: string
  /** 体重 */
  weight: number
  /** 体脂率（可选） */
  bodyFat?: number
  /** 腰围（可选） */
  waist?: number
  /** 胸围（可选） */
  chest?: number
  /** 臀围（可选） */
  hip?: number
  /** 手臂围度（可选） */
  arm?: number
}

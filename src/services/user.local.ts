import { trainingServiceLocal } from '@/services/training.local'
import { bodyDataServiceLocal } from '@/services/body-data.local'
import { trainingPlanServiceLocal } from '@/services/training-plan.local'

const STORAGE_KEY = 'fitness_user_profile'

export type MemberStatus = 'free' | 'vip'

export interface UserProfile {
  nickname: string
  avatar: string
  memberStatus: MemberStatus
  createdAt: string
  updatedAt: string
}

export interface UserGrowth {
  points: number
  level: number
  levelName: string
  nextLevelPoints: number
  progress: number
  stats: {
    trainingCount: number
    bodyRecordCount: number
    planCount: number
    totalDuration: number
  }
}

const defaultProfile = (): UserProfile => ({
  nickname: 'FitAI 用户',
  avatar: '',
  memberStatus: 'free',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

function levelName(level: number) {
  if (level >= 8) return '自律大师'
  if (level >= 6) return '进阶训练者'
  if (level >= 4) return '稳定执行者'
  if (level >= 2) return '训练入门'
  return '刚刚开始'
}

export const userServiceLocal = {
  async getProfile(): Promise<UserProfile> {
    try {
      const raw = uni.getStorageSync(STORAGE_KEY)
      if (!raw) return defaultProfile()
      const saved = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return defaultProfile()
      return { ...defaultProfile(), ...saved }
    } catch (error) {
      console.error('读取用户档案失败:', error)
      return defaultProfile()
    }
  },

  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    const next = { ...profile, updatedAt: new Date().toISOString() }
    if (!next.createdAt) next.createdAt = new Date().toISOString()
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(next))
    return next
  },

  async getGrowth(): Promise<UserGrowth> {
    const records = await trainingServiceLocal.getAllRecords()
    const bodyRecords = await bodyDataServiceLocal.getRecords()
    const plans = await trainingPlanServiceLocal.getPlans()
    const totalDuration = records.reduce((sum, record) => sum + (Number(record.duration) || 0), 0)
    const points = records.length * 20 + bodyRecords.length * 8 + plans.length * 30 + Math.floor(totalDuration / 30)
    const level = Math.max(1, Math.floor(points / 120) + 1)
    const currentLevelStart = (level - 1) * 120
    const nextLevelPoints = level * 120
    const progress = Math.min(100, Math.round(((points - currentLevelStart) / 120) * 100))

    return {
      points,
      level,
      levelName: levelName(level),
      nextLevelPoints,
      progress,
      stats: {
        trainingCount: records.length,
        bodyRecordCount: bodyRecords.length,
        planCount: plans.length,
        totalDuration
      }
    }
  }
}

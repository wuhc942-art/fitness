const STORAGE_KEY = 'fitness_body_profile'

export type Gender = 'male' | 'female' | 'other'
export type FitnessGoal = 'muscle' | 'fatLoss' | 'shape' | 'strength'

export interface BodyProfile {
  gender: Gender
  age: number | ''
  height: number | ''
  targetWeight: number | ''
  goal: FitnessGoal
  updatedAt: string
}

const defaultProfile = (): BodyProfile => ({
  gender: 'male',
  age: '',
  height: '',
  targetWeight: '',
  goal: 'muscle',
  updatedAt: new Date().toISOString()
})

export const bodyProfileServiceLocal = {
  async getProfile(): Promise<BodyProfile> {
    try {
      const raw = uni.getStorageSync(STORAGE_KEY)
      if (!raw) return defaultProfile()
      const saved = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return defaultProfile()
      return { ...defaultProfile(), ...saved }
    } catch (error) {
      console.error('读取身体档案失败:', error)
      return defaultProfile()
    }
  },

  async saveProfile(profile: BodyProfile): Promise<BodyProfile> {
    const next = { ...profile, updatedAt: new Date().toISOString() }
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(next))
    return next
  }
}

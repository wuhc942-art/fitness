export type BodyPart = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'full'

export const BODY_PART_LABELS: Record<BodyPart, string> = {
  chest: '胸',
  back: '背',
  legs: '腿',
  shoulders: '肩',
  arms: '手臂',
  core: '核心',
  cardio: '有氧',
  full: '全身'
}

export type TrainingLocation = 'gym' | 'home' | 'outdoor' | 'office' | 'other'

export const LOCATION_LABELS: Record<TrainingLocation, string> = {
  gym: '健身房',
  home: '家里',
  outdoor: '户外',
  office: '办公室',
  other: '其他'
}

export interface SetDetail {
  setNumber: number
  weight: number
  reps: number
  rpe?: number
}

export interface ActionRecord {
  name: string
  weight: number
  reps: number
  sets: number
  rpe?: number
  notes?: string
  setsDetail?: SetDetail[]
  volume?: number
  estimated1RM?: number
}

export interface TrainingRecord {
  _id?: string
  _openid?: string
  date: string
  bodyPart: BodyPart
  duration: number
  location: TrainingLocation
  feeling?: string
  actions: ActionRecord[]
  totalVolume?: number
  createdAt: string
  updatedAt: string
}

export interface TrainingRecordForm {
  date: string
  bodyPart: BodyPart
  duration: number
  location: TrainingLocation
  feeling?: string
  actions: ActionRecord[]
}

export interface PRRecord {
  actionName: string
  maxWeight: number
  max1RM: number
  date: string
}

export interface ActionHistoryItem {
  date: string
  name: string
  weight: number
  reps: number
  sets: number
  estimated1RM: number
  bodyPart: BodyPart
}

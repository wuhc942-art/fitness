import type { TrainingRecord } from '@/types/training'
import { trainingServiceLocal } from '@/services/training.local'
import { calculateBestSet } from '@/utils/calculator'

export interface GrowthAttribute {
  label: '力量' | '耐力' | '稳定' | '恢复'
  value: number
}

export interface GrowthProfile {
  level: number
  experience: number
  nextLevelExperience: number
  progressPercent: number
  title: string
  questTitle: string
  questSubtitle: string
  rewardText: string
  attributes: GrowthAttribute[]
}

interface TodayPlanLike {
  day?: {
    templateName?: string
    completed?: boolean
  }
  week?: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function totalVolume(record: TrainingRecord) {
  return (record.actions || []).reduce((sum, action) => {
    const detailed = action.setsDetail?.reduce((setSum, set) => setSum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0)
    return sum + (detailed || Number(action.volume) || (Number(action.weight) || 0) * (Number(action.reps) || 0) * (Number(action.sets) || 0))
  }, 0)
}

function strongestSet(records: TrainingRecord[]): { name: string; weight: number; reps: number } | null {
  let best: { name: string; weight: number; reps: number } | null = null
  for (const record of records) {
    for (const action of record.actions || []) {
      const set = calculateBestSet(action)
      if (!best || set.weight > best.weight) best = { name: action.name, weight: set.weight, reps: set.reps }
    }
  }
  return best
}

function uniqueTrainingDays(records: TrainingRecord[]) {
  return new Set(records.map((record) => record.date)).size
}

function latestRecord(records: TrainingRecord[]) {
  return [...records].sort((a, b) => b.date.localeCompare(a.date))[0]
}

function titleFor(level: number, records: TrainingRecord[]) {
  if (!records.length) return '待激活训练者'
  if (level >= 10) return '稳定进阶者'
  if (level >= 5) return '持续训练者'
  return '训练起步者'
}

export function buildGrowthProfile(records: TrainingRecord[], todayPlan?: TodayPlanLike | null): GrowthProfile {
  const sessions = records.length
  const days = uniqueTrainingDays(records)
  const volume = records.reduce((sum, record) => sum + totalVolume(record), 0)
  const duration = records.reduce((sum, record) => sum + (Number(record.duration) || 0), 0)
  const experience = Math.round(sessions * 90 + days * 30 + volume / 120 + duration / 3)
  const levelStep = 250
  const level = Math.max(1, Math.floor(experience / levelStep) + 1)
  const currentLevelBase = (level - 1) * levelStep
  const nextLevelExperience = level * levelStep
  const progressPercent = clamp(Math.round(((experience - currentLevelBase) / levelStep) * 100), 0, 100)
  const best = strongestSet(records)
  const last = latestRecord(records)
  const hasTodayPlan = !!todayPlan?.day?.templateName
  const questName = hasTodayPlan ? todayPlan?.day?.templateName || '今日训练' : '自由训练'
  const questTitle = todayPlan?.day?.completed ? `今日任务已完成：${questName}` : `今日任务：${questName}`
  const questSubtitle = best
    ? `参考 ${best.name} ${best.weight}kg x ${best.reps}，优先保持动作稳定。`
    : '完成第一条真实训练记录后，成长档案会开始积累。'
  const rewardText = `完成后预计获得 经验 +${hasTodayPlan ? 90 : 60}`

  return {
    level,
    experience,
    nextLevelExperience,
    progressPercent,
    title: titleFor(level, records),
    questTitle,
    questSubtitle: last ? questSubtitle : '先建立一次训练基线，后续建议会更准确。',
    rewardText,
    attributes: [
      { label: '力量', value: clamp(Math.round(volume / 260), 8, 99) },
      { label: '耐力', value: clamp(Math.round(duration / 12), 8, 99) },
      { label: '稳定', value: clamp(Math.round(days * 8 + sessions * 3), 8, 99) },
      { label: '恢复', value: clamp(72 - Math.max(0, sessions - days) * 5, 35, 95) }
    ]
  }
}

export const rpgProgressServiceLocal = {
  async getHomeGrowthProfile(todayPlan?: TodayPlanLike | null): Promise<GrowthProfile> {
    const records = await trainingServiceLocal.getAllRecords()
    return buildGrowthProfile(records, todayPlan)
  }
}

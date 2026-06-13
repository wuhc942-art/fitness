import type { TrainingPlan, WeeklySchedule } from '@/types/training-plan'

type BackupData = Record<string, any>

function getCurrentWeekNumber(weeks: WeeklySchedule[], today: string) {
  const current = weeks.find((week) => week.weekStart <= today && week.weekEnd >= today)
  if (current) return current.weekNumber
  const next = weeks.find((week) => week.weekStart > today)
  if (next) return Math.max(1, next.weekNumber - 1)
  return weeks[weeks.length - 1]?.weekNumber || 1
}

function calculateNextSession(weeks: WeeklySchedule[], currentWeek: number, today: string) {
  const upcoming = weeks
    .filter((week) => week.weekNumber >= currentWeek)
    .flatMap((week) => week.dailySchedules || [])
    .filter((day) => !day.completed && day.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  if (!upcoming) return undefined
  return {
    date: upcoming.date,
    dayOfWeek: upcoming.dayOfWeek,
    templateName: upcoming.templateName,
    templateId: upcoming.templateId
  }
}

function normalizeImportedPlan(plan: TrainingPlan, today: string, existingRecordIds?: Set<string>, existingTemplateIds?: Set<string>): TrainingPlan {
  const weeklySchedules = (plan.weeklySchedules || []).map((week) => {
    const dailySchedules = (week.dailySchedules || []).map((day) => {
      let next = day
      if (existingRecordIds && day.recordId && !existingRecordIds.has(day.recordId)) {
        next = {
          ...next,
          completed: false,
          recordId: undefined
        }
      }
      if (existingTemplateIds && day.templateId && !existingTemplateIds.has(day.templateId)) {
        next = {
          ...next,
          templateId: '',
          templateName: `${next.templateName || '训练日'}（模板已删除）`
        }
      }
      return next
    })
    return {
      ...week,
      dailySchedules,
      completedSessions: dailySchedules.filter((day) => day.completed).length,
      totalSessions: dailySchedules.length
    }
  })
  const completedSessions = weeklySchedules.reduce((sum, week) => sum + week.completedSessions, 0)
  const totalSessions = weeklySchedules.reduce((sum, week) => sum + week.totalSessions, 0)
  const currentWeek = getCurrentWeekNumber(weeklySchedules, today)
  const status = plan.status

  return {
    ...plan,
    weeklySchedules,
    progress: {
      ...plan.progress,
      currentWeek,
      completedSessions,
      totalSessions,
      completionRate: Math.round((completedSessions / Math.max(totalSessions, 1)) * 100),
      nextSession: status === 'completed' || status === 'archived'
        ? undefined
        : calculateNextSession(weeklySchedules, currentWeek, today)
    }
  }
}

export function normalizeBackupDataForImport<T extends BackupData>(data: T, today = new Date().toISOString().slice(0, 10)): T {
  if (!Array.isArray(data.fitness_training_plans)) return { ...data }
  const existingRecordIds = Array.isArray(data.fitness_training_records)
    ? new Set(data.fitness_training_records.map((record: any) => record?._id).filter(Boolean))
    : undefined
  const existingTemplateIds = Array.isArray(data.fitness_training_templates)
    ? new Set(data.fitness_training_templates.map((template: any) => template?._id).filter(Boolean))
    : undefined

  return {
    ...data,
    fitness_training_plans: data.fitness_training_plans.map((plan: TrainingPlan) => normalizeImportedPlan(plan, today, existingRecordIds, existingTemplateIds))
  }
}

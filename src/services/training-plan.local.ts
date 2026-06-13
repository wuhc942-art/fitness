import type {
  DailySchedule,
  PlanCalendarDay,
  PlanCalendarMonth,
  PlanListItem,
  TrainingPlan,
  TrainingPlanForm,
  WeeklySchedule
} from '@/types/training-plan'
import { formatDate } from '@/utils/date'
import { templateServiceLocal } from '@/services/template.local'

const STORAGE_KEY = 'fitness_training_plans'

export interface MissedPlanSession {
  planId: string
  planName: string
  weekNumber: number
  date: string
  templateId: string
  templateName: string
  dayOfWeek: number
}

function readPlans(): TrainingPlan[] {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    const plans = typeof data === 'string' ? JSON.parse(data) : data
    return Array.isArray(plans) ? plans : []
  } catch (error) {
    console.error('读取训练计划失败:', error)
    return []
  }
}

function writePlans(plans: TrainingPlan[]) {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(plans))
  } catch (error) {
    console.error('保存训练计划失败:', error)
    throw new Error('保存训练计划失败')
  }
}

function addDays(date: string, days: number): string {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return formatDate(next)
}

function getCurrentWeekNumber(weeks: WeeklySchedule[], today = formatDate(new Date())) {
  const current = weeks.find((week) => week.weekStart <= today && week.weekEnd >= today)
  if (current) return current.weekNumber
  const next = weeks.find((week) => week.weekStart > today)
  if (next) return Math.max(1, next.weekNumber - 1)
  return weeks[weeks.length - 1]?.weekNumber || 1
}

function syncScheduleStats(plan: TrainingPlan) {
  const weeklySchedules = plan.weeklySchedules || []
  weeklySchedules.forEach((week) => {
    const dailySchedules = week.dailySchedules || []
    week.completedSessions = dailySchedules.filter((day) => day.completed).length
    week.totalSessions = dailySchedules.length
  })

  const completedSessions = weeklySchedules.reduce((sum, week) => sum + week.completedSessions, 0)
  const totalSessions = weeklySchedules.reduce((sum, week) => sum + week.totalSessions, 0)
  return { completedSessions, totalSessions }
}

export const trainingPlanServiceLocal = {
  async getPlans(): Promise<PlanListItem[]> {
    return readPlans()
      .filter((plan) => plan.status !== 'archived')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((plan) => {
        const currentWeek = getCurrentWeekNumber(plan.weeklySchedules || [])
        return {
          _id: plan._id,
          name: plan.name,
          startDate: plan.startDate,
          endDate: plan.endDate,
          status: plan.status,
          progress: {
            currentWeek,
            weekDuration: plan.weekDuration,
            completionRate: plan.progress.completionRate
          },
          nextSession: this.calculateNextSession(plan.weeklySchedules || [], currentWeek),
          color: plan.color
        }
      })
  },

  async getPlanById(id: string): Promise<TrainingPlan | null> {
    return readPlans().find((plan) => plan._id === id) || null
  },

  async getActivePlan(): Promise<TrainingPlan | null> {
    const today = formatDate(new Date())
    return readPlans().find((plan) => plan.status === 'active' && plan.startDate <= today && plan.endDate >= today) || null
  },

  async getTodaySession(): Promise<{ plan: TrainingPlan; schedule: DailySchedule } | null> {
    const today = formatDate(new Date())
    for (const plan of readPlans()) {
      if (plan.status !== 'active') continue
      for (const week of plan.weeklySchedules) {
        const schedule = week.dailySchedules.find((day) => day.date === today && !day.completed)
        if (schedule) return { plan, schedule }
      }
    }
    return null
  },

  async getMissedSessions(today = formatDate(new Date())): Promise<MissedPlanSession[]> {
    const missed: MissedPlanSession[] = []
    for (const plan of readPlans()) {
      if (plan.status !== 'active') continue
      for (const week of plan.weeklySchedules || []) {
        for (const schedule of week.dailySchedules || []) {
          if (schedule.date >= today || schedule.completed) continue
          missed.push({
            planId: plan._id || '',
            planName: plan.name,
            weekNumber: week.weekNumber,
            date: schedule.date,
            templateId: schedule.templateId,
            templateName: schedule.templateName,
            dayOfWeek: schedule.dayOfWeek
          })
        }
      }
    }
    return missed.sort((a, b) => b.date.localeCompare(a.date))
  },

  async createPlan(form: TrainingPlanForm): Promise<TrainingPlan> {
    const plans = readPlans()
    const now = new Date().toISOString()
    const totalSessions = form.weeklySchedules.reduce((sum, week) => sum + week.totalSessions, 0)
    const weekDuration = form.weekDuration || form.weeklySchedules.length || 12
    const plan: TrainingPlan = {
      _id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      ...form,
      weekDuration,
      progress: {
        currentWeek: 1,
        completedSessions: 0,
        totalSessions,
        completionRate: 0,
        nextSession: this.calculateNextSession(form.weeklySchedules, 1)
      },
      status: 'active',
      createdAt: now,
      updatedAt: now
    }
    plans.push(plan)
    writePlans(plans)
    return plan
  },

  async updatePlan(id: string, updates: Partial<TrainingPlan>): Promise<TrainingPlan> {
    const plans = readPlans()
    const index = plans.findIndex((plan) => plan._id === id)
    if (index < 0) throw new Error('计划不存在')
    const next = { ...plans[index], ...updates }
    const { completedSessions, totalSessions } = syncScheduleStats(next)
    const currentWeek = getCurrentWeekNumber(next.weeklySchedules)
    next.progress = {
      ...next.progress,
      currentWeek,
      completedSessions,
      totalSessions,
      completionRate: Math.round((completedSessions / Math.max(totalSessions, 1)) * 100),
      nextSession: next.status === 'completed' || next.status === 'archived'
        ? undefined
        : this.calculateNextSession(next.weeklySchedules, currentWeek)
    }
    plans[index] = { ...next, updatedAt: new Date().toISOString() }
    writePlans(plans)
    return plans[index]
  },

  async markSessionCompleted(planId: string, weekNumber: number, date: string, recordId: string): Promise<TrainingPlan> {
    const plans = readPlans()
    const plan = plans.find((item) => item._id === planId)
    if (!plan) throw new Error('计划不存在')

    const week = plan.weeklySchedules.find((item) => item.weekNumber === weekNumber)
    if (!week) throw new Error('周次不存在')

    const schedule = week.dailySchedules.find((item) => item.date === date)
    if (!schedule) throw new Error('该日期的训练不存在')

    schedule.completed = true
    schedule.recordId = recordId

    const { completedSessions, totalSessions } = syncScheduleStats(plan)
    const currentWeek = getCurrentWeekNumber(plan.weeklySchedules)
    plan.progress = {
      ...plan.progress,
      currentWeek,
      completedSessions,
      totalSessions,
      completionRate: Math.round((completedSessions / Math.max(totalSessions, 1)) * 100),
      nextSession: this.calculateNextSession(plan.weeklySchedules, currentWeek)
    }
    if (completedSessions >= totalSessions) plan.status = 'completed'
    plan.updatedAt = new Date().toISOString()
    writePlans(plans)
    return plan
  },

  async findSessionByRecordId(recordId: string): Promise<MissedPlanSession | null> {
    if (!recordId) return null
    for (const plan of readPlans()) {
      for (const week of plan.weeklySchedules || []) {
        const schedule = (week.dailySchedules || []).find((item) => item.recordId === recordId)
        if (!schedule) continue
        return {
          planId: plan._id || '',
          planName: plan.name,
          weekNumber: week.weekNumber,
          date: schedule.date,
          templateId: schedule.templateId,
          templateName: schedule.templateName,
          dayOfWeek: schedule.dayOfWeek
        }
      }
    }
    return null
  },

  async unmarkSessionByRecordId(recordId: string): Promise<void> {
    if (!recordId) return
    const plans = readPlans()
    let changed = false

    for (const plan of plans) {
      let touchedPlan = false
      for (const week of plan.weeklySchedules || []) {
        for (const schedule of week.dailySchedules || []) {
          if (schedule.recordId !== recordId) continue
          schedule.completed = false
          schedule.recordId = undefined
          touchedPlan = true
          changed = true
        }
        if (touchedPlan) {
          week.completedSessions = week.dailySchedules.filter((item) => item.completed).length
        }
      }

      if (touchedPlan) {
        const { completedSessions, totalSessions } = syncScheduleStats(plan)
        const currentWeek = getCurrentWeekNumber(plan.weeklySchedules)
        plan.progress = {
          ...plan.progress,
          currentWeek,
          completedSessions,
          totalSessions,
          completionRate: Math.round((completedSessions / Math.max(totalSessions, 1)) * 100),
          nextSession: this.calculateNextSession(plan.weeklySchedules, currentWeek)
        }
        if (plan.status === 'completed') plan.status = 'active'
        plan.updatedAt = new Date().toISOString()
      }
    }

    if (changed) writePlans(plans)
  },

  async syncTemplateName(templateId: string, templateName: string): Promise<void> {
    if (!templateId || !templateName.trim()) return
    const plans = readPlans()
    let changed = false

    for (const plan of plans) {
      let touchedPlan = false
      for (const week of plan.weeklySchedules || []) {
        for (const schedule of week.dailySchedules || []) {
          if (schedule.templateId !== templateId || schedule.templateName === templateName) continue
          schedule.templateName = templateName
          touchedPlan = true
          changed = true
        }
      }
      if (plan.progress.nextSession?.templateId === templateId) {
        plan.progress.nextSession.templateName = templateName
        touchedPlan = true
        changed = true
      }
      if (touchedPlan) plan.updatedAt = new Date().toISOString()
    }

    if (changed) writePlans(plans)
  },

  async detachTemplate(templateId: string): Promise<number> {
    if (!templateId) return 0
    const plans = readPlans()
    let affected = 0

    for (const plan of plans) {
      let touchedPlan = false
      for (const week of plan.weeklySchedules || []) {
        for (const schedule of week.dailySchedules || []) {
          if (schedule.templateId !== templateId) continue
          schedule.templateId = ''
          schedule.templateName = `${schedule.templateName || '训练日'}（模板已删除）`
          touchedPlan = true
          affected += 1
        }
      }
      if (plan.progress.nextSession?.templateId === templateId) {
        plan.progress.nextSession = this.calculateNextSession(plan.weeklySchedules, plan.progress.currentWeek || 1)
        touchedPlan = true
      }
      if (touchedPlan) plan.updatedAt = new Date().toISOString()
    }

    if (affected) writePlans(plans)
    return affected
  },

  async getCalendar(year: number, month: number): Promise<PlanCalendarMonth> {
    const plans = readPlans()
    const today = formatDate(new Date())
    const firstDay = new Date(year, month - 1, 1)
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDayOfWeek = firstDay.getDay() || 7
    const days: PlanCalendarDay[] = []

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month - 1, day)
      const dateStr = formatDate(date)
      let scheduled: DailySchedule | undefined
      let planId: string | undefined
      let planName: string | undefined
      let weekNumber: number | undefined

      for (const plan of plans) {
        if (plan.status === 'archived') continue
        for (const week of plan.weeklySchedules) {
          scheduled = week.dailySchedules.find((item) => item.date === dateStr)
          if (scheduled) {
            planId = plan._id
            planName = plan.name
            weekNumber = week.weekNumber
            break
          }
        }
        if (scheduled) break
      }

      days.push({
        date: dateStr,
        dayOfMonth: day,
        dayOfWeek: date.getDay() || 7,
        hasTraining: !!scheduled,
        isCompleted: !!scheduled?.completed,
        isToday: dateStr === today,
        scheduled,
        planId,
        planName,
        weekNumber
      })
    }

    const weekStarts: string[] = []
    for (let day = Math.max(1, 1 - (firstDayOfWeek === 7 ? 0 : firstDayOfWeek - 1)); day <= daysInMonth; day += 7) {
      weekStarts.push(formatDate(new Date(year, month - 1, day)))
    }

    return { year, month, days, weekStarts }
  },

  async deletePlan(id: string): Promise<void> {
    const plans = readPlans()
    const next = plans.filter((plan) => plan._id !== id)
    if (next.length === plans.length) throw new Error('计划不存在')
    writePlans(next)
  },

  async togglePlanStatus(id: string): Promise<TrainingPlan> {
    const plans = readPlans()
    const plan = plans.find((item) => item._id === id)
    if (!plan) throw new Error('计划不存在')
    plan.status = plan.status === 'active' ? 'paused' : 'active'
    plan.updatedAt = new Date().toISOString()
    writePlans(plans)
    return plan
  },

  async duplicatePlan(id: string, newStartDate?: string): Promise<TrainingPlan> {
    const plan = await this.getPlanById(id)
    if (!plan) throw new Error('计划不存在')
    const startDate = newStartDate || addDays(plan.startDate, plan.weekDuration * 7)
    const endDate = addDays(startDate, plan.weekDuration * 7 - 1)
    const weeklySchedules = plan.weeklySchedules.map((week, index) => {
      const weekStart = addDays(startDate, index * 7)
      const weekEnd = addDays(weekStart, 6)
      return {
        ...week,
        weekNumber: index + 1,
        weekStart,
        weekEnd,
        completedSessions: 0,
        dailySchedules: week.dailySchedules.map((day) => ({
          ...day,
          date: addDays(weekStart, day.dayOfWeek - 1),
          completed: false,
          recordId: undefined
        }))
      }
    })
    return this.createPlan({
      name: `${plan.name} (副本)`,
      description: plan.description,
      startDate,
      endDate,
      weekDuration: plan.weekDuration,
      weeklyFrequency: plan.weeklyFrequency,
      weeklySchedules,
      progressiveRule: plan.progressiveRule,
      isTemplate: plan.isTemplate,
      color: plan.color,
      tags: plan.tags
    })
  },

  calculateNextSession(weeks: WeeklySchedule[], currentWeek: number) {
    const today = formatDate(new Date())
    const upcoming = weeks
      .filter((week) => week.weekNumber >= currentWeek)
      .flatMap((week) => week.dailySchedules)
      .filter((day) => !day.completed && day.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0]
    if (upcoming) {
      return {
        date: upcoming.date,
        dayOfWeek: upcoming.dayOfWeek,
        templateName: upcoming.templateName,
        templateId: upcoming.templateId
      }
    }
    return undefined
  },

  async buildWeeklyScheduleWithTemplateNames(startDate: string, weeklyFrequency: number, templateIds: string[]): Promise<WeeklySchedule[]> {
    const templates = await templateServiceLocal.getTemplates()
    const templateNames = templates.reduce<Record<string, string>>((map, template) => {
      if (template._id) map[template._id] = template.name
      return map
    }, {})
    return this.buildWeeklySchedule(startDate, weeklyFrequency, templateIds, templateNames)
  },

  buildWeeklySchedule(startDate: string, weeklyFrequency: number, templateIds: string[], templateNames: Record<string, string> = {}): WeeklySchedule[] {
    const weeks: WeeklySchedule[] = []
    let weekStart = addDays(startDate, -((new Date(startDate).getDay() || 7) - 1))
    for (let weekNumber = 1; weekNumber <= 12; weekNumber += 1) {
      const offsets = this.distributeTrainingDays(weekNumber, weeklyFrequency)
      const dailySchedules = offsets.map((offset, index) => {
        const date = addDays(weekStart, offset)
        const templateId = templateIds[index % templateIds.length]
        return {
          dayOfWeek: new Date(date).getDay() || 7,
          date,
          templateId,
          templateName: templateNames[templateId] || `训练日 ${index + 1}`,
          completed: false
        }
      })
      weeks.push({
        weekNumber,
        weekStart,
        weekEnd: addDays(weekStart, 6),
        dailySchedules,
        completedSessions: 0,
        totalSessions: dailySchedules.length
      })
      weekStart = addDays(weekStart, 7)
    }
    return weeks
  },

  distributeTrainingDays(weekNum: number, frequency: number): number[] {
    if (frequency === 2) return [0, 3]
    if (frequency === 3) return [0, 2, 4]
    if (frequency === 4) return weekNum % 2 === 1 ? [0, 2, 4, 6] : [1, 3, 5, 6]
    if (frequency >= 5) return [0, 1, 2, 3, 4, 5, 6].slice(0, frequency)
    return [0]
  }
}

export type PlanStatus = 'active' | 'paused' | 'completed' | 'archived'

export interface DailySchedule {
  dayOfWeek: number
  date: string
  templateId: string
  templateName: string
  completed: boolean
  recordId?: string
  notes?: string
  scheduledSets?: number
  scheduledReps?: number
  scheduledWeight?: number
}

export interface WeeklySchedule {
  weekNumber: number
  weekStart: string
  weekEnd: string
  dailySchedules: DailySchedule[]
  completedSessions: number
  totalSessions: number
  isDeload?: boolean
}

export interface PlanProgress {
  currentWeek: number
  completedSessions: number
  totalSessions: number
  completionRate: number
  nextSession?: {
    date: string
    dayOfWeek: number
    templateName: string
    templateId: string
  }
  lastSession?: {
    date: string
    templateName: string
    completed: boolean
  }
}

export interface ProgressiveRule {
  enabled: boolean
  type: 'weight' | 'reps' | 'sets'
  increment: number
  frequency: number
}

export interface TrainingPlan {
  _id?: string
  name: string
  description?: string
  startDate: string
  endDate: string
  weekDuration: number
  weeklyFrequency: number
  weeklySchedules: WeeklySchedule[]
  progress: PlanProgress
  progressiveRule?: ProgressiveRule
  status: PlanStatus
  isTemplate?: boolean
  color?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface TrainingPlanForm {
  name: string
  description?: string
  startDate: string
  endDate: string
  weekDuration?: number
  weeklyFrequency: number
  weeklySchedules: WeeklySchedule[]
  progressiveRule?: ProgressiveRule
  isTemplate?: boolean
  color?: string
  tags?: string[]
}

export interface PlanListItem {
  _id?: string
  name: string
  startDate: string
  endDate: string
  status: PlanStatus
  progress: {
    currentWeek: number
    weekDuration: number
    completionRate: number
  }
  nextSession?: {
    date: string
    templateName: string
    templateId?: string
    dayOfWeek?: number
  }
  color?: string
}

export interface PlanCalendarDay {
  date: string
  dayOfMonth: number
  dayOfWeek: number
  hasTraining: boolean
  isCompleted: boolean
  isToday: boolean
  scheduled?: DailySchedule
  planId?: string
  planName?: string
  weekNumber?: number
}

export interface PlanCalendarMonth {
  year: number
  month: number
  days: PlanCalendarDay[]
  weekStarts: string[]
}

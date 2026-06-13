import type { DailySchedule, WeeklySchedule, TrainingPlan } from '@/types/training-plan'
import type { TrainingTemplate } from '@/types/template'
import { templateServiceLocal } from '@/services/template.local'
import { trainingPlanServiceLocal } from '@/services/training-plan.local'
import { formatDate } from '@/utils/date'

export type PlanGoal = 'muscle' | 'fatLoss' | 'shape' | 'strength'
export type PlanPlace = 'gym' | 'home'
export type PlanLevel = 'beginner' | 'intermediate' | 'advanced'

export interface AiPlanForm {
  goal: PlanGoal
  place: PlanPlace
  level: PlanLevel
  weeklyDays: number
  duration: number
  startDate: string
  weeks: number
}

export interface AiPlanDay {
  name: string
  focus: string
  actions: string[]
  advice: string
}

export interface AiPlanPreview {
  name: string
  description: string
  days: AiPlanDay[]
}

const goalLabels: Record<PlanGoal, string> = {
  muscle: '增肌',
  fatLoss: '减脂',
  shape: '塑形',
  strength: '力量提升'
}

const gymSplits: Record<number, AiPlanDay[]> = {
  1: [
    { name: '全身力量', focus: '全身', actions: ['深蹲', '卧推', '高位下拉', '哑铃推举', '平板支撑'], advice: '动作不求多，优先保证动作质量。' }
  ],
  2: [
    { name: '上肢训练', focus: '胸背肩手臂', actions: ['卧推', '高位下拉', '坐姿划船', '哑铃推举', '绳索下压'], advice: '上肢训练日注意肩胛控制，避免耸肩代偿。' },
    { name: '下肢核心', focus: '腿臀核心', actions: ['深蹲', '腿举', '罗马尼亚硬拉', '臀桥', '卷腹'], advice: '下肢训练后至少留一天恢复。' }
  ],
  3: [
    { name: '推力日', focus: '胸肩三头', actions: ['卧推', '上斜卧推', '坐姿推举', '侧平举', '绳索下压'], advice: '推力日重点看卧推和推举的重量变化。' },
    { name: '拉力日', focus: '背二头', actions: ['引体向上', '高位下拉', '坐姿划船', '面拉', '杠铃弯举'], advice: '每组先收紧背部，再启动手臂。' },
    { name: '腿臀核心', focus: '腿臀核心', actions: ['深蹲', '腿举', '罗马尼亚硬拉', '腿弯举', '平板支撑'], advice: '腿部动作优先稳定深度和发力路径。' }
  ],
  4: [
    { name: '胸三头', focus: '胸三头', actions: ['卧推', '上斜卧推', '蝴蝶机夹胸', '双杠臂屈伸', '绳索下压'], advice: '胸部动作之间保留足够休息，避免越练越轻。' },
    { name: '背二头', focus: '背二头', actions: ['引体向上', '高位下拉', '坐姿划船', '直臂下压', '杠铃弯举'], advice: '背部训练注意顶峰收缩。' },
    { name: '腿臀', focus: '腿臀', actions: ['深蹲', '腿举', '罗马尼亚硬拉', '保加利亚分腿蹲', '提踵'], advice: '腿臀日训练量较高，第二天建议轻活动。' },
    { name: '肩核心', focus: '肩核心', actions: ['坐姿推举', '侧平举', '俯身飞鸟', '面拉', '卷腹'], advice: '肩部训练不要只练前束，侧束后束也要覆盖。' }
  ]
}

const homeBase: AiPlanDay[] = [
  { name: '居家全身 A', focus: '全身', actions: ['俯卧撑', '深蹲', '弓步蹲', '平板支撑', '卷腹'], advice: '用慢速离心增加刺激，不需要追求次数很快。' },
  { name: '居家上肢', focus: '上肢核心', actions: ['俯卧撑', '窄距俯卧撑', '哑铃划船', '侧平举', '平板支撑'], advice: '如果没有哑铃，可用弹力带或装水背包替代。' },
  { name: '居家下肢', focus: '腿臀', actions: ['深蹲', '臀桥', '保加利亚分腿蹲', '提踵', '死虫'], advice: '单腿动作能弥补居家重量不足。' },
  { name: '燃脂循环', focus: '有氧塑形', actions: ['开合跳', '波比跳', '登山跑', '深蹲跳', '平板支撑'], advice: '循环训练控制心率，动作变形就降低速度。' }
]

function addDays(date: string, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return formatDate(next)
}

function getMonday(date: string) {
  const d = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - (day - 1))
  return formatDate(d)
}

function chooseWeekdays(days: number) {
  if (days <= 1) return [1]
  if (days === 2) return [1, 4]
  if (days === 3) return [1, 3, 5]
  if (days === 4) return [1, 2, 4, 6]
  if (days === 5) return [1, 2, 3, 5, 6]
  if (days === 6) return [1, 2, 3, 4, 5, 6]
  return [1, 2, 3, 4, 5, 6, 7]
}

function buildDays(form: AiPlanForm): AiPlanDay[] {
  const days = Math.max(1, Math.min(7, form.weeklyDays))
  if (form.place === 'home') return Array.from({ length: days }).map((_, index) => homeBase[index % homeBase.length])

  const gymKey = Math.min(4, Math.max(1, days))
  const base = gymSplits[gymKey]
  if (days <= 4) return base

  const cardio: AiPlanDay = {
    name: form.goal === 'fatLoss' ? '有氧燃脂' : '恢复有氧',
    focus: '有氧',
    actions: ['椭圆机', '跑步机慢跑', '动感单车', '拉伸'],
    advice: form.goal === 'fatLoss' ? '保持中等强度 30-45 分钟。' : '作为恢复训练，不要做到力竭。'
  }
  return Array.from({ length: days }).map((_, index) => (index < base.length ? base[index] : cardio))
}

function adjustForGoal(day: AiPlanDay, form: AiPlanForm): AiPlanDay {
  const suffix = form.goal === 'strength'
    ? '主项建议 4-6 次，辅助动作 8-12 次。'
    : form.goal === 'fatLoss'
      ? '组间休息控制在 60-90 秒，训练后可加 15 分钟有氧。'
      : form.goal === 'muscle'
        ? '多数动作保持 8-12 次，逐步增加重量。'
        : '动作节奏放慢，优先控制和肌肉感受。'
  const levelTip = form.level === 'beginner'
    ? '新手阶段先保留 1-2 次余力。'
    : form.level === 'advanced'
      ? '高级训练者可加入递增组或顶组。'
      : '中级阶段可以记录每个动作的最佳组。'
  return { ...day, advice: `${day.advice}${suffix}${levelTip}` }
}

export const aiPlanServiceLocal = {
  generatePreview(form: AiPlanForm): AiPlanPreview {
    const days = buildDays(form).map((day) => adjustForGoal(day, form))
    return {
      name: `AI${goalLabels[form.goal]}计划`,
      description: `${goalLabels[form.goal]} · ${form.place === 'gym' ? '健身房' : '居家'} · 每周${form.weeklyDays}练 · 每次约${form.duration}分钟`,
      days
    }
  },

  async createPlanFromPreview(form: AiPlanForm, preview: AiPlanPreview): Promise<TrainingPlan> {
    const templates: Array<TrainingTemplate & { day: AiPlanDay }> = []
    for (const day of preview.days) {
      const template = await templateServiceLocal.createTemplate({
        name: day.name,
        actions: day.actions
      })
      templates.push({ ...template, day })
    }

    const weekStart = getMonday(form.startDate)
    const weekdays = chooseWeekdays(form.weeklyDays)
    const weeklySchedules: WeeklySchedule[] = []
    for (let weekNumber = 1; weekNumber <= form.weeks; weekNumber += 1) {
      const start = addDays(weekStart, (weekNumber - 1) * 7)
      const dailySchedules: DailySchedule[] = weekdays.map((dayOfWeek, index) => {
        const template = templates[index % templates.length]
        return {
          dayOfWeek,
          date: addDays(start, dayOfWeek - 1),
          templateId: template._id || '',
          templateName: template.name,
          completed: false,
          notes: template.day.advice
        }
      })
      weeklySchedules.push({
        weekNumber,
        weekStart: start,
        weekEnd: addDays(start, 6),
        dailySchedules,
        completedSessions: 0,
        totalSessions: dailySchedules.length
      })
    }

    return trainingPlanServiceLocal.createPlan({
      name: preview.name,
      description: preview.description,
      startDate: form.startDate,
      endDate: weeklySchedules[weeklySchedules.length - 1].weekEnd,
      weekDuration: form.weeks,
      weeklyFrequency: form.weeklyDays,
      weeklySchedules,
      color: '#101820',
      tags: ['AI计划', goalLabels[form.goal]]
    })
  }
}

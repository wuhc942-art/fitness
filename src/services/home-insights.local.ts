import type { BodyPart, TrainingRecord } from '@/types/training'
import { trainingServiceLocal } from '@/services/training.local'
import { trainingPlanServiceLocal } from '@/services/training-plan.local'
import { formatDate, getWeekDates } from '@/utils/date'

export type InsightTone = 'focus' | 'good' | 'warn' | 'info'

export interface HomeInsight {
  title: string
  content: string
  tone: InsightTone
  actionText?: string
  actionUrl?: string
}

const bodyPartLabels: Record<BodyPart, string> = {
  chest: '胸',
  back: '背',
  legs: '腿',
  shoulders: '肩',
  arms: '手臂',
  core: '核心',
  cardio: '有氧',
  full: '全身'
}

function daysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return formatDate(date)
}

function latestRecord(records: TrainingRecord[]) {
  return [...records].sort((a, b) => b.date.localeCompare(a.date))[0]
}

function countByBodyPart(records: TrainingRecord[]) {
  return records.reduce<Record<string, number>>((map, record) => {
    map[record.bodyPart] = (map[record.bodyPart] || 0) + 1
    return map
  }, {})
}

function findRecentPr(records: TrainingRecord[]) {
  const recentStart = daysAgo(30)
  const previousStart = daysAgo(60)
  const recentBest = new Map<string, number>()
  const previousBest = new Map<string, number>()

  records.forEach((record) => {
    record.actions.forEach((action) => {
      const bestWeight = Number(action.weight) || 0
      if (!bestWeight) return
      if (record.date >= recentStart) {
        recentBest.set(action.name, Math.max(recentBest.get(action.name) || 0, bestWeight))
      } else if (record.date >= previousStart) {
        previousBest.set(action.name, Math.max(previousBest.get(action.name) || 0, bestWeight))
      }
    })
  })

  let best: { name: string; increase: number; weight: number } | null = null
  for (const [name, weight] of recentBest.entries()) {
    const previous = previousBest.get(name) || 0
    if (!previous || weight <= previous) continue
    const increase = Math.round(((weight - previous) / previous) * 100)
    if (!best || increase > best.increase) best = { name, increase, weight }
  }
  return best
}

export const homeInsightsServiceLocal = {
  async getTodayInsights(): Promise<HomeInsight[]> {
    const today = formatDate(new Date())
    const weekDates = getWeekDates()
    const records = await trainingServiceLocal.getAllRecords()
    const plans = await trainingPlanServiceLocal.getPlans()
    const missed = await trainingPlanServiceLocal.getMissedSessions(today)
    const insights: HomeInsight[] = []

    const trainedToday = records.some((record) => record.date === today)
    const weeklyCount = records.filter((record) => weekDates.includes(record.date)).length
    const activePlan = plans.find((plan) => plan.status === 'active')
    const weeklyTarget = activePlan?.nextSession ? Math.max(3, weeklyCount) : 3

    if (missed.length) {
      insights.push({
        title: '有训练待补记',
        content: `你有 ${missed.length} 次计划训练还没记录，建议先补最近一次。`,
        tone: 'warn',
        actionText: '去处理',
        actionUrl: '/pages/reminders/reminders'
      })
    } else if (!trainedToday && activePlan?.nextSession?.date === today && activePlan.nextSession.templateId) {
      insights.push({
        title: '今天有计划训练',
        content: `今天安排了「${activePlan.nextSession.templateName}」，完成后计划进度会自动更新。`,
        tone: 'focus',
        actionText: '开始训练',
        actionUrl: '/pages/training-record/training-record'
      })
    } else if (!trainedToday && activePlan?.nextSession?.date === today && !activePlan.nextSession.templateId) {
      insights.push({
        title: '计划需要补模板',
        content: '今天的训练日没有可用模板，建议先到计划里重新安排动作，再开始记录。',
        tone: 'warn',
        actionText: '去计划',
        actionUrl: '/pages/plans/plans'
      })
    } else if (trainedToday) {
      insights.push({
        title: '今天已经训练',
        content: '今天的训练已记录，可以补充身体数据或查看进步趋势。',
        tone: 'good',
        actionText: '看图表',
        actionUrl: '/pages/charts/charts'
      })
    }

    if (weeklyCount < weeklyTarget) {
      insights.push({
        title: '本周训练频率',
        content: `本周已训练 ${weeklyCount} 次，建议至少完成 ${weeklyTarget} 次来保持节奏。`,
        tone: weeklyCount === 0 ? 'warn' : 'info',
        actionText: '去记录',
        actionUrl: '/pages/training-record/training-record'
      })
    } else {
      insights.push({
        title: '本周节奏不错',
        content: `本周已训练 ${weeklyCount} 次，保持当前安排即可。`,
        tone: 'good'
      })
    }

    const recentRecords = records.filter((record) => record.date >= daysAgo(14))
    const distribution = countByBodyPart(recentRecords)
    const mainParts: BodyPart[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']
    const leastPart = mainParts.sort((a, b) => (distribution[a] || 0) - (distribution[b] || 0))[0]
    if (recentRecords.length >= 3 && (distribution[leastPart] || 0) === 0) {
      insights.push({
        title: '部位安排提醒',
        content: `最近两周几乎没有练到${bodyPartLabels[leastPart]}，下次可以补一次。`,
        tone: 'info',
        actionText: '建计划',
        actionUrl: '/pages/plans/plans'
      })
    }

    const pr = findRecentPr(records)
    if (pr) {
      insights.push({
        title: '力量进步明显',
        content: `${pr.name} 最近最好重量达到 ${pr.weight}kg，比上阶段提升约 ${pr.increase}%。`,
        tone: 'good',
        actionText: '看历史',
        actionUrl: '/pages/history-query/history-query'
      })
    }

    const last = latestRecord(records)
    if (!last) {
      insights.push({
        title: '先完成第一条记录',
        content: '记录一次真实训练后，首页会开始给你生成频率、部位和进步建议。',
        tone: 'focus',
        actionText: '开始记录',
        actionUrl: '/pages/training-record/training-record'
      })
    }

    return insights.slice(0, 4)
  }
}

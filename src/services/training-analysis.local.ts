import type { BodyPart, TrainingRecord } from '@/types/training'
import { trainingServiceLocal } from '@/services/training.local'
import { formatDate } from '@/utils/date'

export type AnalysisTone = 'good' | 'warn' | 'info'

export interface AnalysisCard {
  title: string
  value: string
  desc: string
  tone: AnalysisTone
}

export interface TrainingAnalysis {
  cards: AnalysisCard[]
  bodyPartRows: { label: string; count: number; percent: number }[]
  progressRows: { name: string; previous: number; current: number; increase: number }[]
  suggestions: string[]
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

function bestWeights(records: TrainingRecord[]) {
  const map = new Map<string, number>()
  records.forEach((record) => {
    record.actions.forEach((action) => {
      const weight = Number(action.weight) || 0
      if (!weight) return
      map.set(action.name, Math.max(map.get(action.name) || 0, weight))
    })
  })
  return map
}

export const trainingAnalysisServiceLocal = {
  async getAnalysis(): Promise<TrainingAnalysis> {
    const all = await trainingServiceLocal.queryHistory({
      startDate: '2020-01-01',
      endDate: formatDate(new Date())
    })
    const recentStart = daysAgo(30)
    const previousStart = daysAgo(60)
    const recent = all.filter((record) => record.date >= recentStart)
    const previous = all.filter((record) => record.date >= previousStart && record.date < recentStart)

    if (!all.length) {
      return {
        cards: [
          { title: '训练分析', value: '暂无', desc: '完成一次训练后，这里会生成频率、部位和力量分析。', tone: 'info' }
        ],
        bodyPartRows: [],
        progressRows: [],
        suggestions: ['先记录一次真实训练，后续分析会自动更新。']
      }
    }

    const totalVolume = recent.reduce((sum, record) => sum + (record.totalVolume || 0), 0)
    const avgVolume = recent.length ? Math.round(totalVolume / recent.length) : 0
    const weeklyFrequency = Math.round((recent.length / 30) * 7 * 10) / 10

    const bodyPartCount = recent.reduce<Record<string, number>>((map, record) => {
      map[record.bodyPart] = (map[record.bodyPart] || 0) + 1
      return map
    }, {})
    const bodyPartRows = (Object.entries(bodyPartLabels) as [BodyPart, string][])
      .map(([key, label]) => {
        const count = bodyPartCount[key] || 0
        return {
          label,
          count,
          percent: recent.length ? Math.round((count / recent.length) * 100) : 0
        }
      })
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count)

    const recentBest = bestWeights(recent)
    const previousBest = bestWeights(previous)
    const progressRows = Array.from(recentBest.entries())
      .map(([name, current]) => {
        const previous = previousBest.get(name) || 0
        const increase = previous && current > previous ? Math.round(((current - previous) / previous) * 100) : 0
        return { name, previous, current, increase }
      })
      .filter((row) => row.increase > 0)
      .sort((a, b) => b.increase - a.increase)
      .slice(0, 5)

    const leastPart = (['chest', 'back', 'legs', 'shoulders', 'arms', 'core'] as BodyPart[])
      .map((part) => ({ part, count: bodyPartCount[part] || 0 }))
      .sort((a, b) => a.count - b.count)[0]
    const maxPart = bodyPartRows[0]
    const suggestions: string[] = []

    if (weeklyFrequency < 2) suggestions.push('最近 30 天训练频率偏低，建议先稳定到每周 2-3 次。')
    else if (weeklyFrequency >= 4) suggestions.push('训练频率不错，注意安排恢复日，避免连续高强度堆叠。')
    else suggestions.push('训练频率处于可持续区间，适合继续保持。')

    if (leastPart && leastPart.count === 0) suggestions.push(`最近 30 天没有明显练到${bodyPartLabels[leastPart.part]}，下周可以补一次。`)
    if (maxPart && maxPart.percent >= 45) suggestions.push(`${maxPart.label}训练占比偏高，可以增加其他部位让安排更均衡。`)
    if (progressRows.length) suggestions.push(`${progressRows[0].name}进步最明显，建议在动作稳定的前提下小幅递增重量。`)
    if (avgVolume > 0) suggestions.push(`近 30 天平均训练量约 ${avgVolume}kg，可以用它作为下次训练的参考底线。`)

    return {
      cards: [
        {
          title: '近30天频率',
          value: `${weeklyFrequency}次/周`,
          desc: recent.length >= 8 ? '训练节奏较稳定' : '还有提升空间',
          tone: weeklyFrequency >= 2 ? 'good' : 'warn'
        },
        {
          title: '平均训练量',
          value: `${avgVolume}kg`,
          desc: '按最近记录估算',
          tone: avgVolume > 0 ? 'info' : 'warn'
        },
        {
          title: '进步动作',
          value: `${progressRows.length}`,
          desc: progressRows.length ? '有动作超过上阶段' : '暂未发现明显突破',
          tone: progressRows.length ? 'good' : 'info'
        }
      ],
      bodyPartRows,
      progressRows,
      suggestions
    }
  }
}

import type { HeatMapData } from '@/types'
import type { PRRecord, TrainingRecord } from '@/types/training'
import { calculateContinuousDays, getMonth, getWeekDates } from '@/utils/date'
import { calculateBestSet } from '@/utils/calculator'
import { trainingServiceLocal } from './training.local'

export const statisticsServiceLocal = {
  async getHomeStatistics(): Promise<{
    continuousDays: number
    monthCount: number
    totalDuration: number
    prRecords: PRRecord[]
    heatMapData: HeatMapData
  }> {
    const records = await trainingServiceLocal.queryHistory({
      startDate: '2020-01-01',
      endDate: new Date().toISOString().split('T')[0]
    })
    const dates = records.map((record) => record.date).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    const currentMonth = getMonth()

    return {
      continuousDays: calculateContinuousDays(dates),
      monthCount: records.filter((record) => record.date.startsWith(currentMonth)).length,
      totalDuration: records.reduce((sum, record) => sum + (Number(record.duration) || 0), 0),
      prRecords: this.calculatePRRecords(records),
      heatMapData: await this.getWeekHeatMapData(records)
    }
  },

  calculatePRRecords(records: TrainingRecord[]): PRRecord[] {
    const prMap = new Map<string, { weight: number; date: string; max1RM: number }>()

    records.forEach((record) => {
      record.actions.forEach((action) => {
        const best = calculateBestSet(action)
        const existing = prMap.get(action.name)
        if (!existing || best.weight > existing.weight) {
          prMap.set(action.name, {
            weight: best.weight,
            date: record.date,
            max1RM: best.estimated1RM
          })
        }
      })
    })

    return Array.from(prMap.entries()).map(([actionName, item]) => ({
      actionName,
      maxWeight: item.weight,
      max1RM: item.max1RM,
      date: item.date
    }))
  },

  async getWeekHeatMapData(records: TrainingRecord[]): Promise<HeatMapData> {
    const weekDates = getWeekDates()
    const trainedDates = new Set(records.map((record) => record.date))

    return {
      weekStart: weekDates[0],
      days: weekDates.map((date, index) => ({
        date,
        hasTraining: trainedDates.has(date),
        dayIndex: index,
        dayLabel: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][index]
      }))
    }
  }
}

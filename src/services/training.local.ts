import type { ActionRecord, PRRecord, TrainingRecord, TrainingRecordForm } from '@/types/training'
import type { HistoryQueryParams } from '@/types'
import { BODY_PART_OPTIONS, EQUIPMENT_OPTIONS, EXERCISE_LIBRARY } from '@/services/exercise-library.local'
import { calculateBestSet } from '@/utils/calculator'

const STORAGE_KEY = 'fitness_training_records'
const BODY_PART_LABEL_MAP = new Map(BODY_PART_OPTIONS.map((item) => [item.value, item.label]))
const EQUIPMENT_LABEL_MAP = new Map(EQUIPMENT_OPTIONS.map((item) => [item.value, item.label]))
const ACTION_SEARCH_TEXT_MAP = new Map(
  EXERCISE_LIBRARY.flatMap((item) => {
    const searchText = [
      item.name,
      BODY_PART_LABEL_MAP.get(item.bodyPart) || '',
      EQUIPMENT_LABEL_MAP.get(item.equipment) || '',
      ...(item.aliases || []),
      ...item.primaryMuscles,
      ...item.secondaryMuscles
    ].join(' ')

    return [item.name, ...(item.aliases || [])].map((name) => [name.trim().toLowerCase(), searchText] as const)
  })
)

function readRecords(): TrainingRecord[] {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    const records = typeof data === 'string' ? JSON.parse(data) : data
    return Array.isArray(records) ? records : []
  } catch (error) {
    console.error('读取本地训练记录失败:', error)
    return []
  }
}

function writeRecords(records: TrainingRecord[]): void {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(records))
  } catch (error) {
    console.error('保存本地训练记录失败:', error)
  }
}

function normalizeAction(action: ActionRecord): ActionRecord {
  const setsDetail = action.setsDetail?.length
    ? action.setsDetail.map((set, index) => ({
        setNumber: index + 1,
        weight: Number(set.weight) || 0,
        reps: Number(set.reps) || 0,
        rpe: set.rpe
      }))
    : Array.from({ length: Number(action.sets) || 0 }).map((_, index) => ({
        setNumber: index + 1,
        weight: Number(action.weight) || 0,
        reps: Number(action.reps) || 0
      }))

  const best = calculateBestSet({ ...action, sets: setsDetail.length, setsDetail })
  const volume = setsDetail.reduce((sum, set) => sum + set.weight * set.reps, 0)

  return {
    ...action,
    name: action.name.trim(),
    weight: best.weight,
    reps: best.reps,
    sets: setsDetail.length,
    setsDetail,
    volume,
    estimated1RM: best.estimated1RM
  }
}

function getActionSearchText(action: ActionRecord): string {
  const exactName = action.name.trim().toLowerCase()
  const librarySearchText = ACTION_SEARCH_TEXT_MAP.get(exactName)
  return librarySearchText ? `${action.name} ${librarySearchText}` : action.name
}

export const trainingServiceLocal = {
  async saveRecord(form: TrainingRecordForm): Promise<TrainingRecord> {
    const now = new Date().toISOString()
    const actions = form.actions.map(normalizeAction)
    const totalVolume = actions.reduce((sum, action) => sum + (action.volume || 0), 0)

    const record: TrainingRecord = {
      _id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      _openid: 'local_user',
      date: form.date,
      bodyPart: form.bodyPart,
      duration: Number(form.duration) || 0,
      location: form.location,
      feeling: form.feeling || '',
      actions,
      totalVolume,
      createdAt: now,
      updatedAt: now
    }

    const records = readRecords()
    records.unshift(record)
    writeRecords(records)
    return record
  },

  async queryHistory(params?: HistoryQueryParams): Promise<TrainingRecord[]> {
    let records = readRecords()

    if (params?.startDate && params?.endDate) {
      records = records.filter((record) => record.date >= params.startDate! && record.date <= params.endDate!)
    }

    if (params?.bodyPart) {
      records = records.filter((record) => record.bodyPart === params.bodyPart)
    }

    if (params?.actionName) {
      const keyword = params.actionName.toLowerCase()
      records = records.filter((record) => record.actions.some((action) => getActionSearchText(action).toLowerCase().includes(keyword)))
    }

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  async getAllRecords(): Promise<TrainingRecord[]> {
    return readRecords()
  },

  async getRecordById(id: string): Promise<TrainingRecord | null> {
    return readRecords().find((record) => record._id === id) || null
  },

  async updateRecord(id: string, form: TrainingRecordForm): Promise<TrainingRecord> {
    const records = readRecords()
    const index = records.findIndex((record) => record._id === id)
    if (index < 0) throw new Error('训练记录不存在')

    const actions = form.actions.map(normalizeAction)
    const totalVolume = actions.reduce((sum, action) => sum + (action.volume || 0), 0)
    const updated: TrainingRecord = {
      ...records[index],
      date: form.date,
      bodyPart: form.bodyPart,
      duration: Number(form.duration) || 0,
      location: form.location,
      feeling: form.feeling || '',
      actions,
      totalVolume,
      updatedAt: new Date().toISOString()
    }

    records[index] = updated
    writeRecords(records)
    return updated
  },

  async deleteRecord(id: string): Promise<void> {
    writeRecords(readRecords().filter((record) => record._id !== id))
  },

  async getPRRecords(): Promise<PRRecord[]> {
    const prMap = new Map<string, { weight: number; date: string; max1RM: number }>()

    readRecords().forEach((record) => {
      record.actions.map(normalizeAction).forEach((action) => {
        const existing = prMap.get(action.name)
        if (!existing || action.weight > existing.weight) {
          prMap.set(action.name, {
            weight: action.weight,
            date: record.date,
            max1RM: action.estimated1RM || 0
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
  }
}

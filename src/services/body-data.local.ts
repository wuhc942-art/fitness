import type { BodyDataForm, BodyDataRecord } from '@/types/body-data'

const STORAGE_KEY = 'fitness_body_data_records'

function readRecords(): BodyDataRecord[] {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    const records = typeof data === 'string' ? JSON.parse(data) : data
    return Array.isArray(records) ? records : []
  } catch (error) {
    console.error('读取身体数据失败:', error)
    return []
  }
}

function writeRecords(records: BodyDataRecord[]): void {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(records))
  } catch (error) {
    console.error('保存身体数据失败:', error)
  }
}

export const bodyDataServiceLocal = {
  async saveRecord(form: BodyDataForm): Promise<BodyDataRecord> {
    const records = readRecords()
    const now = new Date().toISOString()
    const existingIndex = records.findIndex((record) => record.date === form.date)
    const record: BodyDataRecord = {
      ...(existingIndex >= 0 ? records[existingIndex] : {}),
      _id: existingIndex >= 0 ? records[existingIndex]._id : `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      _openid: 'local_user',
      date: form.date,
      height: Number(form.height) || 0,
      weight: Number(form.weight) || 0,
      bodyFat: form.bodyFat,
      waist: form.waist,
      chest: form.chest,
      hip: form.hip,
      arm: form.arm,
      sleep: form.sleep,
      water: form.water,
      createdAt: existingIndex >= 0 ? records[existingIndex].createdAt : now,
      updatedAt: now
    }

    if (existingIndex >= 0) records[existingIndex] = record
    else records.unshift(record)
    writeRecords(records.sort((a, b) => b.date.localeCompare(a.date)))
    return record
  },

  async getRecords(): Promise<BodyDataRecord[]> {
    return readRecords().sort((a, b) => b.date.localeCompare(a.date))
  },

  async getLatestRecord(): Promise<BodyDataRecord | null> {
    const records = await this.getRecords()
    return records[0] || null
  },

  async deleteRecord(id: string): Promise<void> {
    writeRecords(readRecords().filter((record) => record._id !== id))
  }
}

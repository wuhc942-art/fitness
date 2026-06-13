import { EXERCISEDB_SNAPSHOT } from './exercisedb-snapshot.local'

const BASE_URL = 'https://oss.exercisedb.dev/api/v1'
const CACHE_KEY = 'exercisedb_exercises_cache_v2'
const CACHE_TTL = 24 * 60 * 60 * 1000
const PAGE_SIZE = 25
const MAX_PAGES = 4

export interface ExerciseDbItem {
  exerciseId: string
  name: string
  gifUrl: string
  targetMuscles: string[]
  bodyParts: string[]
  equipments: string[]
  secondaryMuscles: string[]
  instructions: string[]
}

interface ExerciseDbCache {
  savedAt: number
  items: ExerciseDbItem[]
}

interface ExerciseDbResponse {
  success?: boolean
  meta?: {
    total?: number
    hasNextPage?: boolean
    nextCursor?: string
  }
  data?: ExerciseDbItem[]
  exercises?: ExerciseDbItem[]
  items?: ExerciseDbItem[]
}

function request<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      timeout: 12000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
          return
        }
        if (res.statusCode === 429) {
          reject(new Error('ExerciseDB 免费接口访问过频，请稍后再试。'))
          return
        }
        reject(new Error(`ExerciseDB 请求失败：${res.statusCode}`))
      },
      fail: (error: any) => {
        const detail = error?.errMsg ? `：${error.errMsg}` : ''
        reject(new Error(`ExerciseDB 无法访问${detail}`))
      }
    })
  })
}

function normalizeExerciseList(payload: unknown): ExerciseDbItem[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  const response = payload as ExerciseDbResponse
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.exercises)) return response.exercises
  if (Array.isArray(response.items)) return response.items
  return []
}

function getNextCursor(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const response = payload as ExerciseDbResponse
  return response.meta?.hasNextPage && response.meta.nextCursor ? response.meta.nextCursor : ''
}

function buildPageUrl(cursor = '') {
  const params = [`limit=${PAGE_SIZE}`]
  if (cursor) params.push(`after=${encodeURIComponent(cursor)}`)
  return `${BASE_URL}/exercises?${params.join('&')}`
}

function readCache(): ExerciseDbCache | null {
  try {
    const raw = uni.getStorageSync(CACHE_KEY)
    if (!raw) return null
    const cache = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!cache?.savedAt || !Array.isArray(cache.items)) return null
    return cache
  } catch (error) {
    return null
  }
}

function writeCache(items: ExerciseDbItem[]) {
  uni.setStorageSync(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), items }))
}

export const exerciseDbService = {
  async getExercises(forceRefresh = false): Promise<ExerciseDbItem[]> {
    const cache = readCache()
    if (!forceRefresh && cache && Date.now() - cache.savedAt < CACHE_TTL) {
      return cache.items
    }
    if (!forceRefresh && EXERCISEDB_SNAPSHOT.length) {
      return EXERCISEDB_SNAPSHOT
    }

    const items: ExerciseDbItem[] = []
    const seen = new Set<string>()
    let cursor = ''

    try {
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const response = await request<ExerciseDbItem[] | ExerciseDbResponse>(buildPageUrl(cursor))
        normalizeExerciseList(response).forEach((item) => {
          const key = item.exerciseId || item.name
          if (!key || seen.has(key)) return
          seen.add(key)
          items.push(item)
        })
        cursor = getNextCursor(response)
        if (!cursor) break
      }
    } catch (error) {
      if (cache?.items?.length) return cache.items
      if (EXERCISEDB_SNAPSHOT.length) return EXERCISEDB_SNAPSHOT
      throw error
    }

    writeCache(items)
    return items
  },

  clearCache() {
    uni.removeStorageSync(CACHE_KEY)
  }
}

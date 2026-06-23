import { EXERCISEDB_SNAPSHOT } from './exercisedb-snapshot.local'

const BASE_URL = 'https://oss.exercisedb.dev/api/v1'
const CACHE_KEY = 'exercisedb_exercises_cache_v3'
const CACHE_TTL = 24 * 60 * 60 * 1000
const PAGE_SIZE = 40
const MAX_PAGES = 8

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

export type ExerciseDbSource = 'remote' | 'cache' | 'snapshot'

export interface ExerciseDbLoadResult {
  items: ExerciseDbItem[]
  source: ExerciseDbSource
  stale: boolean
  message: string
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
  async getExercisesWithMeta(forceRefresh = false): Promise<ExerciseDbLoadResult> {
    const cache = readCache()
    if (!forceRefresh && cache && Date.now() - cache.savedAt < CACHE_TTL) {
      return {
        items: cache.items,
        source: 'cache',
        stale: false,
        message: '已显示本地缓存动作，刷新可尝试获取最新 ExerciseDB。'
      }
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
    } catch (error: any) {
      if (cache?.items?.length) {
        return {
          items: cache.items,
          source: 'cache',
          stale: true,
          message: '在线动作库暂时不可用，已显示上次缓存动作。'
        }
      }
      if (EXERCISEDB_SNAPSHOT.length) {
        return {
          items: EXERCISEDB_SNAPSHOT,
          source: 'snapshot',
          stale: true,
          message: '在线动作库暂时不可用，已显示内置演示动作。'
        }
      }
      throw error
    }

    if (!items.length) {
      if (cache?.items?.length) {
        return {
          items: cache.items,
          source: 'cache',
          stale: true,
          message: '在线动作库暂未返回数据，已保留上次缓存动作。'
        }
      }
      return {
        items: EXERCISEDB_SNAPSHOT,
        source: 'snapshot',
        stale: true,
        message: '在线动作库暂未返回数据，已显示内置演示动作。'
      }
    }

    writeCache(items)
    return {
      items,
      source: 'remote',
      stale: false,
      message: '已加载 ExerciseDB 在线动作。'
    }
  },

  async getExercises(forceRefresh = false): Promise<ExerciseDbItem[]> {
    const result = await this.getExercisesWithMeta(forceRefresh)
    return result.items
  },

  clearCache() {
    uni.removeStorageSync(CACHE_KEY)
  }
}

import { exerciseDbService } from './exercisedb.local'

type RequestHandler = (options: any) => void

const storage: Record<string, any> = {}
let requestHandler: RequestHandler = () => {}
let now = 1000

;(globalThis as any).Date.now = () => now
;(globalThis as any).uni = {
  getStorageSync(key: string) {
    return storage[key]
  },
  setStorageSync(key: string, value: any) {
    storage[key] = value
  },
  removeStorageSync(key: string) {
    delete storage[key]
  },
  request(options: any) {
    requestHandler(options)
  }
}

const TEST_CACHE_KEY = 'exercisedb_exercises_cache_v3'

async function assertRemoteLoadsAndCaches() {
  exerciseDbService.clearCache()
  requestHandler = (options) => {
    options.success({
      statusCode: 200,
      data: {
        meta: { hasNextPage: false },
        data: [
          {
            exerciseId: 'remote_1',
            name: 'remote press',
            gifUrl: 'https://example.com/remote.gif',
            targetMuscles: ['chest'],
            bodyParts: ['chest'],
            equipments: ['barbell'],
            secondaryMuscles: [],
            instructions: []
          }
        ]
      }
    })
  }

  const result = await exerciseDbService.getExercisesWithMeta(true)
  if (result.source !== 'remote' || result.stale) throw new Error('getExercisesWithMeta should mark successful loads as remote and fresh')
  if (result.items[0].exerciseId !== 'remote_1') throw new Error('getExercisesWithMeta should return remote items')
  if (!storage[TEST_CACHE_KEY]) throw new Error('getExercisesWithMeta should write non-empty remote items to cache')
}

async function assertFailureFallsBackToCache() {
  now += 25 * 60 * 60 * 1000
  requestHandler = (options) => options.fail({ errMsg: 'network fail' })
  const result = await exerciseDbService.getExercisesWithMeta(true)
  if (result.source !== 'cache' || !result.stale) throw new Error('getExercisesWithMeta should fall back to stale cache on request failure')
  if (result.items[0].exerciseId !== 'remote_1') throw new Error('getExercisesWithMeta should keep cached items when remote fails')
}

async function assertEmptyRemoteKeepsCache() {
  requestHandler = (options) => {
    options.success({ statusCode: 200, data: { meta: { hasNextPage: false }, data: [] } })
  }
  const result = await exerciseDbService.getExercisesWithMeta(true)
  if (result.source !== 'cache' || !result.stale) throw new Error('getExercisesWithMeta should fall back to cache when remote returns no items')
  if (result.items.length !== 1) throw new Error('getExercisesWithMeta should not replace valid cache with an empty remote result')
}

async function assertSnapshotFallbackWithoutCache() {
  exerciseDbService.clearCache()
  requestHandler = (options) => options.fail({ errMsg: 'network fail' })
  const result = await exerciseDbService.getExercisesWithMeta(true)
  if (result.source !== 'snapshot' || !result.stale) throw new Error('getExercisesWithMeta should fall back to snapshot when no cache exists')
  if (!result.items.length) throw new Error('getExercisesWithMeta should provide snapshot items')
}

async function run() {
  await assertRemoteLoadsAndCaches()
  await assertFailureFallsBackToCache()
  await assertEmptyRemoteKeepsCache()
  await assertSnapshotFallbackWithoutCache()
}

run().then(() => console.log('exercisedb resilience assertions passed'))

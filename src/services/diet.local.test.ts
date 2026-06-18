import { dietServiceLocal } from './diet.local'

const record = {
  _id: 'diet_test',
  date: '2026-06-18',
  meals: [
    { type: 'breakfast', text: '鸡蛋、牛奶、燕麦' },
    { type: 'lunch', text: '鸡胸肉、米饭、西兰花' },
    { type: 'dinner', text: '鱼、红薯、青菜' },
    { type: 'snack', text: '酸奶、蛋白粉' }
  ],
  createdAt: '2026-06-18T00:00:00.000Z',
  updatedAt: '2026-06-18T00:00:00.000Z'
} as any

const analysis = dietServiceLocal.analyze(record, 'muscle')

if (!analysis.summaryTitle) throw new Error('diet analysis should expose a goal-aware summary title')
if (!analysis.targets?.protein) throw new Error('diet analysis should expose macro targets')
if (!analysis.progress?.some((item: any) => item.key === 'protein')) throw new Error('diet analysis should expose progress rows')
if (!analysis.suggestions.some((item: string) => item.includes('蛋白'))) throw new Error('diet analysis should include protein guidance')
if (analysis.highlights.length < 4) throw new Error('diet analysis should keep nutrition highlights')

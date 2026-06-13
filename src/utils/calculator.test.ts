import { calculateBestSet, updateActionCalculations } from './calculator'

const best = calculateBestSet({
  name: '卧推',
  weight: 40,
  reps: 12,
  sets: 2,
  setsDetail: [
    { setNumber: 1, weight: 40, reps: 12 },
    { setNumber: 2, weight: 60, reps: 8 }
  ]
} as any)

if (best.weight !== 60) throw new Error('calculateBestSet should choose the heaviest set weight')
if (best.reps !== 8) throw new Error('calculateBestSet should keep reps from the heaviest set')
if (Math.abs(best.estimated1RM - 75.984) > 0.001) throw new Error('calculateBestSet should estimate 1RM from the best set')

const updated = updateActionCalculations({
  name: '鍗ф帹',
  weight: 40,
  reps: 12,
  sets: 2,
  setsDetail: [
    { setNumber: 1, weight: 40, reps: 12 },
    { setNumber: 2, weight: 60, reps: 8 }
  ]
} as any)

if (updated.volume !== 960) throw new Error('updateActionCalculations should sum detailed set volume')
if (updated.weight !== 60) throw new Error('updateActionCalculations should promote the best detailed set weight')
if (updated.reps !== 8) throw new Error('updateActionCalculations should promote reps from the best detailed set')
if (Math.abs((updated.estimated1RM || 0) - 75.984) > 0.001) throw new Error('updateActionCalculations should estimate 1RM from detailed sets')

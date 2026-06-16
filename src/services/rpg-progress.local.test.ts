import { buildGrowthProfile, type GrowthAttribute } from './rpg-progress.local'

const profile = buildGrowthProfile([
  {
    date: '2026-06-01',
    bodyPart: 'chest',
    duration: 60,
    location: 'gym',
    actions: [
      { name: '卧推', weight: 60, reps: 8, sets: 4, volume: 1920 },
      { name: '上斜哑铃卧推', weight: 22.5, reps: 10, sets: 3, volume: 675 }
    ],
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z'
  },
  {
    date: '2026-06-03',
    bodyPart: 'legs',
    duration: 50,
    location: 'gym',
    actions: [
      { name: '深蹲', weight: 70, reps: 6, sets: 4, volume: 1680 }
    ],
    createdAt: '2026-06-03T00:00:00.000Z',
    updatedAt: '2026-06-03T00:00:00.000Z'
  }
] as any, {
  day: { templateName: '上肢推', completed: false },
  week: 2
} as any)

if (profile.level < 2) throw new Error('buildGrowthProfile should derive level from workout experience')
if (profile.experience <= 0) throw new Error('buildGrowthProfile should expose positive experience')
if (!profile.questTitle.includes('上肢推')) throw new Error('buildGrowthProfile should use today plan as quest title')
if (!profile.rewardText.includes('经验')) throw new Error('buildGrowthProfile should describe experience reward')
if (!profile.attributes.some((item: GrowthAttribute) => item.label === '力量')) throw new Error('buildGrowthProfile should include strength attribute')
if (!profile.attributes.some((item: GrowthAttribute) => item.label === '恢复')) throw new Error('buildGrowthProfile should include recovery attribute')

import { formatDate } from '@/utils/date'
import type { FitnessGoal } from '@/services/body-profile.local'

const STORAGE_KEY = 'fitness_diet_records'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type DietGoal = FitnessGoal | 'maintain'
export type NutritionKey = keyof DietNutrition

export interface DietMeal {
  type: MealType
  text: string
}

export interface DietRecord {
  _id: string
  date: string
  meals: DietMeal[]
  createdAt: string
  updatedAt: string
}

export interface DietNutrition {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface DietProgressItem {
  key: NutritionKey
  label: string
  value: number
  target: number
  unit: string
  percent: number
  state: 'low' | 'good' | 'high'
}

export interface DietAnalysis {
  nutrition: DietNutrition
  targets: DietNutrition
  progress: DietProgressItem[]
  summaryTitle: string
  summaryText: string
  suggestions: string[]
  highlights: { label: string; value: string; desc: string }[]
}

const mealLabels: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐'
}

const quickFoodPresets: Record<MealType, string[]> = {
  breakfast: ['鸡蛋', '燕麦', '牛奶', '全麦面包', '香蕉', '酸奶'],
  lunch: ['鸡胸肉', '米饭', '牛肉', '鱼', '西兰花', '土豆'],
  dinner: ['鱼', '红薯', '虾', '豆腐', '青菜', '玉米'],
  snack: ['酸奶', '蛋白粉', '水果', '坚果', '牛奶', '香蕉']
}

const foodRules = [
  { keys: ['鸡胸', '鸡胸肉', '牛肉', '鱼', '虾', '鸡蛋', '蛋白', '蛋清', '乳清', '蛋白粉', '豆腐'], calories: 220, protein: 28, fat: 8, carbs: 4 },
  { keys: ['米饭', '面', '馒头', '面包', '燕麦', '土豆', '红薯', '玉米', '粥', '粉'], calories: 260, protein: 7, fat: 3, carbs: 52 },
  { keys: ['奶茶', '甜品', '蛋糕', '饼干', '糖', '可乐', '饮料'], calories: 320, protein: 4, fat: 12, carbs: 50 },
  { keys: ['沙拉', '青菜', '蔬菜', '西兰花', '菠菜', '生菜', '番茄', '黄瓜'], calories: 80, protein: 4, fat: 2, carbs: 12 },
  { keys: ['坚果', '花生', '核桃', '牛油果'], calories: 260, protein: 8, fat: 22, carbs: 8 },
  { keys: ['牛奶', '酸奶', '奶酪'], calories: 160, protein: 10, fat: 6, carbs: 15 },
  { keys: ['火锅', '烧烤', '炸鸡', '汉堡', '披萨', '薯条'], calories: 520, protein: 22, fat: 30, carbs: 38 },
  { keys: ['苹果', '香蕉', '橙', '水果', '蓝莓', '草莓'], calories: 120, protein: 2, fat: 1, carbs: 28 }
]

function readRecords(): DietRecord[] {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    const records = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(records) ? records : []
  } catch (error) {
    console.error('读取饮食记录失败:', error)
    return []
  }
}

function writeRecords(records: DietRecord[]) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(records))
}

function createRecord(date = formatDate(new Date())): DietRecord {
  const now = new Date().toISOString()
  return {
    _id: `diet_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    date,
    meals: [
      { type: 'breakfast', text: '' },
      { type: 'lunch', text: '' },
      { type: 'dinner', text: '' },
      { type: 'snack', text: '' }
    ],
    createdAt: now,
    updatedAt: now
  }
}

function estimateMeal(text: string): DietNutrition {
  const normalized = text.trim()
  if (!normalized) return { calories: 0, protein: 0, fat: 0, carbs: 0 }

  const matched = foodRules.filter((rule) => rule.keys.some((key) => normalized.includes(key)))
  if (!matched.length) {
    return { calories: 280, protein: 12, fat: 10, carbs: 32 }
  }

  return matched.reduce(
    (sum, rule) => ({
      calories: sum.calories + rule.calories,
      protein: sum.protein + rule.protein,
      fat: sum.fat + rule.fat,
      carbs: sum.carbs + rule.carbs
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )
}

function addNutrition(a: DietNutrition, b: DietNutrition): DietNutrition {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    fat: a.fat + b.fat,
    carbs: a.carbs + b.carbs
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function targetsForGoal(goal: DietGoal = 'maintain'): DietNutrition {
  if (goal === 'fatLoss') return { calories: 1900, protein: 130, fat: 55, carbs: 190 }
  if (goal === 'muscle' || goal === 'strength') return { calories: 2600, protein: 150, fat: 75, carbs: 320 }
  if (goal === 'shape') return { calories: 2200, protein: 125, fat: 65, carbs: 240 }
  return { calories: 2200, protein: 120, fat: 65, carbs: 250 }
}

function progressState(value: number, target: number, key: NutritionKey): DietProgressItem['state'] {
  if (value <= 0) return 'low'
  const ratio = value / target
  if (key === 'fat' || key === 'calories') {
    if (ratio > 1.15) return 'high'
    if (ratio < 0.75) return 'low'
    return 'good'
  }
  if (ratio < 0.8) return 'low'
  if (ratio > 1.25) return 'high'
  return 'good'
}

function buildProgress(nutrition: DietNutrition, targets: DietNutrition): DietProgressItem[] {
  const rows: { key: NutritionKey; label: string; unit: string }[] = [
    { key: 'protein', label: '蛋白', unit: 'g' },
    { key: 'calories', label: '热量', unit: 'kcal' },
    { key: 'carbs', label: '碳水', unit: 'g' },
    { key: 'fat', label: '脂肪', unit: 'g' }
  ]
  return rows.map((row) => {
    const value = nutrition[row.key]
    const target = targets[row.key]
    return {
      ...row,
      value,
      target,
      percent: clamp(Math.round((value / target) * 100), 0, 140),
      state: progressState(value, target, row.key)
    }
  })
}

function summaryFor(progress: DietProgressItem[]) {
  const protein = progress.find((item) => item.key === 'protein')
  const calories = progress.find((item) => item.key === 'calories')
  if (!protein || !calories || protein.value === 0) {
    return { title: '先补一条饮食记录', text: '记录一餐后，这里会直接告诉你蛋白、热量和训练恢复是否够用。' }
  }
  if (protein.state === 'low') return { title: '蛋白还不够', text: `距离今日目标还差 ${Math.max(protein.target - protein.value, 0)}g，优先补鸡蛋、鱼虾、牛奶或蛋白粉。` }
  if (calories.state === 'high') return { title: '热量偏高', text: '今天可以减少含糖饮料、油炸和高脂零食，晚餐保持清淡。' }
  if (calories.state === 'low') return { title: '热量偏低', text: '如果今天有训练，建议补一份主食和蛋白，避免恢复变差。' }
  return { title: '今天吃得比较稳', text: '蛋白和热量接近目标，继续保持这个节奏。' }
}

function buildSuggestions(nutrition: DietNutrition, targets: DietNutrition, mealText: string, goal: DietGoal) {
  const suggestions: string[] = []
  const proteinGap = targets.protein - nutrition.protein
  if (proteinGap > 20) suggestions.push(`蛋白还差约 ${proteinGap}g，下一餐优先补鸡胸、鱼虾、鸡蛋、牛奶或蛋白粉。`)
  else suggestions.push('蛋白摄入接近目标，训练后的恢复支持不错。')

  if (goal === 'fatLoss' && nutrition.calories > targets.calories * 1.1) suggestions.push('减脂目标下热量偏高，先减少甜饮、油炸和零食，不要直接砍掉正餐。')
  if ((goal === 'muscle' || goal === 'strength') && nutrition.calories < targets.calories * 0.8) suggestions.push('增肌/力量目标下热量偏低，可以在训练前后加一份米饭、燕麦或香蕉。')
  if (nutrition.carbs > targets.carbs * 1.2) suggestions.push('碳水偏高，晚上可把主食减半，并用蔬菜和优质蛋白补饱腹。')
  if (nutrition.fat > targets.fat * 1.2) suggestions.push('脂肪偏高，注意控制火锅、烧烤、坚果、油炸和奶茶频率。')
  if (!/(蔬菜|青菜|沙拉|西兰花|菠菜|生菜|番茄|黄瓜)/.test(mealText)) suggestions.push('蔬菜记录偏少，建议补一份绿叶菜，帮助饱腹和微量营养。')
  if (/(奶茶|甜品|蛋糕|可乐|饮料|糖)/.test(mealText)) suggestions.push('今天有含糖食物或饮料，尽量放在训练日前后，其他时间少喝。')

  return suggestions.slice(0, 4)
}

export const dietServiceLocal = {
  mealLabels,
  quickFoodPresets,

  async getRecord(date = formatDate(new Date())): Promise<DietRecord> {
    const existing = readRecords().find((record) => record.date === date)
    if (existing) return existing
    return createRecord(date)
  },

  async getRecentRecords(limit = 7): Promise<DietRecord[]> {
    return readRecords().slice(0, limit)
  },

  async getPreviousRecord(date: string): Promise<DietRecord | null> {
    return readRecords().find((record) => record.date < date) || null
  },

  createRecordFrom(date: string, source: DietRecord): DietRecord {
    const next = createRecord(date)
    next.meals = next.meals.map((meal) => ({
      type: meal.type,
      text: source.meals.find((item) => item.type === meal.type)?.text || ''
    }))
    return next
  },

  async hasRecord(date: string): Promise<boolean> {
    return readRecords().some((record) => record.date === date)
  },

  async saveRecord(record: DietRecord): Promise<DietRecord> {
    const records = readRecords()
    const index = records.findIndex((item) => item.date === record.date)
    const next = { ...record, updatedAt: new Date().toISOString() }
    if (index >= 0) records[index] = next
    else records.unshift(next)
    records.sort((a, b) => b.date.localeCompare(a.date))
    writeRecords(records)
    return next
  },

  analyze(record: DietRecord, goal: DietGoal = 'maintain'): DietAnalysis {
    const nutrition = record.meals
      .map((meal) => estimateMeal(meal.text))
      .reduce(addNutrition, { calories: 0, protein: 0, fat: 0, carbs: 0 })
    const targets = targetsForGoal(goal)
    const progress = buildProgress(nutrition, targets)
    const summary = summaryFor(progress)
    const mealText = record.meals.map((meal) => meal.text).join(' ')

    return {
      nutrition,
      targets,
      progress,
      summaryTitle: summary.title,
      summaryText: summary.text,
      suggestions: buildSuggestions(nutrition, targets, mealText, goal),
      highlights: [
        { label: '总热量', value: `${nutrition.calories} kcal`, desc: `${progress.find((item) => item.key === 'calories')?.percent || 0}% 目标` },
        { label: '蛋白质', value: `${nutrition.protein}g`, desc: `${progress.find((item) => item.key === 'protein')?.percent || 0}% 目标` },
        { label: '碳水', value: `${nutrition.carbs}g`, desc: `${progress.find((item) => item.key === 'carbs')?.percent || 0}% 目标` },
        { label: '脂肪', value: `${nutrition.fat}g`, desc: `${progress.find((item) => item.key === 'fat')?.percent || 0}% 目标` }
      ]
    }
  }
}

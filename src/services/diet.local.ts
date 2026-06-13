import { formatDate } from '@/utils/date'

const STORAGE_KEY = 'fitness_diet_records'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

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

export interface DietAnalysis {
  nutrition: DietNutrition
  suggestions: string[]
  highlights: { label: string; value: string; desc: string }[]
}

const mealLabels: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐'
}

const foodRules = [
  { keys: ['鸡胸', '牛肉', '鱼', '虾', '鸡蛋', '蛋白', '蛋清', '乳清', '蛋白粉', '豆腐'], calories: 220, protein: 28, fat: 8, carbs: 4 },
  { keys: ['米饭', '面', '馒头', '面包', '燕麦', '土豆', '红薯', '玉米', '粉', '粥'], calories: 260, protein: 7, fat: 3, carbs: 52 },
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

export const dietServiceLocal = {
  mealLabels,

  async getRecord(date = formatDate(new Date())): Promise<DietRecord> {
    const existing = readRecords().find((record) => record.date === date)
    if (existing) return existing
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
    writeRecords(records)
    return next
  },

  analyze(record: DietRecord): DietAnalysis {
    const nutrition = record.meals
      .map((meal) => estimateMeal(meal.text))
      .reduce(addNutrition, { calories: 0, protein: 0, fat: 0, carbs: 0 })

    const suggestions: string[] = []
    const mealText = record.meals.map((meal) => meal.text).join(' ')
    if (nutrition.protein < 80) suggestions.push('今天蛋白质可能偏低，可以增加鸡胸肉、鱼虾、鸡蛋、牛奶或乳清蛋白。')
    else suggestions.push('蛋白质摄入看起来不错，适合训练后的恢复。')

    if (nutrition.carbs > 260) suggestions.push('碳水摄入偏高，减脂期可以减少精制主食或含糖饮料。')
    if (nutrition.fat > 80) suggestions.push('脂肪摄入偏高，注意控制油炸、烧烤、坚果和火锅频率。')
    if (!/(蔬菜|青菜|沙拉|西兰花|菠菜|生菜|番茄|黄瓜)/.test(mealText)) suggestions.push('今天蔬菜记录较少，建议补充一份绿叶菜帮助饱腹和微量营养。')
    if (/(奶茶|甜品|蛋糕|可乐|饮料|糖)/.test(mealText)) suggestions.push('今天有含糖食物或饮料，建议把它放在训练日前后，其他时间少喝。')
    if (nutrition.calories < 1200) suggestions.push('记录热量偏低，可能漏记了食物；长期过低会影响训练状态。')

    return {
      nutrition,
      suggestions: suggestions.slice(0, 4),
      highlights: [
        { label: '总热量', value: `${nutrition.calories} kcal`, desc: '按关键词粗略估算' },
        { label: '蛋白质', value: `${nutrition.protein}g`, desc: nutrition.protein >= 80 ? '恢复支持较好' : '建议提高' },
        { label: '碳水', value: `${nutrition.carbs}g`, desc: nutrition.carbs > 260 ? '偏高' : '正常范围' },
        { label: '脂肪', value: `${nutrition.fat}g`, desc: nutrition.fat > 80 ? '注意控制' : '正常范围' }
      ]
    }
  }
}

export type ExerciseBodyPart = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core' | 'full' | 'cardio'
export type ExerciseEquipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'cardio' | 'other'
export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced'

export interface ExerciseLibraryItem {
  id: string
  name: string
  bodyPart: ExerciseBodyPart
  equipment: ExerciseEquipment
  level: ExerciseLevel
  primaryMuscles: string[]
  secondaryMuscles: string[]
  aliases?: string[]
  cues: string[]
  mistakes: string[]
}

export const BODY_PART_OPTIONS: { value: ExerciseBodyPart | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'chest', label: '胸' },
  { value: 'back', label: '背' },
  { value: 'shoulders', label: '肩' },
  { value: 'arms', label: '手臂' },
  { value: 'legs', label: '腿臀' },
  { value: 'core', label: '核心' },
  { value: 'full', label: '全身' },
  { value: 'cardio', label: '有氧' }
]

export const EQUIPMENT_OPTIONS: { value: ExerciseEquipment | 'all'; label: string }[] = [
  { value: 'all', label: '全部器械' },
  { value: 'barbell', label: '杠铃' },
  { value: 'dumbbell', label: '哑铃' },
  { value: 'cable', label: '绳索' },
  { value: 'machine', label: '固定器械' },
  { value: 'bodyweight', label: '自重' },
  { value: 'cardio', label: '有氧器械' },
  { value: 'other', label: '其他' }
]

export const LEVEL_LABELS: Record<ExerciseLevel, string> = {
  beginner: '新手友好',
  intermediate: '进阶常用',
  advanced: '高阶动作'
}

export const EQUIPMENT_LABELS: Record<ExerciseEquipment, string> = {
  barbell: '杠铃',
  dumbbell: '哑铃',
  cable: '绳索',
  machine: '固定器械',
  bodyweight: '自重',
  cardio: '有氧器械',
  other: '其他'
}

export const EXERCISE_LIBRARY: ExerciseLibraryItem[] = [
  {
    id: 'barbell-bench-press',
    name: '杠铃卧推',
    bodyPart: 'chest',
    equipment: 'barbell',
    level: 'beginner',
    primaryMuscles: ['胸大肌'],
    secondaryMuscles: ['肱三头肌', '三角肌前束'],
    cues: ['肩胛微微后收下沉，脚踩稳地面', '杠铃下放到胸中下部附近', '推起时保持手腕在杠铃正下方'],
    mistakes: ['肩膀耸起', '下放过快', '臀部明显离开凳面']
  },
  {
    id: 'incline-dumbbell-press',
    name: '上斜哑铃卧推',
    bodyPart: 'chest',
    equipment: 'dumbbell',
    level: 'intermediate',
    primaryMuscles: ['上胸'],
    secondaryMuscles: ['三角肌前束', '肱三头肌'],
    cues: ['凳子角度控制在约 30 度', '哑铃下放到胸上方两侧', '顶端不要用力撞铃'],
    mistakes: ['角度过高变成肩推', '手肘过度外展', '动作幅度太短']
  },
  {
    id: 'push-up',
    name: '俯卧撑',
    bodyPart: 'chest',
    equipment: 'bodyweight',
    level: 'beginner',
    primaryMuscles: ['胸大肌'],
    secondaryMuscles: ['肱三头肌', '核心'],
    cues: ['身体保持一条直线', '胸口主动靠近地面', '推起时收紧腹部'],
    mistakes: ['塌腰', '头向前探', '只做半程']
  },
  {
    id: 'lat-pulldown',
    name: '高位下拉',
    bodyPart: 'back',
    equipment: 'cable',
    level: 'beginner',
    primaryMuscles: ['背阔肌'],
    secondaryMuscles: ['肱二头肌', '斜方肌下束'],
    cues: ['先沉肩再拉肘', '把横杆拉向锁骨附近', '还原时让背部被拉长'],
    mistakes: ['身体后仰太多', '只用手臂发力', '耸肩拉动']
  },
  {
    id: 'barbell-row',
    name: '杠铃划船',
    bodyPart: 'back',
    equipment: 'barbell',
    level: 'intermediate',
    primaryMuscles: ['背阔肌', '中背'],
    secondaryMuscles: ['竖脊肌', '肱二头肌'],
    cues: ['髋部后移，躯干稳定', '杠铃向肚脐方向拉', '顶端夹背一瞬间'],
    mistakes: ['借力甩动', '腰背松掉', '杠铃离身体太远']
  },
  {
    id: 'seated-cable-row',
    name: '坐姿划船',
    bodyPart: 'back',
    equipment: 'cable',
    level: 'beginner',
    primaryMuscles: ['中背', '背阔肌'],
    secondaryMuscles: ['肱二头肌', '后三角'],
    cues: ['胸口打开，肩膀下沉', '手肘贴近身体向后拉', '还原时控制速度'],
    mistakes: ['含胸圆肩', '身体大幅前后晃', '只拉到手不拉到肘']
  },
  {
    id: 'barbell-squat',
    name: '深蹲',
    bodyPart: 'legs',
    equipment: 'barbell',
    level: 'intermediate',
    primaryMuscles: ['股四头肌', '臀大肌'],
    secondaryMuscles: ['腘绳肌', '核心'],
    cues: ['脚掌三点踩稳', '下蹲时膝盖跟随脚尖方向', '起身时胸口保持打开'],
    mistakes: ['膝盖内扣', '脚跟抬起', '下背部失去稳定']
  },
  {
    id: 'leg-press',
    name: '腿举',
    bodyPart: 'legs',
    equipment: 'machine',
    level: 'beginner',
    primaryMuscles: ['股四头肌', '臀大肌'],
    secondaryMuscles: ['腘绳肌'],
    cues: ['臀部和背部贴住靠垫', '膝盖弯曲到可控深度', '推起时不要锁死膝盖'],
    mistakes: ['膝盖完全锁死', '下放过深导致骨盆卷起', '脚掌发力不均']
  },
  {
    id: 'romanian-deadlift',
    name: '罗马尼亚硬拉',
    bodyPart: 'legs',
    equipment: 'barbell',
    level: 'intermediate',
    primaryMuscles: ['腘绳肌', '臀大肌'],
    secondaryMuscles: ['竖脊肌', '前臂'],
    cues: ['髋部向后折叠', '杠铃贴近大腿下放', '感到大腿后侧被拉长后再起身'],
    mistakes: ['膝盖弯曲过多变成深蹲', '背部弯曲', '杠铃离腿太远']
  },
  {
    id: 'deadlift',
    name: '硬拉',
    bodyPart: 'full',
    equipment: 'barbell',
    level: 'advanced',
    primaryMuscles: ['臀腿后侧', '背部'],
    secondaryMuscles: ['核心', '前臂'],
    cues: ['杠铃贴近小腿', '先建立背部张力', '用腿蹬地同时髋部伸展'],
    mistakes: ['起拉前背部松散', '杠铃绕远路', '顶端过度后仰']
  },
  {
    id: 'barbell-overhead-press',
    name: '杠铃肩推',
    bodyPart: 'shoulders',
    equipment: 'barbell',
    level: 'intermediate',
    primaryMuscles: ['三角肌前束', '三角肌中束'],
    secondaryMuscles: ['肱三头肌', '核心'],
    cues: ['收紧腹部和臀部', '杠铃从锁骨上方直线上推', '头部轻微让位后回到杠下'],
    mistakes: ['腰部过度后弯', '杠铃路线向前飘', '手腕塌陷']
  },
  {
    id: 'dumbbell-lateral-raise',
    name: '哑铃侧平举',
    bodyPart: 'shoulders',
    equipment: 'dumbbell',
    level: 'beginner',
    primaryMuscles: ['三角肌中束'],
    secondaryMuscles: ['斜方肌'],
    cues: ['手肘微弯并领先手腕', '举到肩高附近即可', '全程控制下放'],
    mistakes: ['耸肩代偿', '借身体摆动', '重量过大导致变形']
  },
  {
    id: 'biceps-curl',
    name: '二头弯举',
    bodyPart: 'arms',
    equipment: 'dumbbell',
    level: 'beginner',
    primaryMuscles: ['肱二头肌'],
    secondaryMuscles: ['前臂'],
    cues: ['上臂尽量固定', '弯举到顶端主动收缩', '下放时保持张力'],
    mistakes: ['身体后仰借力', '肘部大幅前移', '下放太快']
  },
  {
    id: 'rope-pushdown',
    name: '绳索下压',
    bodyPart: 'arms',
    equipment: 'cable',
    level: 'beginner',
    primaryMuscles: ['肱三头肌'],
    secondaryMuscles: ['前臂'],
    cues: ['肘部贴近身体两侧', '下压到底时分开绳索', '回程控制到前臂接近水平'],
    mistakes: ['肩膀参与过多', '肘部乱晃', '重量太大只做半程']
  },
  {
    id: 'plank',
    name: '平板支撑',
    bodyPart: 'core',
    equipment: 'bodyweight',
    level: 'beginner',
    primaryMuscles: ['腹横肌', '腹直肌'],
    secondaryMuscles: ['臀部', '肩部稳定肌'],
    cues: ['肘在肩正下方', '收紧腹部和臀部', '保持自然呼吸'],
    mistakes: ['塌腰', '臀部抬太高', '憋气硬撑']
  },
  {
    id: 'crunch',
    name: '卷腹',
    bodyPart: 'core',
    equipment: 'bodyweight',
    level: 'beginner',
    primaryMuscles: ['腹直肌'],
    secondaryMuscles: ['髋屈肌'],
    cues: ['用胸口向骨盆靠近', '上背离地即可', '下放时不要完全放松'],
    mistakes: ['用手拉脖子', '速度太快', '腰部离地过多']
  },
  {
    id: 'running',
    name: '跑步',
    bodyPart: 'cardio',
    equipment: 'cardio',
    level: 'beginner',
    primaryMuscles: ['心肺耐力'],
    secondaryMuscles: ['腿部肌群'],
    cues: ['从可持续配速开始', '肩颈放松', '落地保持轻快'],
    mistakes: ['一开始速度过快', '步幅过大', '忽略热身和冷却']
  },
  {
    id: 'elliptical',
    name: '椭圆机',
    bodyPart: 'cardio',
    equipment: 'cardio',
    level: 'beginner',
    primaryMuscles: ['心肺耐力'],
    secondaryMuscles: ['臀腿', '上肢协同'],
    cues: ['保持身体直立', '用腿部稳定推动', '按目标心率调整阻力'],
    mistakes: ['身体趴在扶手上', '阻力过低只靠惯性', '训练时间没有计划']
  }
]

function commonExercise(
  id: string,
  name: string,
  bodyPart: ExerciseBodyPart,
  equipment: ExerciseEquipment,
  primaryMuscles: string[],
  secondaryMuscles: string[] = [],
  aliases: string[] = []
): ExerciseLibraryItem {
  return {
    id,
    name,
    bodyPart,
    equipment,
    level: 'beginner',
    primaryMuscles,
    secondaryMuscles,
    aliases,
    cues: ['选择能稳定控制的重量', '动作全程保持身体稳定', '优先保证发力感和动作幅度'],
    mistakes: ['重量过大导致借力', '动作速度太快', '只做半程导致训练效果下降']
  }
}

EXERCISE_LIBRARY.push(
  commonExercise('smith-bench-press', '史密斯卧推', 'chest', 'machine', ['胸大肌'], ['肱三头肌', '三角肌前束']),
  commonExercise('machine-chest-press', '器械推胸', 'chest', 'machine', ['胸大肌'], ['肱三头肌'], ['坐姿推胸', '固定器械推胸', '机器推胸', '器械卧推', 'chest press', 'machine chest press']),
  commonExercise('pec-deck-fly', '蝴蝶机夹胸', 'chest', 'machine', ['胸大肌'], [], ['夹胸机', '飞鸟机', '器械夹胸', '坐姿夹胸', '蝴蝶机飞鸟', 'pec deck', 'pec fly', 'machine fly']),
  commonExercise('cable-crossover-cn', '绳索夹胸', 'chest', 'cable', ['胸大肌']),
  commonExercise('dumbbell-fly', '哑铃飞鸟', 'chest', 'dumbbell', ['胸大肌']),
  commonExercise('low-cable-fly', '低位绳索夹胸', 'chest', 'cable', ['上胸']),
  commonExercise('chest-dip', '双杠臂屈伸', 'chest', 'bodyweight', ['下胸', '肱三头肌']),
  commonExercise('assisted-pull-up-cn', '辅助引体向上', 'back', 'machine', ['背阔肌'], ['肱二头肌']),
  commonExercise('pull-up-cn', '引体向上', 'back', 'bodyweight', ['背阔肌'], ['肱二头肌']),
  commonExercise('chin-up-cn', '反手引体向上', 'back', 'bodyweight', ['背阔肌', '肱二头肌']),
  commonExercise('straight-arm-pulldown', '直臂下拉', 'back', 'cable', ['背阔肌']),
  commonExercise('one-arm-dumbbell-row', '单臂哑铃划船', 'back', 'dumbbell', ['背阔肌', '中背']),
  commonExercise('t-bar-row', 'T杠划船', 'back', 'machine', ['中背', '背阔肌']),
  commonExercise('machine-row', '器械划船', 'back', 'machine', ['中背', '背阔肌']),
  commonExercise('reverse-fly', '反向飞鸟', 'back', 'machine', ['后三角', '中背']),
  commonExercise('face-pull', '面拉', 'shoulders', 'cable', ['后三角'], ['斜方肌']),
  commonExercise('dumbbell-shoulder-press', '哑铃肩推', 'shoulders', 'dumbbell', ['三角肌前束', '三角肌中束']),
  commonExercise('machine-shoulder-press', '器械肩推', 'shoulders', 'machine', ['三角肌']),
  commonExercise('arnold-press', '阿诺德推举', 'shoulders', 'dumbbell', ['三角肌']),
  commonExercise('front-raise-cn', '前平举', 'shoulders', 'dumbbell', ['三角肌前束']),
  commonExercise('cable-lateral-raise', '绳索侧平举', 'shoulders', 'cable', ['三角肌中束']),
  commonExercise('upright-row', '直立划船', 'shoulders', 'barbell', ['三角肌中束', '斜方肌']),
  commonExercise('barbell-curl-cn', '杠铃弯举', 'arms', 'barbell', ['肱二头肌']),
  commonExercise('dumbbell-curl-cn', '哑铃弯举', 'arms', 'dumbbell', ['肱二头肌']),
  commonExercise('hammer-curl-cn', '锤式弯举', 'arms', 'dumbbell', ['肱二头肌', '肱肌']),
  commonExercise('preacher-curl-cn', '牧师凳弯举', 'arms', 'barbell', ['肱二头肌']),
  commonExercise('concentration-curl', '集中弯举', 'arms', 'dumbbell', ['肱二头肌']),
  commonExercise('overhead-triceps-extension', '过顶臂屈伸', 'arms', 'dumbbell', ['肱三头肌']),
  commonExercise('skull-crusher-cn', '仰卧臂屈伸', 'arms', 'barbell', ['肱三头肌']),
  commonExercise('close-grip-bench', '窄距卧推', 'arms', 'barbell', ['肱三头肌'], ['胸大肌']),
  commonExercise('triceps-dip', '凳上臂屈伸', 'arms', 'bodyweight', ['肱三头肌']),
  commonExercise('leg-extension-cn', '腿屈伸', 'legs', 'machine', ['股四头肌']),
  commonExercise('lying-leg-curl-cn', '俯卧腿弯举', 'legs', 'machine', ['腘绳肌']),
  commonExercise('seated-leg-curl', '坐姿腿弯举', 'legs', 'machine', ['腘绳肌']),
  commonExercise('smith-squat', '史密斯深蹲', 'legs', 'machine', ['股四头肌', '臀大肌']),
  commonExercise('hack-squat-cn', '哈克深蹲', 'legs', 'machine', ['股四头肌', '臀大肌']),
  commonExercise('front-squat', '前蹲', 'legs', 'barbell', ['股四头肌', '核心']),
  commonExercise('goblet-squat', '高脚杯深蹲', 'legs', 'dumbbell', ['股四头肌', '臀大肌']),
  commonExercise('lunge-cn', '弓步蹲', 'legs', 'dumbbell', ['股四头肌', '臀大肌']),
  commonExercise('bulgarian-split-squat-cn', '保加利亚分腿蹲', 'legs', 'dumbbell', ['股四头肌', '臀大肌']),
  commonExercise('hip-thrust-cn', '臀推', 'legs', 'barbell', ['臀大肌']),
  commonExercise('glute-bridge', '臀桥', 'legs', 'bodyweight', ['臀大肌']),
  commonExercise('hip-abduction', '髋外展', 'legs', 'machine', ['臀中肌']),
  commonExercise('standing-calf-raise', '站姿提踵', 'legs', 'machine', ['小腿']),
  commonExercise('seated-calf-raise', '坐姿提踵', 'legs', 'machine', ['小腿']),
  commonExercise('ab-wheel', '健腹轮', 'core', 'other', ['腹直肌', '核心']),
  commonExercise('hanging-leg-raise-cn', '悬垂举腿', 'core', 'bodyweight', ['腹直肌']),
  commonExercise('reverse-crunch', '反向卷腹', 'core', 'bodyweight', ['腹直肌']),
  commonExercise('cable-crunch', '绳索卷腹', 'core', 'cable', ['腹直肌']),
  commonExercise('side-plank', '侧平板支撑', 'core', 'bodyweight', ['腹斜肌']),
  commonExercise('dead-bug', '死虫式', 'core', 'bodyweight', ['核心']),
  commonExercise('elliptical-cn', '椭圆机', 'cardio', 'cardio', ['心肺耐力']),
  commonExercise('rowing-machine', '划船机', 'cardio', 'cardio', ['心肺耐力', '背部']),
  commonExercise('stair-climber', '爬楼机', 'cardio', 'cardio', ['心肺耐力', '臀腿']),
  commonExercise('spinning-bike', '动感单车', 'cardio', 'cardio', ['心肺耐力', '腿部'])
)

export function getExerciseByName(name: string) {
  return EXERCISE_LIBRARY.find((item) => item.name === name)
}

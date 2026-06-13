const TERM_MAP: Record<string, string> = {
  abs: '腹肌',
  back: '背部',
  'body weight': '自重',
  cable: '绳索',
  calves: '小腿',
  chest: '胸部',
  core: '核心',
  deltoids: '三角肌',
  dumbbell: '哑铃',
  glutes: '臀部',
  hamstrings: '腘绳肌',
  'hip flexors': '髋屈肌',
  kettlebell: '壶铃',
  lats: '背阔肌',
  lever: '器械',
  pectorals: '胸肌',
  quadriceps: '股四头肌',
  shoulders: '肩部',
  spine: '脊柱',
  triceps: '肱三头肌',
  waist: '腰腹'
}

const STEP_REPLACEMENTS: Array<[RegExp, string]> = [
  [/^step:\d+\s*/i, ''],
  [/lie face down/gi, '俯卧'],
  [/lie on your back/gi, '仰卧'],
  [/stand with your feet/gi, '双脚站稳'],
  [/keep your back straight/gi, '保持背部挺直'],
  [/engage your core/gi, '收紧核心'],
  [/slowly lower/gi, '缓慢下放'],
  [/return to the starting position/gi, '回到起始位置'],
  [/repeat for the desired number of repetitions/gi, '按计划次数重复'],
  [/bend your elbows/gi, '弯曲手肘'],
  [/straighten your arms/gi, '伸直手臂'],
  [/squeeze your/gi, '主动收紧'],
  [/pause for a moment/gi, '顶端短暂停留']
]

export function translateExerciseTerm(term: string) {
  const normalized = term.toLowerCase().trim()
  return TERM_MAP[normalized] || term
}

export function translateExerciseTags(values: string[] = []) {
  return values.length ? values.map(translateExerciseTerm).join(' / ') : '未标注'
}

export function translateExerciseStep(step: string) {
  let next = step
  STEP_REPLACEMENTS.forEach(([pattern, replacement]) => {
    next = next.replace(pattern, replacement)
  })
  if (/[\u4e00-\u9fa5]/.test(next)) return next
  return '按动图节奏完成动作，保持控制和稳定。'
}

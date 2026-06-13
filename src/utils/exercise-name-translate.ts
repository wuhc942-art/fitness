const PHRASE_MAP: Record<string, string> = {
  'cable cross-over variation': '绳索夹胸',
  'sled 45в° leg press': '45度腿举',
  'sled 45° leg press': '45度腿举',
  'lever lying leg curl': '俯卧腿弯举',
  'dumbbell decline hammer press': '下斜哑铃锤式卧推',
  'dumbbell one arm shoulder press v. 2': '单臂哑铃肩推',
  'barbell curl': '杠铃弯举',
  'cable overhead triceps extension (rope attachment)': '绳索过顶三头臂屈伸',
  'lever one arm shoulder press': '器械单臂肩推',
  'dumbbell hammer curl v. 2': '哑铃锤式弯举',
  'cable decline press': '下斜绳索推胸',
  'dumbbell bench seated press': '坐姿哑铃推举',
  'barbell incline bench press': '上斜杠铃卧推',
  'cable pushdown': '绳索下压',
  'cable lateral pulldown with v-bar': 'V把高位下拉',
  'cable standing row (v-bar)': 'V把站姿绳索划船',
  'alternate lateral pulldown': '交替高位下拉',
  'hanging straight leg raise': '悬垂直腿举',
  'resistance band seated chest press': '弹力带坐姿推胸',
  'lever seated fly': '蝴蝶机夹胸',
  'lever pec deck fly': '蝴蝶机夹胸',
  'lever chest press': '器械推胸',
  'lever seated chest press': '坐姿器械推胸',
  'machine chest press': '器械推胸',
  'machine fly': '器械夹胸',
  'pec deck fly': '蝴蝶机夹胸',
  'pec deck': '蝴蝶机夹胸',
  'chest fly': '夹胸',
  'dumbbell lying rear lateral raise': '俯卧哑铃后束飞鸟',
  'dumbbell stiff leg deadlift': '哑铃直腿硬拉',
  'assisted pull-up inclined': '辅助斜向引体',
  'smith incline bench press': '史密斯上斜卧推',
  'barbell hack squat': '杠铃哈克深蹲',
  'lever shoulder press': '器械肩推',
  'bench press': '卧推',
  'incline bench press': '上斜卧推',
  'decline bench press': '下斜卧推',
  'chest press': '推胸',
  'shoulder press': '肩推',
  'overhead press': '过顶推举',
  'military press': '站姿肩推',
  'lateral raise': '侧平举',
  'front raise': '前平举',
  'rear delt': '后三角',
  'bent over row': '俯身划船',
  'seated row': '坐姿划船',
  'lat pulldown': '高位下拉',
  'pull up': '引体向上',
  'chin up': '反手引体向上',
  'push up': '俯卧撑',
  'deadlift': '硬拉',
  'romanian deadlift': '罗马尼亚硬拉',
  'stiff leg deadlift': '直腿硬拉',
  'hip thrust': '臀推',
  'leg press': '腿举',
  'leg extension': '腿屈伸',
  'leg curl': '腿弯举',
  'calf raise': '提踵',
  'split squat': '分腿蹲',
  'bulgarian split squat': '保加利亚分腿蹲',
  'biceps curl': '二头弯举',
  'hammer curl': '锤式弯举',
  'triceps extension': '三头臂屈伸',
  'triceps pushdown': '三头下压',
  'skull crusher': '仰卧臂屈伸',
  'crunch': '卷腹',
  'sit up': '仰卧起坐',
  'plank': '平板支撑',
  'russian twist': '俄罗斯转体',
  'mountain climber': '登山跑',
  'jumping jack': '开合跳',
  'upward facing dog': '上犬式',
  'downward facing dog': '下犬式'
}

const WORD_MAP: Record<string, string> = {
  alternate: '交替',
  alternating: '交替',
  assisted: '辅助',
  band: '弹力带',
  barbell: '杠铃',
  battle: '战绳',
  bodyweight: '自重',
  cable: '绳索',
  close: '窄距',
  decline: '下斜',
  degrees: '度',
  dumbbell: '哑铃',
  elevated: '垫高',
  extension: '伸展',
  flat: '平板',
  fly: '飞鸟',
  flyes: '飞鸟',
  front: '前',
  grip: '握',
  hack: '哈克',
  hammer: '锤式',
  high: '高位',
  incline: '上斜',
  kettlebell: '壶铃',
  kneeling: '跪姿',
  lateral: '侧',
  lever: '器械',
  lying: '仰卧',
  machine: '器械',
  narrow: '窄距',
  neutral: '中立握',
  one: '单',
  press: '推举',
  preacher: '牧师凳',
  pulldown: '下拉',
  pullover: '直臂下拉',
  raise: '平举',
  rear: '后',
  reverse: '反向',
  row: '划船',
  seated: '坐姿',
  single: '单侧',
  smith: '史密斯',
  squat: '深蹲',
  standing: '站姿',
  tricep: '三头',
  triceps: '三头',
  supported: '支撑',
  twist: '转体',
  weighted: '负重',
  wide: '宽距'
}

const NOISE_WORDS = new Set(['v', 'variation', 'male', 'female', 'pov', 'classic', 'style', 'exercise'])

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCase(name: string) {
  return name.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function translateExerciseName(name: string) {
  const normalized = normalizeName(name)
  if (!normalized) return ''
  if (PHRASE_MAP[normalized]) return PHRASE_MAP[normalized]

  let translated = normalized
  Object.entries(PHRASE_MAP)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([source, target]) => {
      translated = translated.replace(new RegExp(`\\b${source}\\b`, 'g'), target)
    })

  const parts = translated
    .split(' ')
    .filter((part) => !NOISE_WORDS.has(part.replace(/\./g, '')))
    .map((part) => WORD_MAP[part] || part)
  const result = parts.join('').trim()
  const translatedCount = parts.filter((part) => /[\u4e00-\u9fa5]/.test(part)).length
  const confidence = translatedCount / Math.max(parts.length, 1)
  return confidence >= 0.75 && /[\u4e00-\u9fa5]/.test(result) ? result : titleCase(name)
}

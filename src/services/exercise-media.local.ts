const LOCAL_GIF_MAP: Record<string, string> = {
  '0CXGHya': '/exercise-assets/static/exercises/0CXGHya.gif',
  '1TkiAFK': '/exercise-assets/static/exercises/1TkiAFK.gif',
  '4f8RXP8': '/exercise-assets/static/exercises/4f8RXP8.gif'
}

export function resolveExerciseGif(exerciseId: string, remoteUrl = '') {
  return LOCAL_GIF_MAP[exerciseId] || remoteUrl
}

export function hasLocalExerciseGif(exerciseId: string) {
  return Boolean(LOCAL_GIF_MAP[exerciseId])
}

export function hasExerciseGif(exerciseId: string, remoteUrl = '') {
  return Boolean(resolveExerciseGif(exerciseId, remoteUrl))
}

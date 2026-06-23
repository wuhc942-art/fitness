export const backupStorageKeys = [
  'fitness_training_records',
  'fitness_training_templates',
  'fitness_training_plans',
  'fitness_body_data_records',
  'fitness_body_profile',
  'fitness_diet_records',
  'fitness_local_reminder_settings',
  'fitness_missed_plan_reminder_last_shown',
  'fitness_user_profile'
] as const

export type BackupStorageKey = typeof backupStorageKeys[number]

export interface BackupPreviewItem {
  key: BackupStorageKey
  label: string
  count: number
}

export const backupKeyLabels: Record<BackupStorageKey, string> = {
  fitness_training_records: '训练记录',
  fitness_training_templates: '训练模板',
  fitness_training_plans: '训练计划',
  fitness_body_data_records: '身体数据',
  fitness_body_profile: '身体档案',
  fitness_diet_records: '饮食记录',
  fitness_local_reminder_settings: '提醒设置',
  fitness_missed_plan_reminder_last_shown: '提醒状态',
  fitness_user_profile: '用户档案'
}

export const arrayBackupKeys = new Set<BackupStorageKey>([
  'fitness_training_records',
  'fitness_training_templates',
  'fitness_training_plans',
  'fitness_body_data_records',
  'fitness_diet_records'
])

export function readBackupStorage(getStorageSync: (key: string) => any) {
  const data: Record<string, any> = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  }

  backupStorageKeys.forEach((key) => {
    try {
      const raw = getStorageSync(key)
      data[key] = typeof raw === 'string' ? JSON.parse(raw || 'null') : raw
    } catch {
      data[key] = getStorageSync(key)
    }
  })

  return data
}

export function buildBackupPreview(data: Record<string, any>, keys: string[]): BackupPreviewItem[] {
  return keys
    .filter((key): key is BackupStorageKey => backupStorageKeys.includes(key as BackupStorageKey))
    .map((key) => {
      const value = data[key]
      const count = Array.isArray(value) ? value.length : value == null || value === '' ? 0 : 1
      return {
        key,
        label: backupKeyLabels[key],
        count
      }
    })
}

export function formatBackupPreview(items: BackupPreviewItem[], maxRows = 6) {
  const rows = items.slice(0, maxRows).map((item) => `${item.label}：${item.count}`)
  const remaining = items.length - rows.length
  if (remaining > 0) rows.push(`另外 ${remaining} 类数据`)
  return rows.join('\n')
}

export function createBackupFileName(prefix = 'fitai-backup', now = Date.now()) {
  return `${prefix}-${now}.json`
}

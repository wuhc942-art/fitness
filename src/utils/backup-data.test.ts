import { buildBackupPreview, createBackupFileName, formatBackupPreview, readBackupStorage } from './backup-data'

const storage: Record<string, any> = {
  fitness_training_records: JSON.stringify([{ _id: 'record_1' }, { _id: 'record_2' }]),
  fitness_training_templates: [{ _id: 'template_1' }],
  fitness_body_profile: { goal: 'muscle' },
  fitness_diet_records: 'not-json'
}

const backup = readBackupStorage((key) => storage[key])

if (!Array.isArray(backup.fitness_training_records) || backup.fitness_training_records.length !== 2) {
  throw new Error('readBackupStorage should parse JSON array storage values')
}

if (!Array.isArray(backup.fitness_training_templates) || backup.fitness_training_templates.length !== 1) {
  throw new Error('readBackupStorage should preserve non-string storage values')
}

if (backup.fitness_diet_records !== 'not-json') {
  throw new Error('readBackupStorage should preserve invalid JSON as raw storage value')
}

const preview = buildBackupPreview(backup, [
  'fitness_training_records',
  'fitness_training_templates',
  'fitness_body_profile',
  'unknown_key'
])

if (preview.length !== 3) throw new Error('buildBackupPreview should ignore unknown keys')
if (preview[0].label !== '训练记录' || preview[0].count !== 2) throw new Error('buildBackupPreview should count array data')
if (preview[2].label !== '身体档案' || preview[2].count !== 1) throw new Error('buildBackupPreview should count object data as one item')

const formatted = formatBackupPreview(preview, 2)
if (!formatted.includes('训练记录：2')) throw new Error('formatBackupPreview should include preview labels and counts')
if (!formatted.includes('另外 1 类数据')) throw new Error('formatBackupPreview should summarize hidden rows')

if (createBackupFileName('fitai-before-import', 123) !== 'fitai-before-import-123.json') {
  throw new Error('createBackupFileName should produce deterministic backup names')
}

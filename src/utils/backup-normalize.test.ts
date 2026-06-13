import { normalizeBackupDataForImport } from './backup-normalize'

const backup = normalizeBackupDataForImport({
  version: '1.0.0',
  exportedAt: '2026-06-12T00:00:00.000Z',
  fitness_training_records: [
    { _id: 'record_1', date: '2026-06-01', bodyPart: 'chest', duration: 45, location: 'gym', actions: [], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' }
  ],
  fitness_training_templates: [
    { _id: 'a', name: '上肢', actions: [], createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' }
  ],
  fitness_training_plans: [
    {
      _id: 'plan_1',
      name: '恢复测试计划',
      startDate: '2026-06-01',
      endDate: '2026-06-14',
      weekDuration: 2,
      weeklyFrequency: 2,
      status: 'active',
      progress: {
        currentWeek: 1,
        completedSessions: 99,
        totalSessions: 99,
        completionRate: 100,
        nextSession: { date: '2026-06-20', dayOfWeek: 6, templateName: '错误日程', templateId: 'wrong' }
      },
      weeklySchedules: [
        {
          weekNumber: 1,
          weekStart: '2026-06-01',
          weekEnd: '2026-06-07',
          completedSessions: 99,
          totalSessions: 99,
          dailySchedules: [
            { dayOfWeek: 1, date: '2026-06-01', templateId: 'a', templateName: '上肢', completed: true, recordId: 'record_1' },
            { dayOfWeek: 3, date: '2026-06-03', templateId: 'b', templateName: '下肢', completed: false }
          ]
        },
        {
          weekNumber: 2,
          weekStart: '2026-06-08',
          weekEnd: '2026-06-14',
          completedSessions: 0,
          totalSessions: 0,
          dailySchedules: [
            { dayOfWeek: 1, date: '2026-06-08', templateId: 'a', templateName: '上肢', completed: true, recordId: 'missing_record' }
          ]
        }
      ],
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z'
    }
  ]
}, '2026-06-02')

const plan = backup.fitness_training_plans[0]

if (plan.weeklySchedules[0].completedSessions !== 1) throw new Error('normalizeBackupDataForImport should repair weekly completedSessions')
if (plan.weeklySchedules[0].totalSessions !== 2) throw new Error('normalizeBackupDataForImport should repair weekly totalSessions')
if (plan.progress.completedSessions !== 1) throw new Error('normalizeBackupDataForImport should repair progress completedSessions')
if (plan.progress.totalSessions !== 3) throw new Error('normalizeBackupDataForImport should repair progress totalSessions')
if (plan.progress.completionRate !== 33) throw new Error('normalizeBackupDataForImport should repair completionRate')
if (plan.progress.nextSession?.date !== '2026-06-03') throw new Error('normalizeBackupDataForImport should repair nextSession')
if (plan.weeklySchedules[1].dailySchedules[0].completed) throw new Error('normalizeBackupDataForImport should unmark sessions linked to missing records')
if (plan.weeklySchedules[1].dailySchedules[0].recordId) throw new Error('normalizeBackupDataForImport should clear missing record links')
if (plan.weeklySchedules[0].dailySchedules[1].templateId) throw new Error('normalizeBackupDataForImport should clear missing template links')
if (!plan.weeklySchedules[0].dailySchedules[1].templateName.includes('模板已删除')) throw new Error('normalizeBackupDataForImport should label missing templates')

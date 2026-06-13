import { normalizeUsingTemplatePayload } from './training-transfer'

const good = normalizeUsingTemplatePayload({
  templateId: 'template_1',
  templateName: '胸背训练',
  actions: ['卧推', { name: '高位下拉' }, '', { name: '  坐姿划船  ' }]
})

if (good.actions.length !== 3) throw new Error('normalizeUsingTemplatePayload should keep valid action names')
if (good.actions[0] !== '卧推') throw new Error('normalizeUsingTemplatePayload should keep string action names')
if (good.actions[1] !== '高位下拉') throw new Error('normalizeUsingTemplatePayload should read object action names')
if (good.actions[2] !== '坐姿划船') throw new Error('normalizeUsingTemplatePayload should trim object action names')

const badRoot = normalizeUsingTemplatePayload('not-json-object')
if (badRoot.actions.length !== 0) throw new Error('normalizeUsingTemplatePayload should reject non-object payloads')

const badActions = normalizeUsingTemplatePayload({ templateName: '坏模板', actions: '卧推' })
if (badActions.actions.length !== 0) throw new Error('normalizeUsingTemplatePayload should reject non-array actions')

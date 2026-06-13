export interface UsingTemplatePayload {
  templateId?: string
  templateName?: string
  actions: string[]
}

function normalizeActionName(input: unknown): string {
  if (typeof input === 'string') return input.trim()
  if (input && typeof input === 'object' && 'name' in input) return String((input as { name?: unknown }).name || '').trim()
  return ''
}

export function normalizeUsingTemplatePayload(payload: unknown): UsingTemplatePayload {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { actions: [] }
  }

  const raw = payload as { templateId?: unknown; templateName?: unknown; actions?: unknown }
  if (!Array.isArray(raw.actions)) {
    return {
      templateId: typeof raw.templateId === 'string' ? raw.templateId : undefined,
      templateName: typeof raw.templateName === 'string' ? raw.templateName : undefined,
      actions: []
    }
  }

  return {
    templateId: typeof raw.templateId === 'string' ? raw.templateId : undefined,
    templateName: typeof raw.templateName === 'string' ? raw.templateName : undefined,
    actions: raw.actions.map(normalizeActionName).filter(Boolean)
  }
}

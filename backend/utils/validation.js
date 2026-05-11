export const normalizeString = (value, maxLength = 500) => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

export const isValidObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''))

export const parsePositiveInteger = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const parseDate = (value) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const validateMeetingPayload = (payload = {}) => {
  const title = normalizeString(payload.title, 160)
  const description = normalizeString(payload.description || '', 2000)
  const date = parseDate(payload.date)
  const participants = parsePositiveInteger(payload.participants, 1)

  if (!title) {
    return { ok: false, message: 'Meeting title is required' }
  }

  if (!date) {
    return { ok: false, message: 'A valid meeting date is required' }
  }

  return {
    ok: true,
    value: { title, description, date, participants }
  }
}

export const validateActionItemPayload = (payload = {}) => {
  const task = normalizeString(payload.task, 500)
  const assignedTo = normalizeString(payload.assignedTo, 120)
  const deadline = payload.deadline ? parseDate(payload.deadline) : null

  if (!task) {
    return { ok: false, message: 'Task is required' }
  }

  if (!assignedTo) {
    return { ok: false, message: 'Assignee is required' }
  }

  if (payload.deadline && !deadline) {
    return { ok: false, message: 'Deadline must be a valid date' }
  }

  return {
    ok: true,
    value: {
      task,
      assignedTo,
      ...(deadline ? { deadline } : {}),
      ...(payload.meetingId ? { meetingId: payload.meetingId } : {})
    }
  }
}

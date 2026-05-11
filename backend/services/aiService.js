const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const XAI_API_KEY = process.env.XAI_API_KEY || process.env.GROK_API_KEY
const WHISPER_MODEL = process.env.OPENAI_WHISPER_MODEL || 'whisper-1'
const SUMMARY_MODEL = process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini'
const XAI_SUMMARY_MODEL = process.env.XAI_SUMMARY_MODEL || process.env.GROK_SUMMARY_MODEL || 'grok-4'

const mockTranscript = [
  { speaker: 'Speaker 1', text: 'Good morning everyone. Let\'s start with the Q1 planning.', timestamp: '00:00' },
  { speaker: 'Speaker 2', text: 'I agree. Let\'s focus on three main areas this quarter.', timestamp: '00:15' }
]

const cleanBase64 = (value = '') => value.replace(/^data:.*;base64,/, '')

const transcriptToText = (transcript = []) => {
  return transcript
    .map((segment) => `${segment.speaker || 'Speaker'}: ${segment.text || ''}`.trim())
    .filter(Boolean)
    .join('\n')
}

const buildSegmentTimestamps = (count) => {
  return Array.from({ length: count }, (_, index) => {
    const minutes = String(Math.floor(index / 4) * 5).padStart(2, '0')
    const seconds = String((index % 4) * 15).padStart(2, '0')
    return `${minutes}:${seconds}`
  })
}

const splitTranscriptText = (text, speakerNames = []) => {
  const sentences = String(text || '')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  if (sentences.length === 0) {
    return mockTranscript
  }

  const timestamps = buildSegmentTimestamps(sentences.length)
  const speakers = speakerNames.length > 0 ? speakerNames : ['Speaker 1', 'Speaker 2']

  return sentences.map((sentence, index) => ({
    speaker: speakers[index % speakers.length] || `Speaker ${index + 1}`,
    text: sentence,
    timestamp: timestamps[index]
  }))
}

const summarizeTranscriptLocally = (transcript = []) => {
  const text = transcriptToText(transcript)
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  const overview = sentences.slice(0, 2).join(' ')
    || 'The meeting discussed key updates, next steps, and action items.'

  const importantPoints = sentences.slice(0, 4).map((sentence) => sentence.replace(/^Speaker \d+:\s*/i, ''))
  const decisions = sentences
    .filter((sentence) => /decid|agree|approve|will|next step|action/i.test(sentence))
    .slice(0, 4)
    .map((sentence) => sentence.replace(/^Speaker \d+:\s*/i, ''))

  return {
    summary: overview,
    importantPoints: importantPoints.length > 0 ? importantPoints : ['Key discussion captured from the meeting transcript.'],
    decisions: decisions.length > 0 ? decisions : ['Follow-up actions should be tracked from the transcript.'],
    actionItems: extractActionItemsLocally(transcript),
    entities: extractEntitiesLocally(text),
    topics: extractTopicsLocally(text)
  }
}

const extractActionItemsLocally = (transcript = []) => {
  const taskPatterns = [
    /\b(?:can you|please|need to|needs to|will|should|must|follow up|schedule|coordinate|send|review|create|finish|prepare|update|implement)\b/i,
    /\b(?:by|before|deadline|due|next week|tomorrow|this week|end of)\b/i
  ]

  return transcript
    .filter((segment) => taskPatterns.some((pattern) => pattern.test(segment.text || '')))
    .slice(0, 8)
    .map((segment) => ({
      task: (segment.text || '').replace(/^\s+|\s+$/g, ''),
      assignedTo: inferAssignee(segment.text, segment.speaker),
      deadline: inferDeadline(segment.text),
      confidence: 0.55,
      source: 'ai'
    }))
}

const inferAssignee = (text = '', speaker = 'Team') => {
  const explicit = text.match(/\b([A-Z][a-z]+)\s*,?\s+(?:can you|please|will|should|needs? to)\b/)
  return explicit?.[1] || speaker?.replace(/^Speaker\s+\d+\s*\((.*)\)$/i, '$1') || 'Team'
}

const inferDeadline = (text = '') => {
  const now = new Date()
  const lower = text.toLowerCase()

  if (lower.includes('tomorrow')) {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }

  if (lower.includes('next week') || lower.includes('this week')) {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  }

  const dateMatch = text.match(/\b(?:by|due|deadline(?: of)?|before)\s+([A-Z][a-z]+\s+\d{1,2}|\d{4}-\d{2}-\d{2})/i)
  if (dateMatch) {
    const parsed = new Date(dateMatch[1])
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
}

const extractEntitiesLocally = (text = '') => {
  const entities = []
  const people = new Set(text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || [])
  people.forEach((name) => {
    if (!['Speaker', 'Meeting', 'Team'].includes(name)) {
      entities.push({ text: name, type: 'PERSON_OR_TOPIC' })
    }
  })

  return entities.slice(0, 12)
}

const extractTopicsLocally = (text = '') => {
  const candidates = [
    'roadmap', 'launch', 'customer support', 'analytics', 'design', 'budget',
    'api', 'performance', 'hiring', 'sales', 'security', 'quality'
  ]

  return candidates.filter((topic) => text.toLowerCase().includes(topic)).slice(0, 8)
}

const transcribeWithOpenAI = async ({ audioBase64, audioMimeType, audioFileName }) => {
  const buffer = Buffer.from(cleanBase64(audioBase64), 'base64')
  const formData = new FormData()
  formData.append('file', new Blob([buffer], { type: audioMimeType || 'audio/webm' }), audioFileName || 'meeting-recording.webm')
  formData.append('model', WHISPER_MODEL)
  formData.append('response_format', 'json')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: formData
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI transcription failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.text || ''
}

const buildInsightsPrompt = (transcript) => [
    'Analyze this meeting transcript for a collaborative meeting workspace.',
    'Return strict JSON with keys: summary, importantPoints, decisions, actionItems, entities, topics.',
    'actionItems must be an array of { task, assignedTo, deadline, confidence }, where deadline is ISO date when inferable.',
    'entities must be an array of { text, type }.',
    transcriptToText(transcript)
  ].join('\n\n')

const normalizeInsights = (parsed = {}) => ({
  summary: parsed.summary || 'Meeting summary unavailable.',
  importantPoints: Array.isArray(parsed.importantPoints) ? parsed.importantPoints : [],
  decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
  actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
  entities: Array.isArray(parsed.entities) ? parsed.entities : [],
  topics: Array.isArray(parsed.topics) ? parsed.topics : []
})

const generateSummaryWithOpenAI = async (transcript) => {
  const prompt = buildInsightsPrompt(transcript)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: SUMMARY_MODEL,
      messages: [
        { role: 'system', content: 'You summarize meeting transcripts and extract decisions as JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI summary failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}')

  return normalizeInsights(parsed)
}

const generateSummaryWithXAI = async (transcript) => {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${XAI_API_KEY}`
    },
    body: JSON.stringify({
      model: XAI_SUMMARY_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You extract meeting intelligence as valid JSON only. Do not include markdown.'
        },
        {
          role: 'user',
          content: buildInsightsPrompt(transcript)
        }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`xAI Grok summary failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}')

  return normalizeInsights(parsed)
}

export const aiService = {
  generateTranscript: async (audioInput = {}) => {
    const normalizedInput = typeof audioInput === 'string' ? { audioBase64: audioInput } : audioInput || {}

    if (OPENAI_API_KEY && normalizedInput.audioBase64) {
      try {
        const transcriptionText = await transcribeWithOpenAI(normalizedInput)
        const speakerNames = Array.isArray(normalizedInput.speakerNames) ? normalizedInput.speakerNames : []
        return splitTranscriptText(transcriptionText, speakerNames)
      } catch (error) {
        console.error('OpenAI transcription failed, falling back to mock transcript:', error)
      }
    }

    if (XAI_API_KEY && normalizedInput.audioBase64 && !OPENAI_API_KEY) {
      console.warn('Grok/xAI key is configured, but xAI chat models do not provide audio transcription for this workflow. Set OPENAI_API_KEY or provide transcriptText for real audio-to-text.')
    }

    if (normalizedInput.transcriptText) {
      return splitTranscriptText(normalizedInput.transcriptText, normalizedInput.speakerNames || [])
    }

    console.log('Generating mock transcript for:', normalizedInput.audioFileName || 'audio recording')
    return mockTranscript
  },

  generateSummary: async (transcript) => {
    console.log('Generating summary from transcript')

    const result = await aiService.generateMeetingInsights(transcript)
    return result.summary
  },

  extractActionItems: async (transcript) => {
    console.log('Extracting action items from transcript')

    const result = await aiService.generateMeetingInsights(transcript)
    return {
      importantPoints: result.importantPoints,
      decisions: result.decisions,
      actionItems: result.actionItems
    }
  },

  generateMeetingInsights: async (transcript) => {
    if (XAI_API_KEY && Array.isArray(transcript) && transcript.length > 0) {
      try {
        const result = await generateSummaryWithXAI(transcript)
        return {
          summary: result.summary,
          importantPoints: result.importantPoints,
          decisions: result.decisions,
          actionItems: result.actionItems,
          entities: result.entities,
          topics: result.topics
        }
      } catch (error) {
        console.error('xAI Grok insight extraction failed, trying OpenAI/local fallback:', error)
      }
    }

    if (OPENAI_API_KEY && Array.isArray(transcript) && transcript.length > 0) {
      try {
        const result = await generateSummaryWithOpenAI(transcript)
        return {
          summary: result.summary,
          importantPoints: result.importantPoints,
          decisions: result.decisions,
          actionItems: result.actionItems,
          entities: result.entities,
          topics: result.topics
        }
      } catch (error) {
        console.error('OpenAI action item extraction failed, falling back to local summary:', error)
      }
    }

    return summarizeTranscriptLocally(transcript)
  },

  extractImportantPoints: async (transcript) => {
    console.log('Extracting important points')
    const fallback = summarizeTranscriptLocally(transcript)
    return fallback.importantPoints
  }
}

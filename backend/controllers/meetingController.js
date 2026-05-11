import Meeting from '../models/Meeting.js'
import ActionItem from '../models/ActionItem.js'
import ChatMessage from '../models/ChatMessage.js'
import { aiService } from '../services/aiService.js'
import { isValidObjectId, normalizeString, parseDate, parsePositiveInteger, validateMeetingPayload } from '../utils/validation.js'

// Get all meetings
export const getAllMeetings = async (req, res) => {
  try {
    const { q, status } = req.query
    const query = { userId: req.user._id }

    if (status && status !== 'all') {
      query.aiStatus = status
    }

    if (q && q.trim()) {
      query.$text = { $search: q.trim() }
    }

    const meetings = await Meeting.find(query).sort({ createdAt: -1 }).limit(100)
    
    res.json({
      success: true,
      data: meetings,
      count: meetings.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meetings',
      error: error.message
    })
  }
}

// Create meeting
export const createMeeting = async (req, res) => {
  try {
    const validation = validateMeetingPayload(req.body)
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message
      })
    }

    const newMeeting = new Meeting({
      ...validation.value,
      userId: req.user._id
    })

    await newMeeting.save()

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: newMeeting
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create meeting',
      error: error.message
    })
  }
}

// Get meeting by ID
export const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting id' })
    }

    const meeting = await Meeting.findOne({ _id: id, userId: req.user._id })

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      })
    }

    res.json({
      success: true,
      data: meeting
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting',
      error: error.message
    })
  }
}

export const getPublicMeetingById = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting id' })
    }

    const meeting = await Meeting.findById(id).select('title description date participants aiStatus createdAt')

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      })
    }

    res.json({
      success: true,
      data: meeting
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public meeting',
      error: error.message
    })
  }
}

export const getPublicMeetingMessages = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting id' })
    }

    const meeting = await Meeting.exists({ _id: id })

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      })
    }

    const messages = await ChatMessage.find({ meetingId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    res.json({
      success: true,
      data: messages.reverse()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting chat',
      error: error.message
    })
  }
}

// Generate AI insights (transcript, summary, action items)
export const generateAI = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting id' })
    }

    const { audioBase64, audioMimeType, audioFileName, transcriptText, speakerNames } = req.body || {}

    if (!audioBase64 && !req.body.audioData && !transcriptText) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      })
    }

    // Find the meeting
    const meeting = await Meeting.findOne({ _id: id, userId: req.user._id })
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      })
    }

    meeting.aiStatus = 'processing'
    meeting.aiError = undefined
    await meeting.save()

    const transcript = await aiService.generateTranscript({
      audioBase64: audioBase64 || req.body.audioData,
      audioMimeType,
      audioFileName,
      transcriptText,
      speakerNames: speakerNames || []
    })

    // Generate meeting insights using AI service
    const insights = await aiService.generateMeetingInsights(transcript)
    const { summary, importantPoints, decisions, actionItems = [], entities = [], topics = [] } = insights

    meeting.transcript = transcript
    meeting.summary = summary
    meeting.importantPoints = importantPoints
    meeting.decisions = decisions
    meeting.entities = entities
    meeting.topics = topics
    meeting.aiStatus = 'processed'
    meeting.audioFileName = audioFileName || 'audio-recording'

    await meeting.save()

    let persistedActionItems = []
    if (Array.isArray(actionItems) && actionItems.length > 0) {
      await ActionItem.deleteMany({ meetingId: meeting._id, userId: req.user._id, source: 'ai' })
      persistedActionItems = await ActionItem.insertMany(actionItems.slice(0, 10).map((item) => ({
        task: String(item.task || '').trim(),
        assignedTo: item.assignedTo || 'Team',
        deadline: item.deadline ? new Date(item.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        meetingId: meeting._id,
        userId: req.user._id,
        source: 'ai',
        confidence: typeof item.confidence === 'number' ? item.confidence : 0.65
      })).filter((item) => item.task))
    }

    res.json({
      success: true,
      message: 'AI processing completed',
      data: {
        transcript,
        summary,
        importantPoints,
        decisions,
        actionItems: persistedActionItems,
        entities,
        topics
      }
    })
  } catch (error) {
    if (req.params?.id && req.user?._id) {
      await Meeting.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { aiStatus: 'failed', aiError: error.message }
      )
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate AI insights',
      error: error.message
    })
  }
}

// Update meeting
export const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params
    const { title, date, participants, description } = req.body
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting id' })
    }

    const parsedDate = date !== undefined ? parseDate(date) : undefined
    if (date !== undefined && !parsedDate) {
      return res.status(400).json({ success: false, message: 'A valid meeting date is required' })
    }

    const updateData = {
      ...(title !== undefined ? { title: normalizeString(title, 160) } : {}),
      ...(parsedDate !== undefined ? { date: parsedDate } : {}),
      ...(participants !== undefined ? { participants: parsePositiveInteger(participants, 1) } : {}),
      ...(description !== undefined ? { description: normalizeString(description, 2000) } : {})
    }

    const meeting = await Meeting.findOneAndUpdate({ _id: id, userId: req.user._id }, updateData, { new: true })

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      })
    }

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      data: meeting
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update meeting',
      error: error.message
    })
  }
}

// Delete meeting
export const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting id' })
    }

    const meeting = await Meeting.findOneAndDelete({ _id: id, userId: req.user._id })

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      })
    }

    res.json({
      success: true,
      message: 'Meeting deleted successfully',
      data: meeting
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete meeting',
      error: error.message
    })
  }
}

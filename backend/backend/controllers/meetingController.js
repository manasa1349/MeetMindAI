import Meeting from '../models/Meeting.js'
import { aiService } from '../services/aiService.js'

// Get all meetings
export const getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ createdAt: -1 })
    
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
    const { title, date, participants, description } = req.body

    const newMeeting = new Meeting({
      title,
      date,
      participants,
      description
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

    const meeting = await Meeting.findById(id)

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

// Generate AI insights (transcript, summary, action items)
export const generateAI = async (req, res) => {
  try {
    const { id } = req.params
    const audioFile = req.file

    if (!audioFile && !req.body.audioData) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      })
    }

    // Find the meeting
    const meeting = await Meeting.findById(id)
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      })
    }

    // Generate transcript using AI service
    const transcript = await aiService.generateTranscript(audioFile)

    // Generate summary using AI service
    const summary = await aiService.generateSummary(transcript)

    // Extract action items using AI service
    const { importantPoints, decisions } = await aiService.extractActionItems(transcript)

    // Update meeting with AI-generated data
    meeting.transcript = transcript
    meeting.summary = summary
    meeting.importantPoints = importantPoints
    meeting.decisions = decisions
    meeting.audioFileName = audioFile?.originalname || 'audio-recording'

    await meeting.save()

    res.json({
      success: true,
      message: 'AI processing completed',
      data: {
        transcript,
        summary,
        importantPoints,
        decisions
      }
    })
  } catch (error) {
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
    const updateData = req.body

    const meeting = await Meeting.findByIdAndUpdate(id, updateData, { new: true })

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

    const meeting = await Meeting.findByIdAndDelete(id)

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
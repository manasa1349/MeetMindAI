import express from 'express'
import {
  getAllMeetings,
  createMeeting,
  getMeetingById,
  getPublicMeetingById,
  getPublicMeetingMessages,
  generateAI,
  updateMeeting,
  deleteMeeting
} from '../controllers/meetingController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', requireAuth, getAllMeetings)
router.get('/public/:id', getPublicMeetingById)
router.get('/public/:id/messages', getPublicMeetingMessages)
router.get('/:id', requireAuth, getMeetingById)

// Protected routes
router.post('/', requireAuth, createMeeting)
router.post('/:id/generate-ai', requireAuth, generateAI)
router.put('/:id', requireAuth, updateMeeting)
router.delete('/:id', requireAuth, deleteMeeting)

export default router

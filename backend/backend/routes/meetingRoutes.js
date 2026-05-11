import express from 'express'
import {
  getAllMeetings,
  createMeeting,
  getMeetingById,
  generateAI,
  updateMeeting,
  deleteMeeting
} from '../controllers/meetingController.js'

const router = express.Router()

router.get('/', getAllMeetings)
router.post('/', createMeeting)
router.get('/:id', getMeetingById)
router.post('/:id/generate-ai', generateAI)
router.put('/:id', updateMeeting)
router.delete('/:id', deleteMeeting)

export default router
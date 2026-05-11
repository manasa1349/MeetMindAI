import express from 'express'
import {
  getAllActionItems,
  createActionItem,
  updateActionItem,
  deleteActionItem
} from '../controllers/actionItemController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', requireAuth, getAllActionItems)

// Protected mutating routes
router.post('/', requireAuth, createActionItem)
router.put('/:id', requireAuth, updateActionItem)
router.delete('/:id', requireAuth, deleteActionItem)

export default router

import express from 'express'
import {
  getAllActionItems,
  createActionItem,
  updateActionItem,
  deleteActionItem
} from '../controllers/actionItemController.js'

const router = express.Router()

router.get('/', getAllActionItems)
router.post('/', createActionItem)
router.put('/:id', updateActionItem)
router.delete('/:id', deleteActionItem)

export default router
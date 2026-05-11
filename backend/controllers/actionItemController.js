import ActionItem from '../models/ActionItem.js'
import { isValidObjectId, validateActionItemPayload } from '../utils/validation.js'

// Get all action items
export const getAllActionItems = async (req, res) => {
  try {
    const { meetingId, status, q } = req.query
    let query = { userId: req.user._id }

    if (meetingId) {
      query.meetingId = meetingId
    }
    if (status && status !== 'all') {
      query.status = status
    }
    if (q && q.trim()) {
      query.$text = { $search: q.trim() }
    }

    const actionItems = await ActionItem.find(query).sort({ deadline: 1, createdAt: -1 }).limit(200)

    res.json({
      success: true,
      data: actionItems,
      count: actionItems.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch action items',
      error: error.message
    })
  }
}

// Create action item
export const createActionItem = async (req, res) => {
  try {
    const { task, assignedTo, deadline, meetingId } = req.body
    const validation = validateActionItemPayload({ task, assignedTo, deadline, meetingId })
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message
      })
    }

    const newActionItem = new ActionItem({
      ...validation.value,
      userId: req.user._id
    })

    await newActionItem.save()

    res.status(201).json({
      success: true,
      message: 'Action item created successfully',
      data: newActionItem
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create action item',
      error: error.message
    })
  }
}

// Update action item
export const updateActionItem = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid action item id' })
    }

    const allowedFields = ['task', 'assignedTo', 'deadline', 'status']
    const updateData = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    )

    const actionItem = await ActionItem.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updateData,
      { new: true }
    )

    if (!actionItem) {
      console.log(`Action item not found: ${id}`)
      return res.status(404).json({
        success: false,
        message: 'Action item not found'
      })
    }

    res.json({
      success: true,
      message: 'Action item updated successfully',
      data: actionItem
    })
  } catch (error) {
    console.error('Update action item error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update action item',
      error: error.message
    })
  }
}

// Delete action item
export const deleteActionItem = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid action item id' })
    }

    const actionItem = await ActionItem.findOneAndDelete({ _id: id, userId: req.user._id })

    if (!actionItem) {
      return res.status(404).json({
        success: false,
        message: 'Action item not found'
      })
    }

    res.json({
      success: true,
      message: 'Action item deleted successfully',
      data: actionItem
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete action item',
      error: error.message
    })
  }
}

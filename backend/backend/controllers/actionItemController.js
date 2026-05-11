import ActionItem from '../models/ActionItem.js'

// Get all action items
export const getAllActionItems = async (req, res) => {
  try {
    const { meetingId } = req.query
    let query = {}

    if (meetingId) {
      query.meetingId = meetingId
    }

    const actionItems = await ActionItem.find(query).sort({ deadline: 1 })

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

    const newActionItem = new ActionItem({
      task,
      assignedTo,
      deadline,
      meetingId
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
    const updateData = req.body

    const actionItem = await ActionItem.findByIdAndUpdate(id, updateData, { new: true })

    if (!actionItem) {
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

    const actionItem = await ActionItem.findByIdAndDelete(id)

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
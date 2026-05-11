import mongoose from 'mongoose'

const actionItemSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  assignedTo: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  source: {
    type: String,
    enum: ['manual', 'ai'],
    default: 'manual'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

actionItemSchema.index({ userId: 1, status: 1, deadline: 1 })
actionItemSchema.index({ meetingId: 1, createdAt: -1 })
actionItemSchema.index({ task: 'text', assignedTo: 'text' })

const ActionItem = mongoose.model('ActionItem', actionItemSchema)
export default ActionItem

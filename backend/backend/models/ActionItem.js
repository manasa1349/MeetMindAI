import mongoose from 'mongoose'

const actionItemSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true
  },
  assignedTo: {
    type: String,
    required: true
  },
  deadline: {
    type: Date,
    required: true
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
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const ActionItem = mongoose.model('ActionItem', actionItemSchema)
export default ActionItem
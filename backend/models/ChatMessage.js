import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
})

chatMessageSchema.index({ meetingId: 1, createdAt: -1 })

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema)
export default ChatMessage

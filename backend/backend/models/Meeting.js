import mongoose from 'mongoose'

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  participants: {
    type: Number,
    default: 1
  },
  description: {
    type: String
  },
  audioFileName: {
    type: String
  },
  transcript: [{
    speaker: String,
    text: String,
    timestamp: String
  }],
  summary: {
    type: String
  },
  importantPoints: [String],
  decisions: [String],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Meeting = mongoose.model('Meeting', meetingSchema)
export default Meeting
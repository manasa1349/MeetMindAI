import mongoose from 'mongoose'

const transcriptSegmentSchema = new mongoose.Schema({
  speaker: String,
  text: String,
  timestamp: String,
  startSeconds: Number,
  endSeconds: Number
}, { _id: false })

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
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
    type: String,
    trim: true,
    maxlength: 2000
  },
  audioFileName: {
    type: String
  },
  transcript: [transcriptSegmentSchema],
  summary: {
    type: String
  },
  importantPoints: [String],
  decisions: [String],
  entities: [{
    text: String,
    type: String
  }],
  topics: [String],
  aiStatus: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'failed'],
    default: 'pending'
  },
  aiError: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

meetingSchema.index({ userId: 1, createdAt: -1 })
meetingSchema.index({ userId: 1, date: -1 })
meetingSchema.index({ title: 'text', description: 'text', summary: 'text', 'transcript.text': 'text' })

const Meeting = mongoose.model('Meeting', meetingSchema)
export default Meeting

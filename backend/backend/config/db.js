import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGODB_URI || 'mongodb://localhost:27017/meetmind-ai'

    await mongoose.connect(mongoURL)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1)
  }
}

export default connectDB
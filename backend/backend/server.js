import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import meetingRoutes from './routes/meetingRoutes.js'
import actionItemRoutes from './routes/actionItemRoutes.js'

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Connect Database
connectDB()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/meetings', meetingRoutes)
app.use('/api/action-items', actionItemRoutes)

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'MeetMind AI Backend Server is running' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import meetingRoutes from './routes/meetingRoutes.js'
import actionItemRoutes from './routes/actionItemRoutes.js'
import ChatMessage from './models/ChatMessage.js'

dotenv.config()

const app = express()
const configuredOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const allowedOrigins = [
  ...configuredOrigins,
  'http://localhost:5173',
  'http://localhost:2000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
]

const isAllowedDevOrigin = (origin) => {
  if (process.env.NODE_ENV === 'production') {
    return false
  }

  return /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)
    || /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/.test(origin)
    || /^https:\/\/[a-z0-9-]+\.ngrok\.app$/.test(origin)
    || /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/.test(origin)
    || /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin)
    || /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+:\d+$/.test(origin)
}

const corsOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin) || isAllowedDevOrigin(origin)) {
    callback(null, origin || true)
    return
  }

  callback(new Error(`CORS blocked origin: ${origin}`))
}

const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  }
})

const requestBuckets = new Map()
const rateLimit = ({ windowMs = 60_000, max = 120 } = {}) => (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const bucket = requestBuckets.get(key) || { count: 0, resetAt: now + windowMs }

  if (now > bucket.resetAt) {
    bucket.count = 0
    bucket.resetAt = now + windowMs
  }

  bucket.count += 1
  requestBuckets.set(key, bucket)

  if (bucket.count > max) {
    return res.status(429).json({ success: false, message: 'Too many requests. Please slow down.' })
  }

  next()
}

// Middleware
app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json({ limit: '25mb' }))
app.use(rateLimit())

// Connect Database
connectDB()

const getRoomParticipants = (roomId) => {
  const room = io.sockets.adapter.rooms.get(roomId)

  if (!room) {
    return []
  }

  return Array.from(room).map((socketId) => {
    const participantSocket = io.sockets.sockets.get(socketId)
    const participantData = participantSocket?.data || {}

    return {
      id: socketId,
      name: participantData.name || 'Guest',
      role: participantData.role || 'Participant',
      status: participantData.status || 'online',
      cameraOn: participantData.cameraOn ?? true,
      micOn: participantData.micOn ?? true,
      screenSharing: participantData.screenSharing ?? false
    }
  })
}

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, user }) => {
    if (!roomId) {
      return
    }

    socket.data.roomId = roomId
    socket.data.name = user?.name || 'Guest'
    socket.data.role = user?.role || 'Participant'
    socket.data.status = 'online'
    socket.data.cameraOn = true
    socket.data.micOn = true
    socket.data.screenSharing = false

    socket.join(roomId)

    const participants = getRoomParticipants(roomId)

    socket.emit('room-users', {
      roomId,
      participants,
      yourId: socket.id
    })

    socket.to(roomId).emit('user-joined', {
      roomId,
      participant: {
        id: socket.id,
        name: socket.data.name,
        role: socket.data.role,
        status: socket.data.status,
        cameraOn: socket.data.cameraOn,
        micOn: socket.data.micOn,
        screenSharing: socket.data.screenSharing
      }
    })

    socket.to(roomId).emit('room-users', {
      roomId,
      participants: getRoomParticipants(roomId)
    })
  })

  socket.on('signal', ({ to, data }) => {
    if (!to || !data) {
      return
    }

    io.to(to).emit('signal', {
      from: socket.id,
      data,
      roomId: socket.data.roomId,
      participant: {
        id: socket.id,
        name: socket.data.name,
        role: socket.data.role
      }
    })
  })

  socket.on('chat-message', async ({ roomId, text }) => {
    const cleanText = String(text || '').trim()

    if (!roomId || !cleanText) {
      return
    }

    if (cleanText.length > 2000) {
      socket.emit('chat-error', { message: 'Message is too long.' })
      return
    }

    const message = {
      id: `${Date.now()}-${socket.id}`,
      sender: socket.data.name || 'Guest',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    }

    try {
      await ChatMessage.create({
        meetingId: roomId,
        senderName: message.sender,
        text: cleanText
      })
    } catch (error) {
      console.error('Failed to persist chat message:', error.message)
    }

    io.to(roomId).emit('chat-message', message)
  })

  socket.on('media-state', ({ roomId, cameraOn, micOn, screenSharing }) => {
    if (!roomId) {
      return
    }

    socket.data.cameraOn = cameraOn
    socket.data.micOn = micOn
    socket.data.screenSharing = screenSharing

    socket.to(roomId).emit('media-state', {
      participantId: socket.id,
      name: socket.data.name,
      cameraOn,
      micOn,
      screenSharing
    })
  })

  socket.on('leave-room', ({ roomId }) => {
    if (!roomId) {
      return
    }

    socket.leave(roomId)
    socket.to(roomId).emit('user-left', {
      participantId: socket.id,
      name: socket.data.name
    })
    socket.to(roomId).emit('room-users', {
      roomId,
      participants: getRoomParticipants(roomId)
    })
    socket.data.roomId = null
  })

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId
    if (!roomId) {
      return
    }

    socket.to(roomId).emit('user-left', {
      participantId: socket.id,
      name: socket.data.name
    })

    socket.to(roomId).emit('room-users', {
      roomId,
      participants: getRoomParticipants(roomId)
    })
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/meetings', meetingRoutes)
app.use('/api/action-items', actionItemRoutes)

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'MeetMind AI Backend Server is running' })
})

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'meetmind-ai-backend',
    realtime: 'enabled',
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  })
})

const PORT = process.env.PORT || 7000

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Realtime room signaling active`)
  console.log(`CORS enabled for: ${allowedOrigins.join(', ')}`)
})

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import meetingRoutes from './routes/meetingRoutes.js'
import actionItemRoutes from './routes/actionItemRoutes.js'

dotenv.config()

const app = express()
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:2000',
  'http://localhost:5173',
  'http://localhost:2000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
]
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())

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
  console.log(`[Socket] User connected: ${socket.id}`)

  socket.on('join-room', ({ roomId, user }) => {
    if (!roomId) {
      console.warn('[Socket] join-room: Missing roomId')
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
    console.log(`[Socket] User ${socket.data.name} joined room ${roomId}`)

    const participants = getRoomParticipants(roomId)

    // Send current room state to the joining user
    socket.emit('room-users', {
      roomId,
      participants,
      yourId: socket.id
    })

    // Notify others that a new user joined
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

    // Update participant list for all users in room
    socket.to(roomId).emit('room-users', {
      roomId,
      participants: getRoomParticipants(roomId)
    })
  })

  // WebRTC Signaling: Handle SDP offers, answers, and ICE candidates
  socket.on('signal', ({ to, data }) => {
    if (!to || !data) {
      console.warn('[Socket] signal: Missing to or data')
      return
    }

    console.log(`[Socket] Signal from ${socket.id} to ${to}: ${data.type}`)

    // Forward the signal to the target peer
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

  // Handle chat messages
  socket.on('chat-message', ({ roomId, text }) => {
    if (!roomId || !text) {
      console.warn('[Socket] chat-message: Missing roomId or text')
      return
    }

    console.log(`[Socket] Chat from ${socket.data.name} in ${roomId}: ${text}`)

    io.to(roomId).emit('chat-message', {
      id: Date.now(),
      sender: socket.data.name || 'Guest',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })
  })

  // Handle media state changes (camera, microphone, screen share)
  socket.on('media-state', ({ roomId, cameraOn, micOn, screenSharing }) => {
    if (!roomId) {
      console.warn('[Socket] media-state: Missing roomId')
      return
    }

    socket.data.cameraOn = cameraOn
    socket.data.micOn = micOn
    socket.data.screenSharing = screenSharing

    console.log(`[Socket] Media state for ${socket.data.name}: cam=${cameraOn}, mic=${micOn}, screen=${screenSharing}`)

    socket.to(roomId).emit('media-state', {
      participantId: socket.id,
      name: socket.data.name,
      cameraOn,
      micOn,
      screenSharing
    })
  })

  // Handle user leaving room explicitly
  socket.on('leave-room', ({ roomId, user }) => {
    if (!roomId) {
      console.warn('[Socket] leave-room: Missing roomId')
      return
    }

    console.log(`[Socket] User ${socket.data.name} explicitly left room ${roomId}`)

    socket.to(roomId).emit('user-left', {
      participantId: socket.id,
      name: socket.data.name
    })

    socket.leave(roomId)
  })

  // Handle disconnection (network issues, tab closed, etc.)
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId
    if (!roomId) {
      console.log(`[Socket] User ${socket.id} disconnected (not in any room)`)
      return
    }

    console.log(`[Socket] User ${socket.data.name} disconnected from room ${roomId}`)

    socket.to(roomId).emit('user-left', {
      participantId: socket.id,
      name: socket.data.name
    })

    socket.to(roomId).emit('room-users', {
      roomId,
      participants: getRoomParticipants(roomId)
    })
  })

  // Handle errors
  socket.on('error', (error) => {
    console.error(`[Socket] Error for ${socket.id}:`, error)
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

// Start server
const PORT = process.env.PORT || 7000
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📡 Socket.IO server ready for connections`)
  console.log(`🔒 Allowed CORS origins: ${allowedOrigins.join(', ')}`)
})

export default app

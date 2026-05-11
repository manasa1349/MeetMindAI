# 🏗️ MeetMind AI Meeting Room - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER BROWSER (Window 1)                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        React Component: MeetingRoomEnhanced.jsx          │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │ Room Header │  │ Participant  │  │  Live Chat   │   │   │
│  │  │  & Info     │  │    List      │  │    Box       │   │   │
│  │  └─────────────┘  └──────────────┘  └──────────────┘   │   │
│  │                                                          │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│  │  │   Mic/Spk   │  │   Recording  │  │  Join/Leave  │   │   │
│  │  │  Buttons    │  │   Timer      │  │   Buttons    │   │   │
│  │  └─────────────┘  └──────────────┘  └──────────────┘   │   │
│  │                                                          │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │   Analysis Section (Transcript & Summary)         │  │   │
│  │  │   Shows when meeting ends                         │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
│         ┌────────────────┼────────────────┐                      │
│         │                │                │                      │
│    ┌────▼──────┐    ┌────▼──────┐   ┌────▼──────┐               │
│    │ Socket.IO │    │ WebRTC    │   │ Media     │               │
│    │ Client    │    │ Peer      │   │ Recorder  │               │
│    │           │    │ Connection│   │ API       │               │
│    └────┬──────┘    └────┬──────┘   └────┬──────┘               │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          │                │                │
    ┌─────▼────────────────▼────────────────▼──────────────────┐
    │                                                           │
    │              INTERNET / LOCAL NETWORK                    │
    │  (WebSocket for Socket.IO, WebRTC for P2P audio)        │
    │                                                           │
    └─────┬────────────────────────────────────────────────────┘
          │
          │
    ┌─────▼────────────────────────────────────────────────────┐
    │            Socket.IO Server (Port 5000)                  │
    │                                                           │
    │  ┌─────────────────────────────────────────────────────┐ │
    │  │  Room Management:                                  │ │
    │  │  - Track participants in each room                │ │
    │  │  - Store socket metadata (name, mic status, etc)  │ │
    │  │  - Handle join/leave events                       │ │
    │  └─────────────────────────────────────────────────────┘ │
    │                        │                                  │
    │  ┌─────────────────────┼────────────────────────────────┐ │
    │  │ Event Handlers:     │                                │ │
    │  │ ┌───────────────┐  ┌┴─────────────────────────────┐ │ │
    │  │ │ join-room     │  │  Message Relay (broadcast)  │ │ │
    │  │ ├───────────────┤  ├─────────────────────────────┤ │ │
    │  │ │ signal        │  │  WebRTC Signaling           │ │ │
    │  │ ├───────────────┤  ├─────────────────────────────┤ │ │
    │  │ │ chat-message  │  │  Media State Updates        │ │ │
    │  │ ├───────────────┤  ├─────────────────────────────┤ │ │
    │  │ │ media-state   │  │  Disconnect Handling        │ │ │
    │  │ ├───────────────┤  └─────────────────────────────┘ │ │
    │  │ │ leave-room    │                                  │ │
    │  │ └───────────────┘                                  │ │
    │  └─────────────────────────────────────────────────────┘ │
    │                                                           │
    │  Backend APIs (Express):                                │
    │  └─────────────────────────────────────────────────────┘ │
    │     GET  /api/meetings/:id          (Fetch meeting)     │
    │     POST /api/meetings/:id/transcribe (Future: Real API)│
    │     POST /api/meetings/:id/summary   (Future: Real API)│
    │                                                           │
    └─────┬───────────────────────────────────────────────────┘
          │
          │
    ┌─────▼────────────────────────────────────────────┐
    │          MongoDB Database                        │
    │  - Meeting records                              │
    │  - User records                                 │
    │  - Recordings (future)                          │
    │  - Transcripts (future)                         │
    └─────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                 USER BROWSER (Window 2 - Same Room)              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        React Component: MeetingRoomEnhanced.jsx          │   │
│  │        (Same component, different browser)              │   │
│  │                                                          │   │
│  │  - Automatically joins same room (same meetingId)       │   │
│  │  - Sees other user in participants list                 │   │
│  │  - Can hear other user's audio (P2P WebRTC)            │   │
│  │  - Can send/receive chat messages                       │   │
│  │  - Recording independent (each user records local)      │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ┌────────────────┬────────────────┬─────────────────┐    │
│         │                │                │                 │    │
│    ┌────▼──────┐    ┌────▼──────┐   ┌────▼──────┐          │    │
│    │ Socket.IO │    │ WebRTC    │   │ Media     │          │    │
│    │ Client    │    │ Peer      │   │ Recorder  │          │    │
│    │           │    │ Connection│   │ API       │          │    │
│    └────┬──────┘    └────┬──────┘   └────┬──────┘          │    │
│         └────────────────┼────────────────┘                 │    │
└──────────────────────────┼──────────────────────────────────┘
                           │
                      (Same Socket.IO & WebRTC connection)
```

## Data Flow Diagrams

### 1️⃣ User Joins Meeting

```
User Click "Join Meeting"
        │
        ▼
Request Microphone Permission
        │
        ▼
getUserMedia({audio: true})
        │
        ▼
✅ Permission Granted
        │
        ▼
localStreamRef.current = stream
        │
        ▼
Start MediaRecorder (automatic recording)
        │
        ▼
Emit Socket Event: 'join-room'
        │
        ▼
Socket Server:
  - Add socket to room
  - Get current participants
  - Emit 'room-users' to joining user
  - Emit 'user-joined' to other users
        │
        ▼
Frontend Updates:
  - setIsJoined(true)
  - setParticipants([...])
  - Show recording timer
  - Display "Recording: 00:01"
```

### 2️⃣ Second User Joins (Same Room)

```
User2 Joins with Same meetingId
        │
        ▼
Gets microphone (same as User1)
        │
        ▼
Emits 'join-room' event
        │
        ▼
Socket Server Creates WebRTC Signal Events:
  - Peer Connection established between User1 ↔ User2
        │
        ▼
WebRTC Signaling Flow:
  User1                Socket Server                User2
    │                       │                         │
    │─────"signal"─offer─→ │                         │
    │                       │──────"signal"─offer──→  │
    │                       │  ← "signal"─answer──    │
    │  ← "signal"─answer─── │                         │
    │                       │                         │
    │──────ICE-candidate─→  │                         │
    │                       │ ──ICE-candidate─→       │
    │                       │  ← ICE-candidate ──     │
    │  ← ICE-candidate────  │                         │
        │
        ▼
✅ P2P Connection Established
        │
        ▼
Audio streams can now flow directly between users
(Server not involved in audio)
```

### 3️⃣ Chat Message Flow

```
User1 Types Message
        │
        ▼
sendMessage()
        │
        ▼
Emit Socket Event: 'chat-message'
  { roomId, text }
        │
        ▼
Socket Server Receives:
  - Gets room ID
  - Gets sender name from socket.data
  - Creates message object with timestamp
        │
        ▼
Emit 'chat-message' to ALL users in room:
  io.to(roomId).emit(...)
        │
        ▼
┌─────────────┬──────────────┐
│             │              │
▼             ▼              ▼
User1      User2          User3
Receive   Receive       Receive
Message   Message       Message
  │         │             │
  ▼         ▼             ▼
setMessages([...msg])  (for each user)
  │         │             │
  ▼         ▼             ▼
Display in Chat Box
```

### 4️⃣ Meeting Recording & Analysis

```
User Joins Meeting
        │
        ▼
MediaRecorder.start()
        │
        ▼
Recording audio chunks...
        │
        ├─ mediaRecorder.ondataavailable
        │   recordedChunksRef.current = [chunk1, chunk2, ...]
        │
User Leaves Meeting
        │
        ▼
mediaRecorder.stop()
        │
        ▼
setTimeout(() => processRecording(), 500)
        │
        ▼
Create Audio Blob:
  new Blob(recordedChunksRef.current, {type: 'audio/webm'})
        │
        ▼
Generate Mock Transcription:
  {
    segments: [
      { speaker: "User1", text: "...", time: 0-30 },
      { speaker: "User2", text: "...", time: 30-60 }
    ]
  }
        │
        ▼
Generate Mock Summary:
  {
    overview: "...",
    keyPoints: [...],
    actionItems: [...]
  }
        │
        ▼
setTranscript(mockTranscript)
setSummary(mockSummary)
setShowAnalysis(true)
        │
        ▼
Display Analysis Section:
  - Transcript with speakers
  - Summary with key points
  - Action items list
```

## Real-Time Communication Protocols

### Socket.IO Events

```
CLIENT → SERVER Events:
├── join-room
│   └── { roomId, user: {name, id} }
│
├── signal
│   └── { to, data: {type, sdp/candidate} }
│
├── chat-message
│   └── { roomId, text }
│
├── media-state
│   └── { roomId, cameraOn, micOn, screenSharing }
│
└── leave-room
    └── { roomId, user }

SERVER → CLIENT Events:
├── room-users
│   └── { roomId, participants: [...], yourId }
│
├── user-joined
│   └── { roomId, participant: {...} }
│
├── user-left
│   └── { participantId, name }
│
├── signal
│   └── { from, data, roomId, participant }
│
├── chat-message
│   └── { sender, text, timestamp }
│
└── media-state
    └── { participantId, cameraOn, micOn, screenSharing }
```

### WebRTC Signaling

```
RTCPeerConnection Setup:

User1                          User2
  │                             │
  ├─ new RTCPeerConnection     ├─ waiting for offer
  │
  ├─ createOffer()
  ├─ setLocalDescription()
  │
  ├─ Socket.emit('signal', {offer}) ───────→
  │                                     processOffer
  │                                     setRemoteDescription
  │                                     createAnswer
  │                                     setLocalDescription
  │                             │
  │ ← Socket.emit('signal', {answer})
  │  processAnswer
  │  setRemoteDescription
  │                                     │
  ├─ onIceCandidate() events ──────────→ addIceCandidate()
  │
  └─ ontrack() event fires ────────────→ Remote audio available
```

## Component State Management

```
MeetingRoomEnhanced State:

┌─────────────────────────────────────────────┐
│          Component State Variables          │
├─────────────────────────────────────────────┤
│ Data State:                                 │
│  - meeting: Meeting object                 │
│  - participants: Array of users             │
│  - messages: Chat messages array            │
│  - transcript: Transcription data           │
│  - summary: Analysis results                │
│                                             │
│ UI State:                                   │
│  - loading: Boolean (loading meeting)       │
│  - error: Error message string              │
│  - isJoined: Boolean (in room or not)       │
│  - showAnalysis: Boolean (show results)     │
│                                             │
│ Media State:                                │
│  - micOn: Boolean (mic enabled)             │
│  - speakerOn: Boolean (speaker enabled)     │
│  - isRecording: Boolean (recording active)  │
│  - recordingTime: Seconds (duration)        │
│                                             │
│ UI Input:                                   │
│  - message: Text input for chat             │
│  - copyMessage: "Link copied!" indicator    │
├─────────────────────────────────────────────┤
│           Refs (for DOM/Objects)            │
├─────────────────────────────────────────────┤
│ - socketRef: Socket.IO connection           │
│ - localStreamRef: User's audio stream       │
│ - peersRef: {socketId: RTCPeerConnection} │
│ - mediaRecorderRef: MediaRecorder object    │
│ - recordedChunksRef: [...] audio chunks     │
│ - audioContextRef: AudioContext             │
│ - analyserRef: AnalyserNode                 │
└─────────────────────────────────────────────┘
```

## File Structure with Data Flow

```
frontend/
├── src/
│   ├── App.jsx
│   │   └── imports MeetingRoomEnhanced component
│   │       └── routes to 'meeting-room' page
│   │
│   ├── services/
│   │   └── api.js
│   │       ├── meetingAPI.getMeetingById(id)
│   │       └── returns: { success, data: {...meeting} }
│   │
│   └── components/
│       ├── MeetingRoomEnhanced.jsx ✨ NEW
│       │   ├── useEffect: Fetch meeting via API
│       │   ├── useEffect: Initialize Socket.IO
│       │   ├── joinMeeting(): getUserMedia + create recording
│       │   ├── leaveMeeting(): stop recording + analysis
│       │   ├── sendMessage(): emit chat-message
│       │   └── handleSignal(): process WebRTC signals
│       │
│       └── MeetingRoomEnhanced.css ✨ NEW
│           └── Styling for room layout

backend/
├── server.js (current)
│   ├── Socket.IO setup
│   ├── CORS configuration
│   ├── getRoomParticipants()
│   └── Event handlers:
│       ├── join-room
│       ├── signal (WebRTC)
│       ├── chat-message
│       ├── media-state
│       ├── leave-room
│       └── disconnect
│
├── server-enhanced.js ✨ NEW (optional)
│   └── Same functionality + detailed logging
│
├── routes/
│   ├── meetingRoutes.js
│   │   ├── GET /api/meetings/:id
│   │   └── returns: meeting object
│   │
│   └── authRoutes.js
│       └── Authentication middleware
│
└── config/
    └── db.js
        └── MongoDB connection
```

## Security Considerations

```
Authentication Chain:
User → Login → JWT Token → LocalStorage → API Requests
                  │           │              │
                  └─ Socket.IO Connection (authenticated)
                  └─ Room Access (no cross-room access)
                  └─ Meeting Data (only if user in room)

Data Flow Protection:
├─ CORS: Only frontend origin allowed
├─ Socket.IO: CORS + room isolation
├─ API: JWT verification on each request
├─ Database: User ownership validation
└─ Frontend: Protected routes (auth check)
```

---

This architecture provides:
- ✅ Real-time communication (Socket.IO)
- ✅ Peer-to-peer audio (WebRTC)
- ✅ Scalable room management
- ✅ Isolated meeting spaces
- ✅ Recording capabilities
- ✅ Analysis features
- ✅ Secure authentication
- ✅ Production-ready structure

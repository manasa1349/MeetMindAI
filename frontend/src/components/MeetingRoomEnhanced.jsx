import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { meetingAPI } from '../services/api'
import './MeetingRoomEnhanced.css'

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:7000`
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]
const GUEST_NAME_KEY = 'meetmind_guest_name'

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch (error) {
    return {}
  }
}

function VideoTile({ name, stream, muted = false, isLocal = false }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="video-tile">
      <video ref={videoRef} autoPlay playsInline muted={muted} />
      <div className="video-name">{isLocal ? `${name} (You)` : name}</div>
    </div>
  )
}

function MeetingRoomEnhanced({ meetingId, onNavigate, userData }) {
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [participants, setParticipants] = useState([])
  const [remoteStreams, setRemoteStreams] = useState([])
  const [guestName, setGuestName] = useState(() => localStorage.getItem(GUEST_NAME_KEY) || '')
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      sender: 'System',
      text: 'Welcome to the meeting room. Share the invite link to let others join!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [message, setMessage] = useState('')
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [copyMessage, setCopyMessage] = useState('')
  const [summary, setSummary] = useState(null)
  const [transcript, setTranscript] = useState(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [aiProcessing, setAiProcessing] = useState(false)

  const socketRef = useRef(null)
  const localStreamRef = useRef(null)
  const peersRef = useRef({})
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)
  const audioContextRef = useRef(null)
  const audioDestinationRef = useRef(null)
  const audioSourcesRef = useRef({})
  const joinedRef = useRef(false)
  const participantsRef = useRef([])
  const ownSocketIdRef = useRef(null)

  const displayName = useMemo(() => {
    const storedUser = userData || getStoredUser()
    return storedUser.name || guestName.trim() || 'Guest'
  }, [guestName, userData])

  const canGenerateAI = useMemo(() => {
    const storedUser = userData || getStoredUser()
    return Boolean(storedUser.id)
  }, [userData])

  useEffect(() => {
    const fetchMeeting = async () => {
      if (!meetingId) {
        setError('No meeting selected.')
        setLoading(false)
        return
      }

      try {
        const storedUser = userData || getStoredUser()
        const response = storedUser.id
          ? await meetingAPI.getMeetingById(meetingId)
          : await meetingAPI.getPublicMeetingById(meetingId)
        if (response.success) {
          setMeeting(response.data)
          const chatResponse = await meetingAPI.getPublicMeetingMessages(meetingId)
          if (chatResponse.success && Array.isArray(chatResponse.data) && chatResponse.data.length > 0) {
            setMessages(chatResponse.data.map((item) => ({
              id: item._id,
              sender: item.senderName,
              text: item.text,
              timestamp: new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })))
          }
        } else {
          setError(response.message || 'Meeting not found.')
        }
      } catch (err) {
        setError('Failed to load meeting.')
      } finally {
        setLoading(false)
      }
    }

    fetchMeeting()
  }, [meetingId])

  useEffect(() => {
    participantsRef.current = participants
  }, [participants])

  useEffect(() => {
    if (!meeting) return

    const socket = io(SOCKET_SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    socketRef.current = socket

    socket.on('room-users', ({ participants: newParticipants, yourId }) => {
      setParticipants(newParticipants)
      if (yourId) {
        ownSocketIdRef.current = yourId
      }

      if (!joinedRef.current || !localStreamRef.current) {
        return
      }

      const ownSocketId = yourId || ownSocketIdRef.current
      newParticipants
        .filter((participant) => participant.id !== ownSocketId)
        .forEach((participant) => {
          if (!peersRef.current[participant.id]) {
            createPeerConnection(participant.id, participant.name, true)
          }
        })
    })

    socket.on('user-joined', ({ participant }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'System',
          text: `${participant.name} joined the meeting`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    })

    socket.on('user-left', ({ participantId, name }) => {
      closePeer(participantId)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'System',
          text: `${name} left the meeting`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    })

    socket.on('chat-message', ({ id, sender, text, timestamp }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: id || `${Date.now()}-${sender}`,
          sender,
          text,
          timestamp
        }
      ])
    })

    socket.on('signal', ({ from, data, participant }) => {
      handleSignal(from, data, participant?.name || 'Participant')
    })

    return () => {
      socket.disconnect()
    }
  }, [meeting, meetingId])

  const getParticipantName = (participantId, fallback = 'Participant') => {
    return participantsRef.current.find((participant) => participant.id === participantId)?.name || fallback
  }

  const connectAudioToMix = (stream, sourceId) => {
    if (!audioContextRef.current || !audioDestinationRef.current || audioSourcesRef.current[sourceId]) {
      return
    }

    if (stream.getAudioTracks().length === 0) {
      return
    }

    const source = audioContextRef.current.createMediaStreamSource(stream)
    source.connect(audioDestinationRef.current)
    audioSourcesRef.current[sourceId] = source
  }

  const createPeerConnection = async (peerId, peerName = 'Participant', shouldOffer = false) => {
    if (!socketRef.current || peersRef.current[peerId]) {
      return peersRef.current[peerId]
    }

    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    peersRef.current[peerId] = peer

    localStreamRef.current?.getTracks().forEach((track) => {
      peer.addTrack(track, localStreamRef.current)
    })

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('signal', {
          to: peerId,
          data: {
            type: 'ice-candidate',
            candidate: event.candidate
          }
        })
      }
    }

    peer.ontrack = (event) => {
      const [remoteStream] = event.streams
      if (!remoteStream) return

      connectAudioToMix(remoteStream, peerId)
      setRemoteStreams((current) => {
        const existing = current.find((item) => item.id === peerId)
        if (existing) {
          return current.map((item) => (
            item.id === peerId ? { ...item, name: getParticipantName(peerId, peerName), stream: remoteStream } : item
          ))
        }

        return [
          ...current,
          {
            id: peerId,
            name: getParticipantName(peerId, peerName),
            stream: remoteStream
          }
        ]
      })
    }

    peer.onconnectionstatechange = () => {
      if (['closed', 'failed', 'disconnected'].includes(peer.connectionState)) {
        closePeer(peerId)
      }
    }

    if (shouldOffer) {
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      socketRef.current.emit('signal', {
        to: peerId,
        data: {
          type: 'offer',
          sdp: offer.sdp
        }
      })
    }

    return peer
  }

  const closePeer = (peerId) => {
    if (peersRef.current[peerId]) {
      peersRef.current[peerId].close()
      delete peersRef.current[peerId]
    }

    if (audioSourcesRef.current[peerId]) {
      audioSourcesRef.current[peerId].disconnect()
      delete audioSourcesRef.current[peerId]
    }

    setRemoteStreams((current) => current.filter((item) => item.id !== peerId))
  }

  const handleSignal = async (from, data, peerName = 'Participant') => {
    try {
      let peer = peersRef.current[from]
      if (!peer) {
        peer = await createPeerConnection(from, peerName, false)
      }

      if (data.type === 'offer') {
        await peer.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }))
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        socketRef.current.emit('signal', {
          to: from,
          data: {
            type: 'answer',
            sdp: answer.sdp
          }
        })
      } else if (data.type === 'answer') {
        await peer.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }))
      } else if (data.type === 'ice-candidate' && data.candidate) {
        await peer.addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    } catch (err) {
      console.error('WebRTC signal error:', err)
    }
  }

  const startAudioCaptureForAI = (stream) => {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext
    audioContextRef.current = new AudioContextConstructor()
    audioDestinationRef.current = audioContextRef.current.createMediaStreamDestination()
    connectAudioToMix(stream, 'local')

    const mixedAudioStream = audioDestinationRef.current.stream
    const recorderOptions = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? { mimeType: 'audio/webm;codecs=opus' }
      : { mimeType: 'audio/webm' }

    const mediaRecorder = new MediaRecorder(mixedAudioStream, recorderOptions)
    mediaRecorderRef.current = mediaRecorder
    recordedChunksRef.current = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      processRecording()
    }

    mediaRecorder.start(1000)
    setIsRecordingAudio(true)
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)
  }

  const joinMeeting = async () => {
    try {
      if (!socketRef.current) {
        setError('Socket not connected')
        return
      }

      const storedUser = userData || getStoredUser()
      const resolvedName = storedUser.name || guestName.trim() || `Guest ${Math.floor(1000 + Math.random() * 9000)}`

      if (!storedUser.name) {
        localStorage.setItem(GUEST_NAME_KEY, resolvedName)
        setGuestName(resolvedName)
      }

      setError('')
      setShowAnalysis(false)
      setTranscript(null)
      setSummary(null)
      setAiProcessing(false)

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          'Camera and microphone are not available in this browser context. Open the meeting over HTTPS, or test on localhost from the same computer.'
        )
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      })

      localStreamRef.current = stream
      setMicOn(true)
      setCameraOn(true)
      setIsJoined(true)
      joinedRef.current = true
      startAudioCaptureForAI(stream)

      socketRef.current.emit('join-room', {
        roomId: String(meetingId),
        user: {
          ...storedUser,
          name: resolvedName,
          role: storedUser.name ? 'Member' : 'Guest'
        }
      })
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera or microphone access denied. Please enable browser permissions.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found.')
      } else {
        setError(`Error accessing camera or microphone: ${err.message}`)
      }
    }
  }

  const leaveMeeting = async () => {
    try {
      joinedRef.current = false

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }

      clearInterval(recordingIntervalRef.current)
      setIsRecordingAudio(false)

      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null

      Object.keys(peersRef.current).forEach(closePeer)
      peersRef.current = {}

      Object.values(audioSourcesRef.current).forEach((source) => source.disconnect())
      audioSourcesRef.current = {}
      audioContextRef.current?.close()
      audioContextRef.current = null
      audioDestinationRef.current = null

      socketRef.current?.emit('leave-room', {
        roomId: String(meetingId),
        user: {
          ...(userData || getStoredUser()),
          name: displayName
        }
      })

      setIsJoined(false)
      setRemoteStreams([])
      setRecordingTime(0)
    } catch (err) {
      console.error('Error leaving meeting:', err)
    }
  }

  const processRecording = async () => {
    try {
      if (recordedChunksRef.current.length === 0) return

      const blob = new Blob(recordedChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' })
      const storedUser = userData || getStoredUser()

      if (!storedUser.id) {
        setAiProcessing(false)
        setTranscript({
          text: 'Guest audio captured locally. Sign in as the meeting owner to generate AI transcript and summary.',
          segments: []
        })
        setSummary({
          title: `Meeting Summary - ${meeting?.title}`,
          overview: 'Guests can join, speak, turn camera on, and chat. AI transcript generation is available to signed-in users.',
          keyPoints: ['Guest audio was captured locally for this browser session.'],
          actionItems: []
        })
        setShowAnalysis(true)
        return
      }

      setAiProcessing(true)
      const speakerNames = participants.map((participant) => participant.name).filter(Boolean)
      const response = await meetingAPI.generateAI(meetingId, blob, { speakerNames })

      if (response.success && response.data) {
        const transcriptSegments = Array.isArray(response.data.transcript)
          ? response.data.transcript.map((segment, index) => ({
              speaker: segment.speaker || speakerNames[index % speakerNames.length] || `Speaker ${index + 1}`,
              start: index * 15,
              end: (index + 1) * 15,
              text: segment.text,
              timestamp: segment.timestamp || `${String(Math.floor(index / 4) * 5).padStart(2, '0')}:${String((index % 4) * 15).padStart(2, '0')}`
            }))
          : []

        setTranscript({
          text: transcriptSegments.map((segment) => `${segment.speaker}: ${segment.text}`).join('\n'),
          segments: transcriptSegments
        })

        setSummary({
          title: `Meeting Summary - ${meeting?.title}`,
          overview: response.data.summary,
          keyPoints: response.data.importantPoints || [],
          actionItems:
            response.data.decisions?.map((decision, index) => ({
              task: decision,
              assignee: participants[index % participants.length]?.name || 'Team',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
            })) || []
        })
      } else {
        setTranscript({
          text: 'Transcription unavailable. Falling back to local meeting notes.',
          segments: []
        })
        setSummary({
          title: `Meeting Summary - ${meeting?.title}`,
          overview: 'Transcript generation is temporarily unavailable.',
          keyPoints: ['Audio was captured but transcription could not be generated.'],
          actionItems: []
        })
      }

      setShowAnalysis(true)
    } catch (err) {
      console.error('Error processing recording:', err)
      setTranscript({
        text: 'Transcription failed. Please try again later.',
        segments: []
      })
      setSummary({
        title: `Meeting Summary - ${meeting?.title}`,
        overview: 'Audio was captured but analysis failed.',
        keyPoints: [],
        actionItems: []
      })
      setShowAnalysis(true)
    } finally {
      setAiProcessing(false)
    }
  }

  const sendMessage = () => {
    if (!message.trim() || !socketRef.current) return

    socketRef.current.emit('chat-message', {
      roomId: String(meetingId),
      text: message
    })

    setMessage('')
  }

  const toggleMic = () => {
    setMicOn((current) => {
      const next = !current
      localStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = next
      })
      socketRef.current?.emit('media-state', {
        roomId: String(meetingId),
        cameraOn,
        micOn: next,
        screenSharing: false
      })
      return next
    })
  }

  const toggleCamera = () => {
    setCameraOn((current) => {
      const next = !current
      localStreamRef.current?.getVideoTracks().forEach((track) => {
        track.enabled = next
      })
      socketRef.current?.emit('media-state', {
        roomId: String(meetingId),
        cameraOn: next,
        micOn,
        screenSharing: false
      })
      return next
    })
  }

  const copyInviteLink = () => {
    const link = `${window.location.origin}?page=meeting-room&meetingId=${meetingId}`
    navigator.clipboard.writeText(link)
    setCopyMessage('Link copied')
    setTimeout(() => setCopyMessage(''), 2000)
  }

  const inviteLink = `${window.location.origin}?page=meeting-room&meetingId=${meetingId}`

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const roomCode = useMemo(() => {
    if (!meetingId) return 'ROOM-0000'
    return `ROOM-${String(meetingId).slice(-6).toUpperCase()}`
  }, [meetingId])

  if (loading) return <div className="loading">Loading meeting...</div>
  if (error)
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => onNavigate('dashboard')}>Back to Dashboard</button>
      </div>
    )
  if (!meeting) return <div>Meeting not found</div>

  return (
    <div className="meeting-room-container">
      <div className="meeting-header">
        <h2>{meeting.title}</h2>
        <p>{meeting.description}</p>
      </div>

      <div className="room-info">
        <span>
          <strong>Room Code:</strong> {roomCode}
        </span>
        <span>
          <strong>Participants:</strong> {participants.length}
        </span>
        {isRecordingAudio && (
          <span className="recording-pill">
            Recording {formatTime(recordingTime)}
          </span>
        )}
        {aiProcessing && <span className="processing-pill">Generating transcript</span>}
      </div>

      <div className="share-panel">
        <div>
          <h3>Share Meeting Link</h3>
          <p>Anyone with this link can join this room, turn on camera/mic, and use live chat.</p>
        </div>
        <div className="share-link-row">
          <input value={inviteLink} readOnly aria-label="Meeting invite link" />
          <button className="btn btn-secondary" onClick={copyInviteLink}>
            Copy Link
          </button>
        </div>
        {copyMessage && <span className="share-status">{copyMessage}</span>}
      </div>

      <div className="ai-status-panel workflow-panel">
        <div>
          <strong>Recording workflow</strong>
          <p>
            {isJoined
              ? 'Audio is being captured from your microphone and connected remote participants.'
              : aiProcessing
                ? 'Audio capture stopped. AI transcription and summary are being generated.'
                : showAnalysis
                  ? 'Transcript and summary were generated from the captured audio.'
                  : 'Join the meeting to start local audio capture.'}
          </p>
        </div>
        <div className="workflow-steps">
          <span className={isJoined || isRecordingAudio || showAnalysis ? 'active' : ''}>Join</span>
          <span className={isRecordingAudio ? 'active' : ''}>Record</span>
          <span className={aiProcessing ? 'active' : ''}>Transcribe</span>
          <span className={showAnalysis ? 'active' : ''}>Review</span>
        </div>
        {!canGenerateAI && (
          <p className="workflow-note">
            Guests can join and chat, but AI transcription is only saved for signed-in meeting owners.
          </p>
        )}
      </div>

      <div className="room-actions">
        {!isJoined ? (
          <>
            {!userData?.name && !getStoredUser().name && (
              <input
                className="guest-name-input"
                type="text"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Your name"
                maxLength={40}
              />
            )}
            <button className="btn btn-primary" onClick={joinMeeting} style={{ fontSize: '1.1rem' }}>
              Join Meeting
            </button>
          </>
        ) : (
          <>
            <button
              className={`btn media-toggle ${micOn ? 'is-on' : 'is-off'}`}
              onClick={toggleMic}
            >
              {micOn ? 'Mute Mic' : 'Unmute Mic'}
            </button>
            <button
              className={`btn media-toggle ${cameraOn ? 'is-on' : 'is-off'}`}
              onClick={toggleCamera}
            >
              {cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
            </button>
            <button
              className={`btn media-toggle ${speakerOn ? 'is-on' : 'is-off'}`}
              onClick={() => setSpeakerOn(!speakerOn)}
            >
              {speakerOn ? 'Mute Speaker' : 'Unmute Speaker'}
            </button>
            <button className="btn btn-danger" onClick={leaveMeeting} disabled={aiProcessing}>
              {canGenerateAI ? 'Leave and generate AI' : 'Leave meeting'}
            </button>
          </>
        )}
      </div>

      {isJoined && (
        <div className="room-content">
          <div className="room-section video-section">
            <h3>Live Video Room</h3>
            <div className="video-grid">
              {localStreamRef.current && (
                <VideoTile name={displayName} stream={localStreamRef.current} muted isLocal />
              )}
              {remoteStreams.map((remote) => (
                <VideoTile
                  key={remote.id}
                  name={remote.name}
                  stream={remote.stream}
                  muted={!speakerOn}
                />
              ))}
            </div>
            {remoteStreams.length === 0 && (
              <p>Share the invite link. Other cameras will appear here when people join.</p>
            )}
          </div>

          <div className="room-section">
            <h3>Participants ({participants.length})</h3>
            {participants.length > 0 ? (
              <ul>
                {participants.map((participant) => (
                  <li key={participant.id}>
                    {participant.name}
                    {participant.micOn ? ' | mic on' : ' | mic off'}
                    {participant.cameraOn ? ' | camera on' : ' | camera off'}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Waiting for others to join...</p>
            )}
          </div>

          <div className="room-section">
            <h3>Live Chat</h3>
            <div className="messages-box">
              {messages.map((msg) => (
                <div key={msg.id} className="message">
                  <strong>{msg.sender}</strong>
                  <span className="timestamp">{msg.timestamp}</span>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="message-input">
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}

      {showAnalysis && (summary || transcript) && (
        <div className="analysis-section">
          <h3>Meeting Analysis</h3>

          {transcript && (
            <div className="transcript-section">
              <h4>Transcript</h4>
              <div className="transcript-content">
                {transcript.segments?.length > 0 ? (
                  transcript.segments.map((segment, index) => (
                    <p key={index}>
                      <strong>{segment.speaker}:</strong> {segment.text}
                    </p>
                  ))
                ) : (
                  <p>{transcript.text}</p>
                )}
              </div>
            </div>
          )}

          {summary && (
            <div className="summary-section">
              <h4>Summary</h4>
              <p>{summary.overview}</p>

              <h5>Key Points:</h5>
              <ul>
                {summary.keyPoints?.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>

              {summary.actionItems && summary.actionItems.length > 0 && (
                <>
                  <h5>Action Items:</h5>
                  <ul>
                    {summary.actionItems.map((item, index) => (
                      <li key={index}>
                        {item.task} - {item.assignee} (Due: {item.dueDate})
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MeetingRoomEnhanced

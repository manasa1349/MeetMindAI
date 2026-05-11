import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { meetingAPI } from '../services/api'

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:7000'
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

const formatTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const stopStreamTracks = (stream) => {
  if (!stream) return
  stream.getTracks().forEach((track) => track.stop())
}

function MeetingRoomRealtime({ meetingId, onNavigate }) {
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Not connected')
  const [participants, setParticipants] = useState([])
  const [remoteStreams, setRemoteStreams] = useState([])
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'System',
      text: 'This room is ready for live audio, video, and chat.',
      timestamp: '09:00'
    }
  ])
  const [message, setMessage] = useState('')
  const [notes, setNotes] = useState([])
  const [note, setNote] = useState('')
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')
  const [localPreviewStream, setLocalPreviewStream] = useState(null)

  const socketRef = useRef(null)
  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const peersRef = useRef({})
  const localVideoRef = useRef(null)
  const handlersAttachedRef = useRef(false)

  useEffect(() => {
    const fetchMeeting = async () => {
      if (!meetingId) {
        setError('No meeting selected.')
        setLoading(false)
        return
      }

      try {
        const response = await meetingAPI.getMeetingById(meetingId)
        if (response.success) {
          setMeeting(response.data)
        } else {
          setError(response.message || 'Meeting not found.')
        }
      } catch (err) {
        setError('Failed to load meeting room.')
      } finally {
        setLoading(false)
      }
    }

    fetchMeeting()
  }, [meetingId])

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localPreviewStream
    }
  }, [localPreviewStream])

  useEffect(() => {
    const localStream = localStreamRef.current
    if (!localStream) return

    localStream.getVideoTracks().forEach((track) => {
      track.enabled = cameraOn && !screenSharing
    })
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = micOn
    })

    if (socketRef.current?.connected && meetingId) {
      socketRef.current.emit('media-state', {
        roomId: String(meetingId),
        cameraOn,
        micOn,
        screenSharing
      })
    }
  }, [cameraOn, micOn, screenSharing, meetingId])

  useEffect(() => {
    return () => {
      closeRoom(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const roomCode = useMemo(() => {
    if (!meetingId) return 'ROOM-0000'
    return `ROOM-${String(meetingId).slice(-6).toUpperCase()}`
  }, [meetingId])

  const inviteLink = useMemo(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', 'meeting-room')
    url.searchParams.set('meetingId', String(meetingId))
    return url.toString()
  }, [meetingId])

  const getUserContext = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch (error) {
      return {}
    }
  }

  const getActiveVideoTrack = () => {
    if (screenSharing && screenStreamRef.current) {
      return screenStreamRef.current.getVideoTracks()[0] || null
    }

    return localStreamRef.current?.getVideoTracks()[0] || null
  }

  const getPeerName = (socketId) => {
    const participant = participants.find((entry) => entry.id === socketId)
    return participant?.name || 'Guest'
  }

  const upsertRemoteStream = (socketId, stream) => {
    if (!socketId || !stream) return

    setRemoteStreams((current) => {
      const existingIndex = current.findIndex((item) => item.id === socketId)
      const nextItem = {
        id: socketId,
        name: getPeerName(socketId),
        stream
      }

      if (existingIndex >= 0) {
        const updated = [...current]
        updated[existingIndex] = nextItem
        return updated
      }

      return [...current, nextItem]
    })
  }

  const removePeer = (socketId) => {
    const peer = peersRef.current[socketId]
    if (peer) {
      peer.ontrack = null
      peer.onicecandidate = null
      peer.onconnectionstatechange = null
      peer.close()
      delete peersRef.current[socketId]
    }

    setRemoteStreams((current) => current.filter((item) => item.id !== socketId))
  }

  const replaceOutgoingVideoTrack = async (newTrack) => {
    if (!newTrack) return

    Object.values(peersRef.current).forEach((peer) => {
      const sender = peer.getSenders().find((item) => item.track && item.track.kind === 'video')
      if (sender) {
        sender.replaceTrack(newTrack)
      }
    })
  }

  const createPeer = async (socketId, initiator) => {
    if (!socketId || peersRef.current[socketId]) {
      return peersRef.current[socketId]
    }

    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    peersRef.current[socketId] = peer

    const currentStream = localStreamRef.current
    if (currentStream) {
      currentStream.getTracks().forEach((track) => {
        peer.addTrack(track, currentStream)
      })
    }

    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal', {
          to: socketId,
          data: {
            type: 'candidate',
            candidate: event.candidate
          }
        })
      }
    }

    peer.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) {
        upsertRemoteStream(socketId, stream)
      }
    }

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        removePeer(socketId)
      }
    }

    if (initiator) {
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      socketRef.current?.emit('signal', {
        to: socketId,
        data: {
          type: 'offer',
          sdp: peer.localDescription
        }
      })
    }

    return peer
  }

  const handleSignal = async ({ from, data }) => {
    if (!from || !data) return
    if (from === socketRef.current?.id) return

    let peer = peersRef.current[from]

    if (!peer) {
      peer = await createPeer(from, false)
    }

    if (!peer) return

    if (data.type === 'offer') {
      await peer.setRemoteDescription(new RTCSessionDescription(data.sdp))
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)

      socketRef.current?.emit('signal', {
        to: from,
        data: {
          type: 'answer',
          sdp: peer.localDescription
        }
      })
    }

    if (data.type === 'answer') {
      await peer.setRemoteDescription(new RTCSessionDescription(data.sdp))
    }

    if (data.type === 'candidate' && data.candidate) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(data.candidate))
      } catch (error) {
        console.error('Failed to add ICE candidate:', error)
      }
    }
  }

  const attachSocketListeners = () => {
    if (!socketRef.current || handlersAttachedRef.current) {
      return
    }

    const socket = socketRef.current

    socket.on('room-users', async ({ participants: roomParticipants = [] }) => {
      setParticipants(roomParticipants)
      const remoteParticipants = roomParticipants.filter((participant) => participant.id !== socket.id)

      for (const participant of remoteParticipants) {
        if (!peersRef.current[participant.id]) {
          await createPeer(participant.id, true)
        }
      }
    })

    socket.on('user-joined', ({ participant }) => {
      if (!participant) return
      setParticipants((current) => {
        const exists = current.some((item) => item.id === participant.id)
        if (exists) return current
        return [...current, participant]
      })
    })

    socket.on('user-left', ({ participantId }) => {
      if (!participantId) return
      setParticipants((current) => current.filter((item) => item.id !== participantId))
      removePeer(participantId)
    })

    socket.on('signal', handleSignal)

    socket.on('chat-message', (payload) => {
      setMessages((current) => [payload, ...current])
    })

    socket.on('media-state', ({ participantId, cameraOn: nextCameraOn, micOn: nextMicOn, screenSharing: nextScreenSharing }) => {
      setParticipants((current) => current.map((participant) => {
        if (participant.id !== participantId) return participant
        return {
          ...participant,
          cameraOn: nextCameraOn,
          micOn: nextMicOn,
          screenSharing: nextScreenSharing
        }
      }))
    })

    handlersAttachedRef.current = true
  }

  const joinRoom = async () => {
    if (!meetingId) {
      setError('No meeting selected.')
      return
    }

    try {
      setError('')
      setConnectionStatus('Requesting camera and microphone access...')

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      setLocalPreviewStream(stream)
      setCameraOn(true)
      setMicOn(true)
      setScreenSharing(false)

      const socket = socketRef.current || io(SOCKET_SERVER_URL, { transports: ['websocket'] })
      socketRef.current = socket
      attachSocketListeners()

      if (!socket.connected) {
        await new Promise((resolve) => {
          socket.once('connect', resolve)
        })
      }

      const user = getUserContext()
      socket.emit('join-room', {
        roomId: String(meetingId),
        user: {
          name: user?.name || 'Guest',
          role: 'Participant'
        }
      })

      setIsJoined(true)
      setConnectionStatus('Connected to live room')
      setMessages((current) => [
        {
          id: Date.now(),
          sender: 'System',
          text: 'You joined the live room with audio and video enabled.',
          timestamp: formatTime()
        },
        ...current
      ])
    } catch (joinError) {
      console.error(joinError)
      setConnectionStatus('Unable to join room')
      setError('Camera and microphone access is required to join the live room.')
    }
  }

  const closeRoom = (resetState = true) => {
    Object.keys(peersRef.current).forEach((socketId) => removePeer(socketId))
    peersRef.current = {}

    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    stopStreamTracks(screenStreamRef.current)
    stopStreamTracks(localStreamRef.current)

    screenStreamRef.current = null
    localStreamRef.current = null
    handlersAttachedRef.current = false

    if (resetState) {
      setLocalPreviewStream(null)
      setIsJoined(false)
      setScreenSharing(false)
      setCameraOn(true)
      setMicOn(true)
      setParticipants([])
      setRemoteStreams([])
      setConnectionStatus('Not connected')
    }
  }

  const leaveRoom = () => {
    closeRoom()
    setMessages((current) => [
      {
        id: Date.now(),
        sender: 'System',
        text: 'You left the room.',
        timestamp: formatTime()
      },
      ...current
    ])
  }

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopyMessage('Invite link copied.')
      setTimeout(() => setCopyMessage(''), 2000)
    } catch (err) {
      setCopyMessage('Unable to copy automatically.')
    }
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || !isJoined) return

    const payload = {
      id: Date.now(),
      sender: getUserContext()?.name || 'You',
      text: trimmed,
      timestamp: formatTime()
    }

    socketRef.current?.emit('chat-message', {
      roomId: String(meetingId),
      text: trimmed
    })

    setMessages((current) => [payload, ...current])
    setMessage('')
  }

  const handleAddNote = (e) => {
    e.preventDefault()
    const trimmed = note.trim()
    if (!trimmed) return

    setNotes((current) => [
      {
        id: Date.now(),
        text: trimmed,
        timestamp: formatTime()
      },
      ...current
    ])
    setNote('')
  }

  const handleToggleCamera = () => {
    setCameraOn((current) => !current)
  }

  const handleToggleMic = () => {
    setMicOn((current) => !current)
  }

  const stopScreenShare = async () => {
    const screenStream = screenStreamRef.current
    if (!screenStream) return

    stopStreamTracks(screenStream)
    screenStreamRef.current = null
    setScreenSharing(false)

    const cameraTrack = localStreamRef.current?.getVideoTracks()[0]
    if (cameraTrack) {
      await replaceOutgoingVideoTrack(cameraTrack)
    }

    setLocalPreviewStream(localStreamRef.current)
  }

  const handleToggleScreenShare = async () => {
    if (!isJoined) return

    try {
      if (screenSharing) {
        await stopScreenShare()
        return
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      screenStreamRef.current = displayStream
      setScreenSharing(true)
      setLocalPreviewStream(displayStream)

      const screenTrack = displayStream.getVideoTracks()[0]
      if (screenTrack) {
        await replaceOutgoingVideoTrack(screenTrack)
        screenTrack.onended = () => {
          stopScreenShare()
        }
      }
    } catch (error) {
      console.error('Screen share failed:', error)
      setError('Screen sharing could not be started.')
    }
  }

  const handleMediaControlClick = () => {
    if (!isJoined) {
      joinRoom()
    }
  }

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)' }}>Loading meeting room...</p>
  }

  if (error) {
    return <p style={{ color: 'var(--danger-color)' }}>{error}</p>
  }

  return (
    <div className="meeting-detail-container">
      <div className="meeting-detail-header">
        <h2>{meeting?.title || 'Meeting Room'}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{meeting?.description || 'No description available.'}</p>
      </div>

      <div className="meeting-detail-info">
        <div><strong>Room Code:</strong> {roomCode}</div>
        <div><strong>Participants:</strong> {participants.length || meeting?.participants || 0}</div>
        <div><strong>Status:</strong> {connectionStatus}</div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {!isJoined ? (
          <button className="btn btn-primary" onClick={handleMediaControlClick}>Join Meeting</button>
        ) : (
          <button className="btn btn-secondary" onClick={leaveRoom}>Leave Meeting</button>
        )}
        <button className="btn btn-secondary" onClick={handleCopyInvite}>Copy Invite Link</button>
        <button className="btn btn-secondary" onClick={() => onNavigate('meeting-detail', meetingId)}>Back to Details</button>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem' }}>{copyMessage}</p>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 0.9fr)', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Live Meeting Stage</h3>
            <div style={{
              minHeight: '280px',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(14,165,233,0.12))',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '1rem'
            }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div style={{ borderRadius: '1rem', overflow: 'hidden', background: 'rgba(0,0,0,0.35)', minHeight: '220px' }}>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <strong>You</strong>
                      <span className="status-badge status-completed">{cameraOn ? 'Camera On' : 'Camera Off'}</span>
                    </div>
                  </div>

                  {remoteStreams.length > 0 ? remoteStreams.map((item) => (
                    <div key={item.id} style={{ borderRadius: '1rem', overflow: 'hidden', background: 'rgba(0,0,0,0.35)', minHeight: '220px' }}>
                      <video
                        ref={(node) => {
                          if (node && node.srcObject !== item.stream) {
                            node.srcObject = item.stream
                          }
                        }}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                        <strong>{item.name}</strong>
                        <span className="status-badge status-inprogress">Remote</span>
                      </div>
                    </div>
                  )) : (
                    <div style={{ borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.12)', minHeight: '220px', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>
                      Waiting for another participant to join...
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span className="status-badge status-inprogress">{cameraOn ? 'Camera On' : 'Camera Off'}</span>
                  <span className="status-badge status-inprogress">{micOn ? 'Mic On' : 'Mic Off'}</span>
                  <span className="status-badge status-pending">{screenSharing ? 'Sharing Screen' : 'Screen Share Off'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={handleToggleCamera} disabled={!isJoined}>
                {cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
              </button>
              <button className="btn btn-secondary" onClick={handleToggleMic} disabled={!isJoined}>
                {micOn ? 'Mute Mic' : 'Unmute Mic'}
              </button>
              <button className="btn btn-primary" onClick={handleToggleScreenShare} disabled={!isJoined}>
                {screenSharing ? 'Stop Sharing' : 'Start Screen Share'}
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Live Chat</h3>
            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
              {messages.map((item) => (
                <div key={item.id} style={{ padding: '0.85rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.35rem' }}>
                    <strong>{item.sender}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.timestamp}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{item.text}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'grid', gap: '0.75rem' }}>
              <textarea
                className="form-textarea"
                placeholder={isJoined ? 'Write a message to everyone...' : 'Join the room to chat...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!isJoined}
              />
              <button className="btn btn-primary" type="submit" disabled={!isJoined}>Send Message</button>
            </form>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Participants</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {participants.length > 0 ? participants.map((participant) => (
                <div key={participant.id} style={{ padding: '0.85rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <strong>{participant.name}</strong>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{participant.role}</div>
                    </div>
                    <span className={`status-badge ${participant.status === 'online' ? 'status-completed' : 'status-pending'}`}>
                      {participant.status}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="status-badge status-inprogress">{participant.cameraOn ? 'Camera On' : 'Camera Off'}</span>
                    <span className="status-badge status-inprogress">{participant.micOn ? 'Mic On' : 'Mic Off'}</span>
                    <span className="status-badge status-pending">{participant.screenSharing ? 'Screen Sharing' : 'No Share'}</span>
                  </div>
                </div>
              )) : (
                <p style={{ color: 'var(--text-secondary)' }}>No participants connected yet.</p>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Live Notes</h3>
            <form onSubmit={handleAddNote} style={{ display: 'grid', gap: '0.75rem' }}>
              <textarea
                className="form-textarea"
                placeholder={isJoined ? 'Type a note for this meeting...' : 'Join the meeting to add notes...'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!isJoined}
              />
              <button className="btn btn-primary" type="submit" disabled={!isJoined}>Save Note</button>
            </form>
          </div>

          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Room Activity</h3>
            {notes.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {notes.map((item) => (
                  <div key={item.id} style={{ padding: '0.9rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.timestamp}</div>
                    <div>{item.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No room activity yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MeetingRoomRealtime

import { useEffect, useMemo, useState } from 'react'
import { meetingAPI } from '../services/api'

function MeetingRoom({ meetingId, onNavigate }) {
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState([])
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Ava',
      text: 'Welcome to the meeting room.',
      timestamp: '09:00'
    },
    {
      id: 2,
      sender: 'System',
      text: 'Join the room to unlock live chat, notes, and screen-share controls.',
      timestamp: '09:01'
    }
  ])
  const [participants, setParticipants] = useState([
    { id: 1, name: 'You', role: 'Host', status: 'online' },
    { id: 2, name: 'Ava', role: 'Presenter', status: 'online' },
    { id: 3, name: 'Noah', role: 'Designer', status: 'away' },
    { id: 4, name: 'Mia', role: 'Developer', status: 'online' }
  ])
  const [copyMessage, setCopyMessage] = useState('')

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

  const roomCode = useMemo(() => {
    if (!meetingId) return 'ROOM-0000'
    return `ROOM-${String(meetingId).slice(-6).toUpperCase()}`
  }, [meetingId])

  const inviteLink = `${window.location.origin}${window.location.pathname}?meeting=${meetingId}`

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopyMessage('Invite link copied.')
      setTimeout(() => setCopyMessage(''), 2000)
    } catch (err) {
      setCopyMessage('Unable to copy automatically.')
    }
  }

  const handleJoin = () => {
    setIsJoined(true)
    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        sender: 'System',
        text: 'You joined the room.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
  }

  const handleLeave = () => {
    setIsJoined(false)
    setScreenSharing(false)
  }

  const handleToggleScreenShare = () => {
    if (!isJoined) return
    setScreenSharing((current) => !current)
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || !isJoined) return

    setMessages((current) => [
      {
        id: Date.now(),
        sender: 'You',
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...current
    ])
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
        timestamp: new Date().toLocaleTimeString()
      },
      ...current
    ])
    setNote('')
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
        <div><strong>Participants:</strong> {meeting?.participants || 0}</div>
        <div><strong>Status:</strong> {isJoined ? 'Joined' : 'Ready to join'}</div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {!isJoined ? (
          <button className="btn btn-primary" onClick={handleJoin}>Join Meeting</button>
        ) : (
          <button className="btn btn-secondary" onClick={handleLeave}>Leave Meeting</button>
        )}
        <button className="btn btn-secondary" onClick={handleCopyInvite}>Copy Invite Link</button>
        <button className="btn btn-secondary" onClick={() => onNavigate('meeting-detail', meetingId)}>Back to Details</button>
      </div>

      {copyMessage && <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem' }}>{copyMessage}</p>}

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 0.9fr)', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Live Meeting Stage</h3>
            <div style={{
              minHeight: '240px',
              borderRadius: '1rem',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(14,165,233,0.12))',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              padding: '1rem'
            }}>
              <div>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{isJoined ? '🎥' : '⏸️'}</div>
                <h4 style={{ marginBottom: '0.5rem' }}>{isJoined ? 'You are in the room' : 'Room waiting area'}</h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  {isJoined
                    ? 'Camera, microphone, and screen-share controls are active.'
                    : 'Join to activate the live room experience.'}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span className="status-badge status-inprogress">{cameraOn ? 'Camera On' : 'Camera Off'}</span>
                  <span className="status-badge status-inprogress">{micOn ? 'Mic On' : 'Mic Off'}</span>
                  <span className="status-badge status-pending">{screenSharing ? 'Sharing Screen' : 'Screen Share Off'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => setCameraOn((current) => !current)} disabled={!isJoined}>
                {cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
              </button>
              <button className="btn btn-secondary" onClick={() => setMicOn((current) => !current)} disabled={!isJoined}>
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
              {participants.map((participant) => (
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
                </div>
              ))}
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

export default MeetingRoom
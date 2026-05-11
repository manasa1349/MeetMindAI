import { useState, useEffect } from 'react'
import { meetingAPI } from '../services/api'

function Transcript({ meetingId }) {
  const [transcript, setTranscript] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const id = meetingId
        if (!id) {
          setTranscript([])
          return
        }
        const response = await meetingAPI.getMeetingById(id)
        if (response.success && response.data?.transcript) {
          setTranscript(response.data.transcript)
        } else {
          setTranscript([])
        }
      } catch (err) {
        setTranscript([])
      } finally {
        setLoading(false)
      }
    }

    fetchTranscript()
  }, [meetingId])

  return (
    <div className="transcript-container">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Meeting Transcript</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Meeting transcript loaded from selected meeting</p>
      </div>

      <div className="transcript-messages">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading transcript...</p>
        ) : transcript.length > 0 ? (
          transcript.map((item, index) => (
            <div key={index} className="message">
              <div className="speaker">{item.speaker}</div>
              <div className="message-text">{item.text}</div>
              <div className="timestamp">⏱ {item.timestamp}</div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No transcript available</p>
        )}
      </div>
    </div>
  )
}

export default Transcript

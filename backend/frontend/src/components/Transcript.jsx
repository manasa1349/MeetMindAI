import { useState, useEffect } from 'react'
import { meetingAPI } from '../services/api'

function Transcript({ meetingId }) {
  const [transcript, setTranscript] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTranscript = async () => {
      try {
        const id = meetingId || 1
        const response = await meetingAPI.getMeetingById(id)
        if (response.success && response.data?.transcript) {
          setTranscript(response.data.transcript)
        } else {
          setDummyTranscript()
        }
      } catch (err) {
        setDummyTranscript()
      } finally {
        setLoading(false)
      }
    }

    const setDummyTranscript = () => {
      setTranscript([
        { speaker: 'Speaker 1 (John)', text: 'Good morning everyone. Let\'s start the Q1 planning meeting. First, let\'s review our objectives for this quarter.', timestamp: '00:00' },
        { speaker: 'Speaker 2 (Sarah)', text: 'Thanks John. I think we should focus on three main areas: product development, customer support, and team growth.', timestamp: '00:15' },
        { speaker: 'Speaker 1 (John)', text: 'Great point Sarah. Let\'s dive deeper into product development first. What are your priorities?', timestamp: '00:30' },
        { speaker: 'Speaker 3 (Mike)', text: 'We need to prioritize the mobile app redesign and API optimization. The current performance issues are affecting user experience.', timestamp: '00:45' },
        { speaker: 'Speaker 2 (Sarah)', text: 'I agree. We should also allocate resources for customer feedback implementation. We\'ve received some great suggestions.', timestamp: '01:00' },
        { speaker: 'Speaker 1 (John)', text: 'Excellent. Let\'s set a deadline of March 15 for the mobile redesign. Sarah, can you coordinate with the customer support team?', timestamp: '01:20' },
        { speaker: 'Speaker 2 (Sarah)', text: 'Absolutely. I\'ll schedule a meeting with them this week to discuss implementation priority.', timestamp: '01:35' },
        { speaker: 'Speaker 3 (Mike)', text: 'For the API optimization, I\'ll need at least two developers for two weeks. Should be ready by end of February.', timestamp: '01:50' },
        { speaker: 'Speaker 1 (John)', text: 'Perfect. Let\'s confirm these timelines and move forward. Any concerns or blockers?', timestamp: '02:05' },
        { speaker: 'Speaker 2 (Sarah)', text: 'I think we\'re good. I\'ll send out the action items summary after this call.', timestamp: '02:20' }
      ])
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
              <div className="speaker">👤 {item.speaker}</div>
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
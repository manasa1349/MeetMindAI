import { useState, useEffect } from 'react'
import { meetingAPI } from '../services/api'

function Summary({ meetingId }) {
  const [meetingSummary, setMeetingSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const id = meetingId
        if (!id) {
          setMeetingSummary(null)
          return
        }
        const response = await meetingAPI.getMeetingById(id)
        if (response.success && response.data) {
          setMeetingSummary(response.data)
        } else {
          setMeetingSummary(null)
        }
      } catch (err) {
        setMeetingSummary(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [meetingId])

  return (
    <div className="summary-container">
      <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Meeting Summary</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        AI-generated analysis for the selected meeting
      </p>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading summary...</p>
      ) : meetingSummary ? (
        <>
          {/* Main Summary */}
          <div className="summary-content">
            <div className="summary-section">
              <h3 className="summary-heading">Meeting Overview</h3>
              <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                {meetingSummary.summary}
              </p>
            </div>

            {/* Important Points */}
            <div className="summary-section">
              <h3 className="summary-heading">Important Points</h3>
              <ul className="bullet-list">
                {meetingSummary.importantPoints && meetingSummary.importantPoints.map((point, index) => (
                  <li key={index} className="bullet-item">{point}</li>
                ))}
              </ul>
            </div>

            {/* Decisions */}
            <div className="summary-section">
              <h3 className="summary-heading">Decisions Taken</h3>
              <ul className="bullet-list">
                {meetingSummary.decisions && meetingSummary.decisions.map((decision, index) => (
                  <li key={index} className="bullet-item">{decision}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No summary available</p>
      )}
    </div>
  )
}

export default Summary

import { useState, useEffect } from 'react'
import { meetingAPI } from '../services/api'

function Summary({ meetingId }) {
  const [meetingSummary, setMeetingSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const id = meetingId || 1
        const response = await meetingAPI.getMeetingById(id)
        if (response.success && response.data) {
          setMeetingSummary(response.data)
        } else {
          setDummySummary()
        }
      } catch (err) {
        setDummySummary()
      } finally {
        setLoading(false)
      }
    }

    const setDummySummary = () => {
      setMeetingSummary({
        title: 'Q1 Planning Meeting',
        summary: 'The meeting focused on establishing Q1 priorities across three main areas: product development, customer support, and team growth. The team discussed upcoming projects including mobile app redesign and API optimization.',
        importantPoints: [
          'Mobile app redesign is a critical priority with March 15 deadline',
          'API optimization needed to improve user experience and performance',
          'Customer feedback implementation should be coordinated with support team',
          'Resource allocation: 2 developers for 2 weeks on API work',
          'Team growth initiatives need to be defined by end of month'
        ],
        decisions: [
          'Proceed with mobile app redesign starting immediately',
          'Prioritize customer feedback implementation in Q1',
          'Allocate resources for API optimization - deadline end of February',
          'Schedule customer support team meeting within this week',
          'All major features to be completed by end of Q1'
        ]
      })
    }

    fetchSummary()
  }, [])

  return (
    <div className="summary-container">
      <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Meeting Summary</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Comprehensive analysis of Q1 Planning Meeting
      </p>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading summary...</p>
      ) : meetingSummary ? (
        <>
          {/* Main Summary */}
          <div className="summary-content">
            <div className="summary-section">
              <h3 className="summary-heading">📋 Meeting Overview</h3>
              <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                {meetingSummary.summary}
              </p>
            </div>

            {/* Important Points */}
            <div className="summary-section">
              <h3 className="summary-heading">⭐ Important Points</h3>
              <ul className="bullet-list">
                {meetingSummary.importantPoints && meetingSummary.importantPoints.map((point, index) => (
                  <li key={index} className="bullet-item">{point}</li>
                ))}
              </ul>
            </div>

            {/* Decisions */}
            <div className="summary-section">
              <h3 className="summary-heading">✅ Decisions Taken</h3>
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
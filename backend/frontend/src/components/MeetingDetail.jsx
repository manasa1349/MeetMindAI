import { useState, useEffect } from 'react'
import { meetingAPI } from '../services/api'

function MeetingDetail({ meetingId, onNavigate }) {
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        setError('Failed to load meeting details.')
      } finally {
        setLoading(false)
      }
    }

    fetchMeeting()
  }, [meetingId])

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)' }}>Loading meeting details...</p>
  }

  if (error) {
    return <p style={{ color: 'var(--danger-color)' }}>{error}</p>
  }

  return (
    <div className="meeting-detail-container">
      <div className="meeting-detail-header">
        <h2>{meeting?.title || 'Meeting Detail'}</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{meeting?.description || 'No description available.'}</p>
      </div>

      <div className="meeting-detail-info">
        <div>
          <strong>Participants:</strong> {meeting?.participants || 0}
        </div>
        <div>
          <strong>Date:</strong> {meeting?.createdAt ? new Date(meeting.createdAt).toLocaleDateString() : 'N/A'}
        </div>
        <div>
          <strong>Status:</strong> {meeting?.aiProcessed ? 'Processed' : 'Pending'}
        </div>
      </div>

      <div className="meeting-detail-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => onNavigate('summary', meetingId)}>
          View Summary
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate('transcript', meetingId)}>
          View Transcript
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}

export default MeetingDetail

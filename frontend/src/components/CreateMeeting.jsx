import { useState } from 'react'
import { meetingAPI } from '../services/api'

function CreateMeeting({ onNavigate }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [participants, setParticipants] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await meetingAPI.createMeeting({
        title,
        date,
        participants: parseInt(participants),
        description
      })

      if (response.success) {
        setSuccess('Meeting created successfully!')
        setTitle('')
        setDate('')
        setParticipants('')
        setDescription('')
        setTimeout(() => onNavigate('dashboard'), 1500)
      } else {
        setError(response.message || 'Failed to create meeting')
      }
    } catch (err) {
      setError('Failed to create meeting. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h2 className="form-title">Create New Meeting</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Meeting Title</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter meeting title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Date & Time</label>
          <input
            type="datetime-local"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Number of Participants</label>
          <input
            type="number"
            className="form-input"
            placeholder="Enter number of participants"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            required
            min="1"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            placeholder="Enter meeting description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">✓ {success}</div>}

        <button type="submit" className="form-button" disabled={loading}>
          {loading ? 'Creating Meeting...' : 'Create Meeting'}
        </button>
      </form>
    </div>
  )
}

export default CreateMeeting
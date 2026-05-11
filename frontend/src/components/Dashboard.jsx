import { useState, useEffect } from 'react'
import { meetingAPI, actionItemAPI } from '../services/api'

function Dashboard({ onNavigate, userData }) {
  const [stats, setStats] = useState({
    totalMeetings: 0,
    transcriptsGenerated: 0,
    pendingActionItems: 0,
    completedTasks: 0
  })
  const [recentMeetings, setRecentMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [meetingStatusFilter, setMeetingStatusFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meetingsResponse = await meetingAPI.getAllMeetings()
        const actionItemsResponse = await actionItemAPI.getAllActionItems()

        setRecentMeetings(meetingsResponse.data || [])

        const pendingItems = actionItemsResponse.data?.filter(item => item.status !== 'completed').length || 0
        const completedItems = actionItemsResponse.data?.filter(item => item.status === 'completed').length || 0

        setStats({
          totalMeetings: meetingsResponse.data?.length || 0,
          transcriptsGenerated: meetingsResponse.data?.filter(m => m.transcript?.length > 0)?.length || 0,
          pendingActionItems: pendingItems,
          completedTasks: completedItems
        })
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setRecentMeetings([])
        setStats({
          totalMeetings: 0,
          transcriptsGenerated: 0,
          pendingActionItems: 0,
          completedTasks: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleMeetingClick = (meeting) => {
    onNavigate('meeting-room', meeting.id || meeting._id)
  }

  const filteredMeetings = recentMeetings.filter((meeting) => {
    const title = (meeting.title || '').toLowerCase()
    const description = (meeting.description || '').toLowerCase()
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = !query || title.includes(query) || description.includes(query)

    const isTranscribed = Boolean(meeting.transcript && meeting.transcript.length)
    const status = isTranscribed ? 'processed' : 'pending'
    const matchesStatus = meetingStatusFilter === 'all' || status === meetingStatusFilter

    return matchesSearch && matchesStatus
  })

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <div className="dashboard-header">
        <h1 className="welcome-text">Welcome, {userData?.name || 'User'}</h1>
        <p className="welcome-date">{getCurrentDate()}</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalMeetings}</div>
          <div className="stat-label">Total Meetings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.transcriptsGenerated}</div>
          <div className="stat-label">Transcripts Generated</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pendingActionItems}</div>
          <div className="stat-label">Pending Action Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completedTasks}</div>
          <div className="stat-label">Completed Tasks</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => onNavigate('create-meeting')}>
          Create meeting
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate('upload-meeting')}>
          Upload audio
        </button>
      </div>

      {/* Recent Meetings */}
      <div className="meetings-section">
        <h2 className="section-title">Recent Meetings</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search meetings by title or description"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ minWidth: '240px', flex: '1' }}
          />
          <select
            className="form-input"
            value={meetingStatusFilter}
            onChange={(e) => setMeetingStatusFilter(e.target.value)}
            style={{ minWidth: '180px' }}
          >
            <option value="all">All meetings</option>
            <option value="processed">Processed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading meetings...</p>
        ) : filteredMeetings.length > 0 ? (
          <div className="meetings-list">
            {filteredMeetings.slice(0, 5).map(meeting => {
              const meetingDate = meeting.date || meeting.createdAt || new Date().toISOString()
              const isTranscribed = Boolean(meeting.transcript && meeting.transcript.length)
              return (
                <div
                  key={meeting.id || meeting._id}
                  className="meeting-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleMeetingClick(meeting)}
                >
                  <h3 className="meeting-title">{meeting.title}</h3>
                  <p className="meeting-date">Scheduled {new Date(meetingDate).toLocaleDateString()}</p>
                  <p className="meeting-participants">{meeting.participants || 0} participants</p>
                  <p className="meeting-status">{isTranscribed ? 'Processed' : 'Pending analysis'}</p>
                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: '0.75rem' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMeetingClick(meeting)
                    }}
                  >
                    Open Meeting Room
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: '0.75rem', marginLeft: '0.75rem' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onNavigate('meeting-detail', meeting.id || meeting._id)
                    }}
                  >
                    View Details
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No meetings match your filters. Try a different search or create your first meeting!</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard

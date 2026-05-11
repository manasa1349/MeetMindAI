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
          transcriptsGenerated: meetingsResponse.data?.filter(m => m.transcript)?.length || 0,
          pendingActionItems: pendingItems,
          completedTasks: completedItems
        })
      } catch (error) {
        console.error('Failed to fetch data:', error)
        // Use dummy data for demo
        setRecentMeetings([
          { id: 1, title: 'Q1 Planning Meeting', date: '2024-01-15', participants: 5 },
          { id: 2, title: 'Product Roadmap Review', date: '2024-01-12', participants: 8 },
          { id: 3, title: 'Team Standup', date: '2024-01-10', participants: 4 }
        ])
        setStats({
          totalMeetings: 24,
          transcriptsGenerated: 18,
          pendingActionItems: 12,
          completedTasks: 15
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleMeetingClick = (meeting) => {
    onNavigate('meeting-detail', meeting.id || meeting._id)
  }

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
        <h1 className="welcome-text">Welcome, {userData?.name || 'User'}! 👋</h1>
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
          + Create New Meeting
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate('upload-meeting')}>
          ⬆ Upload Meeting
        </button>
      </div>

      {/* Recent Meetings */}
      <div className="meetings-section">
        <h2 className="section-title">Recent Meetings</h2>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading meetings...</p>
        ) : recentMeetings.length > 0 ? (
          <div className="meetings-list">
            {recentMeetings.slice(0, 5).map(meeting => {
              const meetingDate = meeting.date || meeting.createdAt || new Date().toISOString()
              return (
                <div
                  key={meeting.id || meeting._id}
                  className="meeting-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleMeetingClick(meeting)}
                >
                  <h3 className="meeting-title">{meeting.title}</h3>
                  <p className="meeting-date">📅 {new Date(meetingDate).toLocaleDateString()}</p>
                  <p className="meeting-participants">👥 {meeting.participants || 0} participants</p>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No meetings yet. Create your first meeting!</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard
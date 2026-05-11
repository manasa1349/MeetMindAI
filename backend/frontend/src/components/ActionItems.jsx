import { useState, useEffect } from 'react'
import { actionItemAPI } from '../services/api'

function ActionItems() {
  const [actionItems, setActionItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActionItems = async () => {
      try {
        const response = await actionItemAPI.getAllActionItems()
        if (response.success) {
          setActionItems(response.data)
        } else {
          setDummyActionItems()
        }
      } catch (err) {
        setDummyActionItems()
      } finally {
        setLoading(false)
      }
    }

    const setDummyActionItems = () => {
      setActionItems([
        {
          id: 1,
          task: 'Start Mobile App Redesign',
          assignedTo: 'Development Team',
          deadline: '2024-03-15',
          status: 'in-progress'
        },
        {
          id: 2,
          task: 'Optimize API Performance',
          assignedTo: 'Mike Johnson',
          deadline: '2024-02-28',
          status: 'in-progress'
        },
        {
          id: 3,
          task: 'Coordinate with Customer Support',
          assignedTo: 'Sarah Chen',
          deadline: '2024-01-22',
          status: 'pending'
        },
        {
          id: 4,
          task: 'Implement Customer Feedback',
          assignedTo: 'Product Team',
          deadline: '2024-03-31',
          status: 'pending'
        },
        {
          id: 5,
          task: 'Define Team Growth Initiatives',
          assignedTo: 'HR Department',
          deadline: '2024-01-31',
          status: 'pending'
        },
        {
          id: 6,
          task: 'Review and Test Mobile Changes',
          assignedTo: 'QA Team',
          deadline: '2024-03-20',
          status: 'pending'
        }
      ])
    }

    fetchActionItems()
  }, [])

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed'
      case 'in-progress':
        return 'status-inprogress'
      default:
        return 'status-pending'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return '✓ Completed'
      case 'in-progress':
        return '⏳ In Progress'
      default:
        return '⭕ Pending'
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const response = await actionItemAPI.updateActionItem(id, { status: newStatus })
      if (response.success) {
        setActionItems(actionItems.map(item =>
          item.id === id ? { ...item, status: newStatus } : item
        ))
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  return (
    <div className="action-items-container">
      <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Action Items</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Track and manage all meeting action items and tasks
      </p>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading action items...</p>
      ) : actionItems.length > 0 ? (
        <div className="tasks-grid">
          {actionItems.map(item => (
            <div key={item.id} className="task-card">
              <h3 className="task-title">{item.task}</h3>

              <div className="task-info">
                <div className="task-info-row">
                  <span className="task-label">👤 Assigned To:</span>
                  <span className="task-value">{item.assignedTo}</span>
                </div>

                <div className="task-info-row">
                  <span className="task-label">📅 Deadline:</span>
                  <span className="task-value">{new Date(item.deadline).toLocaleDateString()}</span>
                </div>

                <div className="task-info-row">
                  <span className="task-label">Status:</span>
                  <span className={`status-badge ${getStatusBadgeClass(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              </div>

              <div className="task-actions">
                {item.status !== 'completed' && (
                  <>
                    {item.status === 'pending' && (
                      <button
                        className="task-btn"
                        onClick={() => handleUpdateStatus(item.id, 'in-progress')}
                        title="Mark as in progress"
                      >
                        Start
                      </button>
                    )}
                    <button
                      className="task-btn"
                      onClick={() => handleUpdateStatus(item.id, 'completed')}
                      title="Mark as completed"
                    >
                      Complete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No action items yet</p>
      )}
    </div>
  )
}

export default ActionItems
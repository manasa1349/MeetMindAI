import { useState, useEffect } from 'react'
import { actionItemAPI } from '../services/api'

function ActionItems() {
  const [actionItems, setActionItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const fetchActionItems = async () => {
      try {
        const response = await actionItemAPI.getAllActionItems()
        if (response.success) {
          setActionItems(response.data)
        } else {
          setActionItems([])
        }
      } catch (err) {
        setActionItems([])
      } finally {
        setLoading(false)
      }
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
          (item._id || item.id) === id ? { ...item, status: newStatus } : item
        ))
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const filteredActionItems = actionItems.filter((item) => {
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !query ||
      (item.task || '').toLowerCase().includes(query) ||
      (item.assignedTo || '').toLowerCase().includes(query)

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="action-items-container">
      <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Action Items</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Track and manage all meeting action items and tasks
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search tasks or assignees"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ minWidth: '240px', flex: '1' }}
        />
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ minWidth: '180px' }}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading action items...</p>
      ) : filteredActionItems.length > 0 ? (
        <div className="tasks-grid">
          {filteredActionItems.map(item => (
            <div key={item._id || item.id} className="task-card">
              <h3 className="task-title">{item.task}</h3>

              <div className="task-info">
                <div className="task-info-row">
                  <span className="task-label">Assigned to</span>
                  <span className="task-value">{item.assignedTo}</span>
                </div>

                <div className="task-info-row">
                  <span className="task-label">Deadline</span>
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
                        onClick={() => handleUpdateStatus(item._id || item.id, 'in-progress')}
                        title="Mark as in progress"
                      >
                        Start
                      </button>
                    )}
                    <button
                      className="task-btn"
                      onClick={() => handleUpdateStatus(item._id || item.id, 'completed')}
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
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No action items match your filters</p>
      )}
    </div>
  )
}

export default ActionItems

const API_BASE_URL = 'http://localhost:5000/api'

// Helper function to handle API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('API call failed:', error)
    return {
      success: false,
      message: error.message
    }
  }
}

// Auth APIs
export const authAPI = {
  register: async (userData) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  },

  login: async (credentials) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
  }
}

// Meeting APIs
export const meetingAPI = {
  getAllMeetings: async () => {
    return apiCall('/meetings')
  },

  createMeeting: async (meetingData) => {
    return apiCall('/meetings', {
      method: 'POST',
      body: JSON.stringify(meetingData)
    })
  },

  getMeetingById: async (id) => {
    return apiCall(`/meetings/${id}`)
  },

  generateAI: async (id, audioFile) => {
    const formData = new FormData()
    formData.append('audioFile', audioFile)

    try {
      const response = await fetch(`${API_BASE_URL}/meetings/${id}/generate-ai`, {
        method: 'POST',
        body: formData
      })
      return await response.json()
    } catch (error) {
      console.error('Generate AI failed:', error)
      return { success: false, message: error.message }
    }
  },

  updateMeeting: async (id, updateData) => {
    return apiCall(`/meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    })
  },

  deleteMeeting: async (id) => {
    return apiCall(`/meetings/${id}`, {
      method: 'DELETE'
    })
  }
}

// Action Item APIs
export const actionItemAPI = {
  getAllActionItems: async () => {
    return apiCall('/action-items')
  },

  createActionItem: async (actionItemData) => {
    return apiCall('/action-items', {
      method: 'POST',
      body: JSON.stringify(actionItemData)
    })
  },

  updateActionItem: async (id, updateData) => {
    return apiCall(`/action-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    })
  },

  deleteActionItem: async (id) => {
    return apiCall(`/action-items/${id}`, {
      method: 'DELETE'
    })
  },

  getActionItemsByMeeting: async (meetingId) => {
    return apiCall(`/action-items?meetingId=${meetingId}`)
  }
}
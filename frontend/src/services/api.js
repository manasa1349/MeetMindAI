const API_BASE_URL =
  import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:7000/api`

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result || ''
      const base64 = String(result).split(',')[1] || ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

// Helper function to handle API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include',
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
    const res = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })

    return res
  },

  login: async (credentials) => {
    const res = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })

    return res
  },

  me: async () => {
    return apiCall('/auth/me')
  },

  logout: async () => {
    const response = await apiCall('/auth/logout', {
      method: 'POST'
    })

    localStorage.removeItem('user')
    return response
  }
}

// Meeting APIs
export const meetingAPI = {
  getAllMeetings: async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.status && filters.status !== 'all') params.set('status', filters.status)
    const query = params.toString()
    return apiCall(`/meetings${query ? `?${query}` : ''}`)
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

  getPublicMeetingById: async (id) => {
    return apiCall(`/meetings/public/${id}`)
  },

  getPublicMeetingMessages: async (id) => {
    return apiCall(`/meetings/public/${id}/messages`)
  },

  generateAI: async (id, audioFile, metadata = {}) => {
    try {
      let payload = {}

      if (audioFile instanceof Blob) {
        const audioBase64 = await blobToBase64(audioFile)
        payload = {
          audioBase64,
          audioFileName: audioFile.name || 'meeting-recording.webm',
          audioMimeType: audioFile.type || 'audio/webm',
          ...metadata
        }
      } else if (typeof audioFile === 'string') {
        payload = { audioBase64: audioFile, ...metadata }
      } else if (audioFile && typeof audioFile === 'object') {
        payload = { ...audioFile, ...metadata }
      }

      const response = await fetch(`${API_BASE_URL}/meetings/${id}/generate-ai`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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

export const logout = authAPI.logout

// Action Item APIs
export const actionItemAPI = {
  getAllActionItems: async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.status && filters.status !== 'all') params.set('status', filters.status)
    if (filters.meetingId) params.set('meetingId', filters.meetingId)
    const query = params.toString()
    return apiCall(`/action-items${query ? `?${query}` : ''}`)
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

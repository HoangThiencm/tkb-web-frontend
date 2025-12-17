/**
 * API client for backend communication
 */
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7860'

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    const response = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

// Units API
export const unitsAPI = {
    getAll: async () => {
        const response = await apiClient.get('/units')
        return response.data
    },
    // Thêm các method khác nếu cần
}

// Teachers API
export const teachersAPI = {
    getAll: async (unitId: number) => {
        const response = await apiClient.get(`/units/${unitId}/teachers`)
        return response.data
    },
    importData: async (unitId: number, data: any[]) => {
        const response = await apiClient.post(`/units/${unitId}/teachers/import`, data)
        return response.data
    },
    delete: async (id: string) => {
        const response = await apiClient.delete(`/teachers/${id}`)
        return response.data
    }
}

// Subjects API
export const subjectsAPI = {
    getAll: async (unitId: number) => {
        const response = await apiClient.get(`/units/${unitId}/subjects`)
        return response.data
    },
    importData: async (unitId: number, data: any[]) => {
        const response = await apiClient.post(`/units/${unitId}/subjects/import`, data)
        return response.data
    },
    delete: async (id: string) => {
        const response = await apiClient.delete(`/subjects/${id}`)
        return response.data
    }
}

// Classes API
export const classesAPI = {
    getAll: async (unitId: number) => {
        const response = await apiClient.get(`/units/${unitId}/classes`)
        return response.data
    },
    importData: async (unitId: number, data: any[]) => {
        const response = await apiClient.post(`/units/${unitId}/classes/import`, data)
        return response.data
    },
    delete: async (id: string) => {
        const response = await apiClient.delete(`/classes/${id}`)
        return response.data
    }
}

// Timetable/Sessions API
export const sessionsAPI = {
  getSessions: async (unitId: number, schoolYear: string) => {
    const response = await apiClient.get('/timetable/sessions', {
      params: { unit_id: unitId, school_year: schoolYear },
    })
    return response.data
  },
  getSessionData: async (sessionId: number) => {
    const response = await apiClient.get(`/timetable/sessions/${sessionId}`)
    return response.data
  },
  createSession: async (unitId: number, schoolYear: string, sessionData: { session_name: string; effective_date?: string; timetable?: any }) => {
    // Backend expects session object with timetable field
    const response = await apiClient.post(
      `/timetable/sessions?unit_id=${unitId}&school_year=${schoolYear}`,
      {
        session_name: sessionData.session_name,
        effective_date: sessionData.effective_date || new Date().toISOString().split('T')[0],
        timetable: sessionData.timetable || {},
      }
    )
    return response.data
  },
  toggleLock: async (sessionId: number, isLocked: boolean) => {
    const response = await apiClient.put(`/timetable/sessions/${sessionId}/lock`, null, {
      params: { is_locked: isLocked },
    })
    return response.data
  },
  deleteSession: async (sessionId: number) => {
    const response = await apiClient.delete(`/timetable/sessions/${sessionId}`)
    return response.data
  },
}

// Solver API
export const solverAPI = {
    // ... code solver API của bạn ...
    triggerSolver: async (sessionId: number, params: any) => {
         const response = await apiClient.post(`/solver/solve/${sessionId}`, params)
         return response.data
    },
    getStatus: async (taskId: string) => {
         const response = await apiClient.get(`/solver/status/${taskId}`)
         return response.data
    }
}

export default apiClient

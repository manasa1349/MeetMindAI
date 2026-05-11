import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import CreateMeeting from './components/CreateMeeting'
import UploadMeeting from './components/UploadMeeting'
import Transcript from './components/Transcript'
import Summary from './components/Summary'
import ActionItems from './components/ActionItems'
import MeetingDetail from './components/MeetingDetail'
import MeetingRoom from './components/MeetingRoomEnhanced'
import './App.css'
import { authAPI } from './services/api'

const LAST_PAGE_KEY = 'meetmind_last_page'
const LAST_MEETING_ID_KEY = 'meetmind_last_meeting_id'

const protectedPages = ['dashboard', 'create-meeting', 'upload-meeting', 'meeting-detail', 'transcript', 'summary', 'action-items']

const readNavigationState = () => {
  const params = new URLSearchParams(window.location.search)
  const page = params.get('page') || params.get('view') || localStorage.getItem(LAST_PAGE_KEY) || 'home'
  const meetingId = params.get('meetingId') || params.get('meeting') || localStorage.getItem(LAST_MEETING_ID_KEY)

  return { page, meetingId }
}

const updateBrowserUrl = (page, meetingId = null) => {
  const url = new URL(window.location.href)

  if (page === 'home') {
    url.search = ''
  } else {
    url.searchParams.set('page', page)

    if (meetingId !== null && meetingId !== undefined) {
      url.searchParams.set('meetingId', String(meetingId))
    } else {
      url.searchParams.delete('meetingId')
    }
  }

  window.history.pushState({}, '', url)
}

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState(null)
  const [selectedMeetingId, setSelectedMeetingId] = useState(null)
  const [pendingPage, setPendingPage] = useState(null)

  // Check if the cookie-backed session is still active.
  useEffect(() => {
    const initializeSession = async () => {
      const { page: storedPage, meetingId: storedMeetingId } = readNavigationState()

      if (storedMeetingId) {
        setSelectedMeetingId(storedMeetingId)
      }

      const session = await authAPI.me()
      const hasSession = Boolean(session.success && session.user)

      if (hasSession) {
        setIsLoggedIn(true)
        setUserData(session.user)
        localStorage.setItem('user', JSON.stringify(session.user))
      } else {
        localStorage.removeItem('user')
      }

      if (storedPage) {
        setCurrentPage(storedPage)
        if (protectedPages.includes(storedPage) && !hasSession) {
          setPendingPage(storedPage)
          setCurrentPage('login')
        }
      }
    }

    initializeSession()
  }, [])

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserData(null)
    localStorage.removeItem('user')
    localStorage.removeItem(LAST_PAGE_KEY)
    localStorage.removeItem(LAST_MEETING_ID_KEY)
    updateBrowserUrl('home')
    authAPI.logout()
    setCurrentPage('home')
  }

  // Handle login success
  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true)
    setUserData(user)
    localStorage.setItem('user', JSON.stringify(user))
    updateBrowserUrl(pendingPage || 'dashboard', selectedMeetingId)
    setCurrentPage(pendingPage || 'dashboard')
    setPendingPage(null)
  }

  // Handle navigation
  const handleNavigate = (page, meetingId = null) => {
    if (protectedPages.includes(page) && !isLoggedIn) {
      setPendingPage(page)
      setCurrentPage('login')
      return
    }

    setCurrentPage(page)

    localStorage.setItem(LAST_PAGE_KEY, page)

    updateBrowserUrl(page, meetingId)

    if (meetingId !== null && meetingId !== undefined) {
      setSelectedMeetingId(meetingId)
      localStorage.setItem(LAST_MEETING_ID_KEY, String(meetingId))
    }
  }

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />
      case 'login':
        return <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
      case 'register':
        return <Register onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
      case 'dashboard':
        return isLoggedIn ? <Dashboard onNavigate={handleNavigate} userData={userData} /> : <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
      case 'create-meeting':
        return isLoggedIn ? <CreateMeeting onNavigate={handleNavigate} /> : <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
      case 'upload-meeting':
        return isLoggedIn ? <UploadMeeting onNavigate={handleNavigate} /> : <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
      case 'meeting-detail':
        return isLoggedIn ? <MeetingDetail meetingId={selectedMeetingId} onNavigate={handleNavigate} /> : <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
      case 'meeting-room':
        return <MeetingRoom meetingId={selectedMeetingId} onNavigate={handleNavigate} userData={userData} />
      case 'transcript':
        return isLoggedIn ? <Transcript meetingId={selectedMeetingId} onNavigate={handleNavigate} /> : <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
      case 'summary':
        return isLoggedIn ? <Summary meetingId={selectedMeetingId} onNavigate={handleNavigate} /> : <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
      case 'action-items':
        return isLoggedIn ? <ActionItems onNavigate={handleNavigate} /> : <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />
      default:
        return <Home onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="app-container">
      <Navbar 
        currentPage={currentPage} 
        onNavigate={handleNavigate} 
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />
      <main className="main-content">
        {renderPage()}
      </main>
      <Footer />
    </div>
  )
}

export default App

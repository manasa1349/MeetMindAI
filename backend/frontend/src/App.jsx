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
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState(null)
  const [selectedMeetingId, setSelectedMeetingId] = useState(null)

  // Check if user is logged in from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setIsLoggedIn(true)
      setUserData(JSON.parse(storedUser))
    }
  }, [])

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserData(null)
    localStorage.removeItem('user')
    setCurrentPage('home')
  }

  // Handle login success
  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true)
    setUserData(user)
    localStorage.setItem('user', JSON.stringify(user))
    setCurrentPage('dashboard')
  }

  // Handle navigation
  const handleNavigate = (page, meetingId = null) => {
    setCurrentPage(page)
    if (meetingId !== null && meetingId !== undefined) {
      setSelectedMeetingId(meetingId)
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
function Navbar({ currentPage, onNavigate, isLoggedIn, onLogout }) {
  const pages = [
    { id: 'home', label: 'Home' },
    { id: 'login', label: 'Login', hideWhenLoggedIn: true },
    { id: 'register', label: 'Register', hideWhenLoggedIn: true },
    { id: 'dashboard', label: 'Dashboard', requireLogin: true },
    { id: 'create-meeting', label: 'Create Meeting', requireLogin: true },
    { id: 'upload-meeting', label: 'Upload Meeting', requireLogin: true },
  ]

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => onNavigate('home')}>
        MeetMind AI
      </div>
      <div className="navbar-links">
        {pages.map(page => {
          if (page.hideWhenLoggedIn && isLoggedIn) return null
          if (page.requireLogin && !isLoggedIn) return null

          return (
            <button
              key={page.id}
              className={`navbar-link ${currentPage === page.id ? 'active' : ''}`}
              onClick={() => onNavigate(page.id)}
            >
              {page.label}
            </button>
          )
        })}
        {isLoggedIn && (
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navbar
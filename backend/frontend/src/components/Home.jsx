function Home({ onNavigate }) {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">MeetMind AI</h1>
          <p className="hero-subtitle">
            AI-powered collaborative meeting workspace. Transcribe, summarize, and organize your meetings intelligently.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => onNavigate('register')}>
              Get Started
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('login')}>
              View Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="features-title">Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎤</div>
            <h3 className="feature-title">AI Transcription</h3>
            <p className="feature-description">
              Automatically transcribe meeting audio with high accuracy using advanced AI technology.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3 className="feature-title">Smart Summary</h3>
            <p className="feature-description">
              Get intelligent summaries of your meetings including key points and decisions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3 className="feature-title">Action Item Detection</h3>
            <p className="feature-description">
              Automatically identify and track action items assigned during meetings.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3 className="feature-title">Team Collaboration</h3>
            <p className="feature-description">
              Collaborate with your team in real-time and share meeting insights effortlessly.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3 className="feature-title">Search & Analysis</h3>
            <p className="feature-description">
              Quickly search through transcripts and analyze meeting patterns over time.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Analytics Dashboard</h3>
            <p className="feature-description">
              View comprehensive analytics about your meetings and team productivity.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
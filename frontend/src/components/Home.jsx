function Home({ onNavigate }) {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-kicker">Collaborative meeting intelligence</span>
          <h1 className="hero-title">MeetMind AI</h1>
          <p className="hero-subtitle">
            A focused workspace for live rooms, searchable transcripts, AI summaries, decisions, and accountable follow-up.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => onNavigate('register')}>
              Create workspace
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('login')}>
              Open dashboard
            </button>
          </div>
        </div>

        <div className="workspace-preview" aria-label="MeetMind workspace preview">
          <div className="preview-sidebar">
            <div className="preview-brand">MeetMind</div>
            <div className="preview-nav active">Live room</div>
            <div className="preview-nav">Transcripts</div>
            <div className="preview-nav">Action items</div>
            <div className="preview-nav">Search</div>
          </div>
          <div className="preview-main">
            <div className="preview-topbar">
              <div>
                <strong>Product sync</strong>
                <span>Recording and summarizing</span>
              </div>
              <button className="preview-pill">Live</button>
            </div>
            <div className="preview-grid">
              <div className="preview-video large">AK</div>
              <div className="preview-video">SC</div>
              <div className="preview-video">MJ</div>
            </div>
            <div className="preview-insights">
              <div>
                <span className="preview-label">Summary</span>
                <p>Launch scope confirmed. API reliability and onboarding copy are the main blockers.</p>
              </div>
              <div>
                <span className="preview-label">Next action</span>
                <p>Sarah owns customer migration notes for Friday review.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section product-section">
        <div className="section-heading">
          <span className="hero-kicker">Built for the meeting lifecycle</span>
          <h2 className="features-title">From conversation to decisions</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon-text">01</span>
            <h3 className="feature-title">Live meeting room</h3>
            <p className="feature-description">
              WebRTC rooms, presence, camera and microphone state, guest links, and persistent meeting chat.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon-text">02</span>
            <h3 className="feature-title">AI meeting memory</h3>
            <p className="feature-description">
              Transcripts, summaries, topics, entities, decisions, and extracted action items stored with the meeting.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon-text">03</span>
            <h3 className="feature-title">Searchable history</h3>
            <p className="feature-description">
              User-scoped APIs and text indexes keep transcript and meeting history discoverable.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

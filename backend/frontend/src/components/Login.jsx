import { useState } from 'react'
import { authAPI } from '../services/api'

function Login({ onNavigate, onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login({ email, password })
      
      if (response.success) {
        onLoginSuccess(response.user)
      } else {
        setError(response.message || 'Login failed')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h2 className="form-title">Login</h2>

      <div className="demo-note">
        📌 Demo Mode: Use any email/password. This is a frontend demo.
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="form-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="form-link">
        Don't have an account? <a onClick={() => onNavigate('register')}>Register here</a>
      </div>
    </div>
  )
}

export default Login
import { useState } from 'react'
import { authAPI } from '../services/api'

function Register({ onNavigate, onLoginSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.register({ name, email, password })
      
      if (response.success) {
        onLoginSuccess(response.user)
      } else {
        setError(response.message || 'Registration failed')
      }
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h2 className="form-title">Register</h2>

      <div className="demo-note">
        📌 Demo Mode: Create any account. This is a frontend demo.
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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

        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="form-button" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <div className="form-link">
        Already have an account? <a onClick={() => onNavigate('login')}>Login here</a>
      </div>
    </div>
  )
}

export default Register
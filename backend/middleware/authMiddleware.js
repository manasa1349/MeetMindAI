import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret'
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'change_this_secret') {
  throw new Error('JWT_SECRET must be set in production')
}

const parseCookies = (cookieHeader = '') => {
  return cookieHeader.split(';').reduce((accumulator, cookie) => {
    const [rawKey, ...rawValue] = cookie.trim().split('=')
    if (!rawKey) return accumulator

    const key = rawKey.trim()
    const value = rawValue.join('=').trim()

    if (key) {
      accumulator[key] = decodeURIComponent(value || '')
    }

    return accumulator
  }, {})
}

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization
    const cookieToken = req.cookies?.meetmind_token || parseCookies(req.headers.cookie || '').meetmind_token
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null
    const token = bearerToken || cookieToken

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token missing' })
    }

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' })
    }

    // Attach minimal user info to request
    const user = await User.findById(decoded.id).select('-password')
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    req.user = user
    req.authToken = token
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({ success: false, message: 'Authentication failed' })
  }
}

export default requireAuth

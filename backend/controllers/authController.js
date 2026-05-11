import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret'
if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'change_this_secret') {
  throw new Error('JWT_SECRET must be set in production')
}

const AUTH_COOKIE_NAME = 'meetmind_token'
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
}

const createAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS)
}

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { ...AUTH_COOKIE_OPTIONS, maxAge: undefined })
}

// Register controller
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    const normalizedEmail = String(email || '').trim().toLowerCase()

    // Validate input
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      })
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      })
    }

    // Hash password
    const saltRounds = 10
    const hashed = await bcrypt.hash(password, saltRounds)

    // Create new user
    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashed
    })

    const savedUser = await newUser.save()

    console.log('User registered:', savedUser.email)

    // Generate JWT
    const token = jwt.sign({ id: savedUser._id, email: savedUser.email }, JWT_SECRET, {
      expiresIn: '7d'
    })

    createAuthCookie(res, token)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    })
  }
}

// Login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = String(email || '').trim().toLowerCase()

    // Validate input
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      })
    }

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Check password using bcrypt, with a legacy plaintext fallback for seeded/demo users.
    const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password)
    const match = isBcryptHash ? await bcrypt.compare(password, user.password) : user.password === password

    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    if (!isBcryptHash) {
      user.password = await bcrypt.hash(password, 10)
      await user.save()
    }

    console.log('User logged in:', user.email)

    // Generate JWT
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d'
    })

    createAuthCookie(res, token)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    })
  }
}

export const logout = async (req, res) => {
  try {
    clearAuthCookie(res)

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    })
  }
}

export const me = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current user',
      error: error.message
    })
  }
}

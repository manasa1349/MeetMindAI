import User from '../models/User.js'

// Register controller
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      })
    }

    // Create new user (password stored as plain text for demo)
    const newUser = new User({
      name,
      email,
      password
    })

    const savedUser = await newUser.save()

    console.log('User registered:', savedUser)

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

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      })
    }

    // Find user by email
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Check password (simple comparison for demo)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    console.log('User logged in:', user.email)

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
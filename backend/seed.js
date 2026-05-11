import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/User.js'
import Meeting from './models/Meeting.js'
import ActionItem from './models/ActionItem.js'
import bcrypt from 'bcryptjs'

dotenv.config()

const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGODB_URI || 'mongodb://localhost:27017/meetmind-ai'
    await mongoose.connect(mongoURL)
    console.log('MongoDB connected for seeding')
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1)
  }
}

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({})
    await Meeting.deleteMany({})
    await ActionItem.deleteMany({})
    console.log('Cleared existing data')

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10)

    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword
    })

    const user2 = await User.create({
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      password: hashedPassword
    })

    console.log('✓ Sample users created')

    // Create sample meetings
    const meeting1 = await Meeting.create({
      title: 'Q1 Planning Meeting',
      date: new Date('2024-01-15'),
      participants: 5,
      description: 'Quarterly planning and objective setting',
      userId: user1._id,
      transcript: [
        { speaker: 'Speaker 1 (John)', text: 'Good morning everyone. Let\'s start the Q1 planning meeting. First, let\'s review our objectives for this quarter.', timestamp: '00:00' },
        { speaker: 'Speaker 2 (Sarah)', text: 'Thanks John. I think we should focus on three main areas: product development, customer support, and team growth.', timestamp: '00:15' },
        { speaker: 'Speaker 1 (John)', text: 'Great point Sarah. Let\'s dive deeper into product development first. What are your priorities?', timestamp: '00:30' },
        { speaker: 'Speaker 3 (Mike)', text: 'We need to prioritize the mobile app redesign and API optimization. The current performance issues are affecting user experience.', timestamp: '00:45' },
        { speaker: 'Speaker 2 (Sarah)', text: 'I agree. We should also allocate resources for customer feedback implementation. We\'ve received some great suggestions.', timestamp: '01:00' },
        { speaker: 'Speaker 1 (John)', text: 'Excellent. Let\'s set a deadline of March 15 for the mobile redesign. Sarah, can you coordinate with the customer support team?', timestamp: '01:20' },
        { speaker: 'Speaker 2 (Sarah)', text: 'Absolutely. I\'ll schedule a meeting with them this week to discuss implementation priority.', timestamp: '01:35' },
        { speaker: 'Speaker 3 (Mike)', text: 'For the API optimization, I\'ll need at least two developers for two weeks. Should be ready by end of February.', timestamp: '01:50' },
        { speaker: 'Speaker 1 (John)', text: 'Perfect. Let\'s confirm these timelines and move forward. Any concerns or blockers?', timestamp: '02:05' },
        { speaker: 'Speaker 2 (Sarah)', text: 'I think we\'re good. I\'ll send out the action items summary after this call.', timestamp: '02:20' }
      ],
      summary: 'The meeting focused on establishing Q1 priorities across three main areas: product development, customer support, and team growth. The team discussed upcoming projects including mobile app redesign and API optimization.',
      importantPoints: [
        'Mobile app redesign is a critical priority with March 15 deadline',
        'API optimization needed to improve user experience and performance',
        'Customer feedback implementation should be coordinated with support team',
        'Resource allocation: 2 developers for 2 weeks on API work',
        'Team growth initiatives need to be defined by end of month'
      ],
      decisions: [
        'Proceed with mobile app redesign starting immediately',
        'Prioritize customer feedback implementation in Q1',
        'Allocate resources for API optimization - deadline end of February',
        'Schedule customer support team meeting within this week',
        'All major features to be completed by end of Q1'
      ]
    })

    const meeting2 = await Meeting.create({
      title: 'Product Roadmap Review',
      date: new Date('2024-01-12'),
      participants: 8,
      description: 'Review of product roadmap for upcoming releases',
      userId: user2._id,
      transcript: [
        { speaker: 'Speaker 1 (Sarah)', text: 'Hello team, let\'s review the product roadmap for Q1 and Q2.', timestamp: '00:00' },
        { speaker: 'Speaker 2 (Mike)', text: 'We have several features lined up. Let\'s prioritize them.', timestamp: '00:15' }
      ],
      summary: 'Product roadmap was reviewed with focus on upcoming features and releases.',
      importantPoints: [
        'New dashboard redesign planned',
        'Mobile app version 2.0 release',
        'Analytics integration required'
      ],
      decisions: [
        'Dashboard redesign starts next week',
        'Mobile v2.0 targets February launch',
        'Analytics team to be assigned'
      ]
    })

    const meeting3 = await Meeting.create({
      title: 'Team Standup',
      date: new Date('2024-01-10'),
      participants: 4,
      description: 'Daily team standup meeting',
      userId: user1._id,
      transcript: [
        { speaker: 'Speaker 1', text: 'Good morning team. Let\'s do a quick standup.', timestamp: '00:00' },
        { speaker: 'Speaker 2', text: 'I completed the API documentation yesterday.', timestamp: '00:10' }
      ],
      summary: 'Daily standup covering team progress and blockers.',
      importantPoints: [
        'API documentation completed',
        'Testing phase underway',
        'No blockers reported'
      ],
      decisions: [
        'Continue with current sprint tasks',
        'Code review scheduled for tomorrow'
      ]
    })

    console.log('✓ Sample meetings created')

    // Create sample action items
    await ActionItem.create([
      {
        task: 'Start Mobile App Redesign',
        assignedTo: 'Development Team',
        deadline: new Date('2024-03-15'),
        status: 'in-progress',
        meetingId: meeting1._id,
        userId: user1._id
      },
      {
        task: 'Optimize API Performance',
        assignedTo: 'Mike Johnson',
        deadline: new Date('2024-02-28'),
        status: 'in-progress',
        meetingId: meeting1._id,
        userId: user1._id
      },
      {
        task: 'Coordinate with Customer Support',
        assignedTo: 'Sarah Chen',
        deadline: new Date('2024-01-22'),
        status: 'pending',
        meetingId: meeting1._id,
        userId: user1._id
      },
      {
        task: 'Implement Customer Feedback',
        assignedTo: 'Product Team',
        deadline: new Date('2024-03-31'),
        status: 'pending',
        meetingId: meeting1._id,
        userId: user1._id
      },
      {
        task: 'Define Team Growth Initiatives',
        assignedTo: 'HR Department',
        deadline: new Date('2024-01-31'),
        status: 'pending',
        meetingId: meeting1._id,
        userId: user1._id
      },
      {
        task: 'Review and Test Mobile Changes',
        assignedTo: 'QA Team',
        deadline: new Date('2024-03-20'),
        status: 'pending',
        meetingId: meeting1._id,
        userId: user1._id
      },
      {
        task: 'Dashboard Redesign Implementation',
        assignedTo: 'Frontend Team',
        deadline: new Date('2024-02-10'),
        status: 'pending',
        meetingId: meeting2._id,
        userId: user2._id
      },
      {
        task: 'Analytics Integration Setup',
        assignedTo: 'Analytics Team',
        deadline: new Date('2024-02-15'),
        status: 'pending',
        meetingId: meeting2._id,
        userId: user2._id
      }
    ])

    console.log('✓ Sample action items created')

    console.log('\n✅ Database seeding completed successfully!')
    console.log('\n📝 Sample Login Credentials:')
    console.log('================================')
    console.log('Email: john@example.com')
    console.log('Password: password123')
    console.log('================================')
    console.log('Email: sarah@example.com')
    console.log('Password: password123')
    console.log('================================\n')

    mongoose.connection.close()
  } catch (error) {
    console.error('Seeding error:', error)
    mongoose.connection.close()
    process.exit(1)
  }
}

connectDB().then(() => {
  seedDatabase()
})
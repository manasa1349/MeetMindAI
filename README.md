# MeetMind AI - Full Stack Application

MeetMind AI is a complete full-stack web application for AI-powered collaborative meeting management. Users can record/upload meetings, generate AI-powered transcripts, summaries, and track action items.

## Features

* User Authentication (Register/Login)
* Create and Manage Meetings
* Upload or Record Meeting Audio
* AI-Generated Transcripts
* AI-Powered Meeting Summaries
* Automatic Action Item Detection
* Dashboard with Analytics
* Responsive UI (Mobile & Desktop)
* Beautiful Modern Design

## Tech Stack

### Frontend

* Framework: React 18+ with Vite
* Styling: Pure CSS
* State Management: React Hooks
* API Communication: Fetch API
* Responsive Design

### Backend

* Runtime: Node.js
* Framework: Express.js
* Database: MongoDB with Mongoose
* Authentication: Session-based Authentication
* API: RESTful APIs

### AI Services

* Speech-to-Text Transcription
* NLP-based Summarization
* Action Item Extraction
* Key Point Extraction

## Project Structure

```bash
meetmind-ai/
├── frontend/
├── backend/
└── README.md
```

## Quick Start

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/meetmind-ai
PORT=7000
NODE_ENV=development
```

## API Endpoints

### Authentication

* POST /api/auth/register
* POST /api/auth/login

### Meetings

* GET /api/meetings
* POST /api/meetings
* GET /api/meetings/:id
* PUT /api/meetings/:id
* DELETE /api/meetings/:id

### Action Items

* GET /api/action-items
* POST /api/action-items
* PUT /api/action-items/:id
* DELETE /api/action-items/:id

## Application Modules

### Home Page

* Hero Section
* Feature Cards
* Modern Responsive Design

### Authentication

* Register User
* Login User
* Session Handling

### Dashboard

* Meeting Statistics
* Recent Meetings
* Quick Actions

### Meeting Management

* Create Meetings
* Upload Audio
* Record Audio
* View Meeting Details

### Transcript Viewer

* Speaker-wise Transcript
* Timestamps
* Conversation Timeline

### Summary Section

* Meeting Summary
* Important Points
* Decisions
* Structured Output

### Action Items

* Task Assignment
* Deadline Tracking
* Status Management

## Security Improvements for Production

* Password Hashing
* JWT Authentication
* Input Validation
* HTTPS
* Rate Limiting
* Environment Variable Protection

## Responsive Design

* Desktop Support
* Tablet Support
* Mobile Support

## Future Enhancements

* Real AI Integration
* Cloud File Upload
* Real-time Collaboration
* Notifications
* Advanced Analytics
* Search Functionality
* Team Management
* Payment Integration

## License

MIT License

## Contributing

1. Fork Repository
2. Create Feature Branch
3. Commit Changes
4. Create Pull Request

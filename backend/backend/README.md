# MeetMind AI Backend

## Overview
MeetMind AI is a full-stack web application designed to facilitate seamless meeting management and collaboration. The backend is built using Node.js and Express.js, providing a robust API for the frontend to interact with.

## Tech Stack
- **Node.js**: JavaScript runtime for building server-side applications.
- **Express.js**: Web framework for Node.js to build APIs.
- **MongoDB**: NoSQL database for storing application data.
- **TypeScript**: Superset of JavaScript that adds static types.

## Folder Structure
```
backend
├── src
│   ├── controllers         # Contains request handlers
│   ├── routes              # Defines API routes
│   ├── middleware          # Middleware functions for request handling
│   ├── models              # Mongoose models for data schemas
│   ├── utils               # Utility functions
│   ├── types               # TypeScript types and interfaces
│   └── app.ts              # Main entry point for the application
├── package.json            # Backend dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # Documentation for the backend
```

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- MongoDB (local or cloud instance)

### Installation
1. Navigate to the backend directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```

### Running the Application
1. Start the server:
   ```
   npm run start
   ```
2. The server will run on `http://localhost:5000` by default.

### MongoDB Setup
- Ensure that your MongoDB instance is running.
- Update the connection string in `src/app.ts` to point to your MongoDB database.

## API Endpoints
- **Authentication**
  - POST `/api/auth/login`: Log in a user.
  - POST `/api/auth/register`: Register a new user.
  
- **Meetings**
  - GET `/api/meetings`: Retrieve all meetings.
  - POST `/api/meetings`: Create a new meeting.
  
- **Action Items**
  - GET `/api/action-items`: Retrieve all action items.
  - POST `/api/action-items`: Create a new action item.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.
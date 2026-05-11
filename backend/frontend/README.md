# MeetMind AI

## Project Overview
MeetMind AI is a full-stack web application designed to facilitate meetings, manage action items, and provide a seamless user experience. The application is built using React for the frontend and Node.js with Express for the backend.

## Tech Stack
- **Frontend**: React, Vite, TypeScript
- **Backend**: Node.js, Express, MongoDB
- **Styling**: CSS

## Folder Structure
```
meetmind-ai
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── hooks
│   │   ├── services
│   │   ├── styles
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── README.md
├── backend
│   ├── src
│   │   ├── controllers
│   │   ├── routes
│   │   ├── middleware
│   │   ├── models
│   │   ├── utils
│   │   ├── types
│   │   └── app.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
└── README.md
```

## Setup Instructions

### Frontend
1. Navigate to the `frontend` directory:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

### Backend
1. Navigate to the `backend` directory:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm run start
   ```

## MongoDB Setup
Ensure you have MongoDB installed and running. Update the connection string in the backend configuration to point to your MongoDB instance.

## Running the Project
After setting up both the frontend and backend, you can access the application at `http://localhost:3000` for the frontend and `http://localhost:5000` for the backend API.

## Contributing
Feel free to fork the repository and submit pull requests for any improvements or features you would like to add.
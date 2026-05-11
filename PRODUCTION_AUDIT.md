# MeetMind AI Production Audit

Date: 2026-05-11

## Current Architecture

MeetMind AI is a Vite React frontend and Express/MongoDB backend. The active runtime paths are JavaScript files: `frontend/src/main.jsx`, `frontend/src/App.jsx`, and `backend/server.js`. Parallel TypeScript scaffolds exist under `frontend/src/*.tsx`, `frontend/src/services/api.ts`, and `backend/src/*`, but those paths are not wired into the current app.

The backend exposes REST APIs for auth, meetings, and action items. It also hosts Socket.IO for room presence, chat, and WebRTC signaling. MongoDB is accessed through Mongoose models: `User`, `Meeting`, and `ActionItem`.

## Request Flow

1. Browser loads the Vite app.
2. `App.jsx` checks `/api/auth/me` using an HTTP-only cookie.
3. Authenticated pages call `frontend/src/services/api.js`.
4. Vite proxies `/api` to `http://localhost:7000` locally, or the browser calls `VITE_API_URL`/hostname-derived backend URL.
5. Express routes call controllers, controllers call Mongoose, and responses return `{ success, data }`.

## Real-Time Flow

1. Meeting room connects to Socket.IO using `VITE_SOCKET_URL` or `hostname:7000`.
2. Client emits `join-room` with `roomId` and user display info.
3. Server stores participant metadata on `socket.data`, joins a Socket.IO room, and broadcasts participant updates.
4. WebRTC offers, answers, and ICE candidates are passed peer-to-peer through the `signal` socket event.
5. Media streams are browser-to-browser mesh WebRTC, not SFU-based.
6. Chat is broadcast through Socket.IO, but messages are not persisted.

## AI Pipeline Flow

1. Upload or meeting-room recording sends base64 audio to `POST /api/meetings/:id/generate-ai`.
2. Backend calls `aiService.generateTranscript`.
3. If `OPENAI_API_KEY` exists, the service calls OpenAI audio transcription. Otherwise it uses transcript text or a fallback.
4. Backend calls `generateMeetingInsights`.
5. Insights are persisted to the meeting. After this pass, AI action items, topics, and entities are also persisted.

## Database Flow

MongoDB stores users, meetings, and action items. Originally meeting and action item read routes were global. This has been changed to owner-scoped queries through `req.user._id`. Indexes were added for user/date/status lookup and text search.

## Deployment Structure

There is no Dockerfile, docker-compose file, CI pipeline, process manager config, or production reverse-proxy config in the current project. Local deployment is Node plus Vite plus MongoDB. Ngrok can expose frontend and backend separately, but production needs HTTPS, stable origins, and external MongoDB.

## Existing UI Architecture

The UI is a single React state-machine router in `App.jsx`, not React Router. Components are page-level screens under `frontend/src/components`. CSS is global and component-specific for the meeting room. There is no design-system component layer, no centralized state manager, and no typed API contract.

## Feature Audit

| Feature | Exists? | Partial? | Fake/Static? | Files Used | How It Works | Production Ready? |
|---|---:|---:|---:|---|---|---:|
| Authentication | Yes | Yes | No | `authController.js`, `authMiddleware.js`, `Login.jsx`, `Register.jsx` | JWT in HTTP-only cookie, bcrypt passwords | Partial |
| Meeting CRUD | Yes | Yes | No | `meetingRoutes.js`, `meetingController.js`, `Meeting.js` | Authenticated users create/read/update/delete own meetings | Partial |
| Meeting rooms | Yes | Yes | No | `MeetingRoomEnhanced.jsx`, `server.js` | Socket room plus browser media | Partial |
| Real-time presence | Yes | Yes | No | `server.js`, `MeetingRoomEnhanced.jsx` | Socket.IO room membership | Partial |
| WebRTC calls | Yes | Yes | No | `MeetingRoomEnhanced.jsx`, `server.js` | Mesh peer connections via Socket.IO signaling | Not at scale |
| Live chat | Yes | Yes | No | `MeetingRoomEnhanced.jsx`, `server.js` | Socket broadcast only | No, not persisted |
| AI transcription | Yes | Yes | Fallback exists | `aiService.js`, `meetingController.js` | OpenAI audio API when configured; fallback otherwise | Partial |
| Summarization | Yes | Yes | Fallback exists | `aiService.js` | OpenAI JSON summary or local heuristic | Partial |
| NER | Added basic | Yes | Heuristic fallback | `aiService.js`, `Meeting.js` | Extracts simple entities into meeting | No |
| Action extraction | Added | Yes | Heuristic fallback | `aiService.js`, `meetingController.js`, `ActionItem.js` | Persists AI action items | Partial |
| Searchable history | Yes | Yes | No | `Meeting.js`, `meetingController.js`, `api.js` | Mongo text indexes and query support | Partial |
| Dashboard | Yes | Yes | Removed fake fallback | `Dashboard.jsx` | Reads meetings/action items | Partial |
| Professional UI | Yes | Yes | No | `App.css`, `MeetingRoomEnhanced.css` | Global SaaS-style refresh with light/dark theme | Partial |
| Deployment | Minimal | Yes | No | `.env.example`, Vite config | Local only | No |

## Problems Found

- Duplicate JS/TS app trees create confusion and dead code.
- `node_modules` is checked into the project folder.
- No root package manager workspace.
- No test suite.
- No Docker or CI.
- No production-grade API validation library.
- Previous meeting and action item reads leaked all users' data.
- JWT fallback secret was unsafe for production.
- Upload flow previously posted AI audio to hardcoded meeting ID `1`.
- Several frontend screens used dummy data when API calls failed.
- WebRTC uses full mesh, which breaks down as rooms grow.
- Socket.IO has no Redis adapter, so horizontal scaling would split rooms.
- Chat messages and room events are not persisted.
- Audio upload uses base64 JSON, which is inefficient for large recordings.
- AI processing is synchronous in the request path.
- No job queue, retry policy, or transcript chunking.
- No TURN server configuration for real-world WebRTC reliability.

## Production Improvement Plan

Priority 0:
- Keep auth and data access owner-scoped.
- Require strong production secrets.
- Remove fake data fallbacks.
- Add API validation and consistent errors.
- Add tests around auth boundaries.

Priority 1:
- Move AI work to a background queue such as BullMQ with Redis.
- Upload audio as multipart or direct object storage, not base64 JSON.
- Persist chat and transcript segments as first-class records for search.
- Add MongoDB Atlas Search or OpenSearch for transcript history.
- Add TURN credentials for WebRTC.

Priority 2:
- Replace mesh WebRTC with SFU architecture for group meetings, e.g. LiveKit, mediasoup, Daily, or Twilio.
- Add Redis Socket.IO adapter for multi-instance scaling.
- Introduce a typed API contract with Zod/OpenAPI.
- Split frontend into app shell, pages, feature modules, shared UI, and services.

## Ngrok Setup

Run the backend on port `7000` and frontend on port `2000`.

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 2000
```

Terminal 3:

```bash
ngrok http 7000
```

Terminal 4:

```bash
ngrok http 2000
```

Set frontend environment:

```bash
VITE_API_URL=https://YOUR-BACKEND.ngrok-free.app/api
VITE_SOCKET_URL=https://YOUR-BACKEND.ngrok-free.app
```

Set backend environment:

```bash
FRONTEND_URL=https://YOUR-FRONTEND.ngrok-free.app
FRONTEND_URLS=https://YOUR-FRONTEND.ngrok-free.app,http://localhost:2000
COOKIE_SAMESITE=none
NODE_ENV=production
JWT_SECRET=<strong-secret>
```

WebRTC camera/microphone access requires HTTPS except on localhost. Ngrok satisfies HTTPS, but production-quality calls also need TURN servers because many networks block direct peer connections.

## Commit-Sized Implementation Tasks

1. Security hardening: owner-scoped queries, production JWT guard, CORS/ngrok support.
2. Data model pass: meeting/action indexes, AI status, entities, topics, AI action items.
3. AI workflow pass: persist extracted action items and expose search filters.
4. Frontend reality pass: remove dummy fallbacks and fix upload-to-real-meeting flow.
5. UI pass: SaaS styling, light/dark theme, responsive workspace polish.
6. Next: validation, queue, object storage, Redis adapter, TURN/SFU, tests, Docker/CI.

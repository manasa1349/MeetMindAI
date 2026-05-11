# MeetMind AI Integration Setup

This project now has real auth-backed meetings, persistent meeting chat, WebRTC signaling, AI transcript/summary extraction, AI action-item persistence, and ngrok-ready configuration.

## Local Setup

Backend:

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev -- --host 0.0.0.0 --port 2000
```

MongoDB must be running at `mongodb://localhost:27017/meetmind-ai`, or set `MONGODB_URI` in `backend/.env`.

Optional Docker setup:

```bash
docker compose up
```

## Required Backend Environment

Set these in `backend/.env`:

```bash
MONGODB_URI=mongodb://localhost:27017/meetmind-ai
PORT=7000
NODE_ENV=development
FRONTEND_URL=http://localhost:2000
FRONTEND_URLS=http://localhost:2000,http://localhost:5173
JWT_SECRET=<generate-a-strong-secret>
COOKIE_SAMESITE=lax
```

Generate a strong JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## AI Integration

For audio-to-text transcription, add OpenAI:

```bash
OPENAI_API_KEY=<your-openai-api-key>
OPENAI_WHISPER_MODEL=whisper-1
OPENAI_SUMMARY_MODEL=gpt-4o-mini
```

For Grok/xAI meeting insights, add xAI:

```bash
XAI_API_KEY=<your-xai-api-key>
XAI_SUMMARY_MODEL=grok-4
```

The code also accepts these aliases if you already used them:

```bash
GROK_API_KEY=<your-xai-api-key>
GROK_SUMMARY_MODEL=grok-4
```

Current AI behavior:

- In a live meeting room, audio capture starts after the user clicks `Join Meeting`.
- The active browser records a mixed audio stream from the local microphone and connected remote participants.
- When the signed-in meeting owner clicks `Leave and generate AI`, recording stops and the frontend sends audio to `POST /api/meetings/:id/generate-ai`.
- Guests can join, speak, and chat, but their browser does not save AI results to the meeting.
- Upload flow also works: upload or record audio, the app creates a meeting, then sends the audio for AI processing.
- Backend transcribes raw audio with OpenAI when `OPENAI_API_KEY` is set.
- Backend summarizes the transcript, extracts decisions, topics, entities, and action items with Grok/xAI first when `XAI_API_KEY` or `GROK_API_KEY` is set.
- If Grok fails and OpenAI is configured, OpenAI is used as the insight fallback.
- Extracted action items are saved in MongoDB as real tasks.

Important: a Grok/xAI key alone does not make raw audio-to-text work in this project. xAI's public API is wired here for text/image chat completions, so it can analyze a transcript, but it is not used as a speech-to-text engine. For real audio transcription, keep `OPENAI_API_KEY` or add another STT provider such as Deepgram, AssemblyAI, Azure Speech, or Google Speech-to-Text.

How to confirm transcription is working:

1. Sign in.
2. Create or open a meeting.
3. Join the meeting room.
4. Speak for at least 10 seconds.
5. Click `Leave and generate AI`.
6. Wait for the `Generating transcript` state to finish.
7. Open the meeting details, transcript, summary, and action items.

Production upgrade path:

- Replace base64 JSON audio with multipart upload or direct object storage.
- Move AI work to BullMQ/Redis workers.
- Chunk long recordings before transcription.
- Store original audio in S3, Azure Blob Storage, or GCS.
- Add semantic embeddings for transcript search and RAG.

## Ngrok Remote Demo Setup

Start backend and frontend first.

Backend tunnel:

```bash
ngrok http 7000
```

Frontend tunnel:

```bash
ngrok http 2000
```

Example values:

```bash
BACKEND_NGROK=https://abc-123.ngrok-free.app
FRONTEND_NGROK=https://xyz-789.ngrok-free.app
```

Set frontend `.env`:

```bash
VITE_API_URL=https://abc-123.ngrok-free.app/api
VITE_SOCKET_URL=https://abc-123.ngrok-free.app
```

Set backend `.env`:

```bash
NODE_ENV=production
FRONTEND_URL=https://xyz-789.ngrok-free.app
FRONTEND_URLS=https://xyz-789.ngrok-free.app,http://localhost:2000
COOKIE_SAMESITE=none
JWT_SECRET=<strong-secret>
```

Restart both servers after changing `.env`.

## WebRTC Notes

Localhost works without HTTPS. Phones, remote laptops, and ngrok demos need HTTPS. Ngrok provides HTTPS, so camera and microphone permissions should work through the frontend tunnel.

The current media architecture is browser mesh WebRTC:

- Good for 2 to 4 participants.
- Not reliable for large rooms.
- Needs TURN for users behind restrictive networks.
- Needs an SFU for production group calls.

Recommended production options:

- LiveKit Cloud or self-hosted LiveKit
- mediasoup
- Daily
- Twilio Video

Recommended TURN:

- coturn self-hosted
- Twilio Network Traversal
- Metered.ca TURN

## Socket.IO Scaling

Current Socket.IO runs in a single Node process. For production:

1. Add Redis.
2. Use `@socket.io/redis-adapter`.
3. Run multiple backend instances behind a sticky-session load balancer.
4. Keep chat persistence in MongoDB as already added.

## Deployment Checklist

- Use MongoDB Atlas or a managed MongoDB service.
- Set `JWT_SECRET`; never use the example secret in production.
- Set exact frontend origins in `FRONTEND_URLS`.
- Use HTTPS for frontend and backend.
- Add TURN or SFU before serious multi-user video demos.
- Add object storage before uploading long recordings.
- Add a background worker before processing long AI jobs.
- Add CI with build, lint, and API tests.

# Quick Start Guide

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn

## Installation & Running

### Step 1: Install Dependencies

Open terminal in the project root and run:

```bash
npm install
cd server
npm install
cd ..
```

### Step 2: Start the Backend

Open a terminal and run:

```bash
cd server
npm start
```

You should see:
```
🚀 Server running on http://localhost:3001
📡 API endpoints:
   - POST /api/info - Get video information
   - POST /api/download - Download video/audio
   - GET /api/health - Health check
```

### Step 3: Start the Frontend

Open a NEW terminal (keep the backend running) and run:

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 4: Use the App

1. Open http://localhost:5173 in your browser
2. Paste a YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
3. Select format (Video MP4 or Audio MP3)
4. Click Download!

## Troubleshooting

**Backend won't start:**
- Make sure port 3001 is not in use
- Check that all dependencies are installed: `cd server && npm install`

**Frontend can't connect to backend:**
- Ensure backend is running on http://localhost:3001
- Check browser console for CORS errors

**Downloads fail:**
- Some videos may be restricted or age-gated
- Try a different video URL
- Check backend terminal for error messages

## Notes

- Keep both terminals running (backend + frontend)
- The backend must be running for downloads to work
- Downloads will save to your browser's default download folder

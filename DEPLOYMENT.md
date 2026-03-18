# Deployment Guide

## Push to GitHub

Your repository is configured at: https://github.com/Sumer7773-beep/Media-Downloader.git

### Method 1: Using the Script
1. Double-click `push-to-github.bat`
2. Complete authentication in your browser when prompted
3. Your changes will be pushed to GitHub

### Method 2: Manual Push
Run these commands in the terminal:
```bash
cd youtube-downloader
git push -u origin main
```

## What's Been Updated

### Latest Changes:
- ✅ Playlist download support
- ✅ Improved quality selection (4K, 2K, 1080p, 720p, 480p)
- ✅ Audio quality options (320kbps, 256kbps, 192kbps, 128kbps, 96kbps)
- ✅ Multi-platform support (YouTube, Instagram, TikTok, Facebook, Twitter, Reddit, Vimeo, Twitch, Pinterest, Telegram, and 1000+ sites)
- ✅ Search functionality for songs/videos
- ✅ Built-in video player
- ✅ Better error handling
- ✅ Fixed all bugs and errors
- ✅ Cleaned up unnecessary files

## Deploy to Vercel (Frontend)

1. Go to https://vercel.com
2. Import your GitHub repository
3. Configure:
   - Framework Preset: Vite
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add Environment Variable:
   - `VITE_API_URL` = Your backend URL

## Deploy Backend (Render/Railway)

### Option 1: Render
1. Go to https://render.com
2. Create new Web Service
3. Connect your GitHub repo
4. Configure:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

### Option 2: Railway
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select your repository
4. Configure:
   - Root Directory: `server`
   - Start Command: `npm start`

## Important Notes

- Backend requires Node.js 16+
- Frontend requires Vite
- ffmpeg-static is included (no system installation needed)
- Make sure to set CORS properly for production
- Update API_URL in frontend for production backend

## Repository Structure
```
youtube-downloader/
├── src/              # Frontend React code
├── server/           # Backend Express API
├── public/           # Static assets
├── README.md         # Project documentation
└── package.json      # Frontend dependencies
```

## Support

For issues, visit: https://github.com/Sumer7773-beep/Media-Downloader/issues

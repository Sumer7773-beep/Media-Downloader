# 🎬 Universal Media Downloader

A powerful, feature-rich web application to download videos and audio from 1000+ websites including YouTube, Instagram, Twitter/X, TikTok, Facebook, and more!

![Universal Media Downloader](https://img.shields.io/badge/Downloads-1000%2B%20Sites-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-16%2B-339933)

## ✨ Features

### 🎵 Search & Download
- **Search Songs** - Search YouTube for any song, video, or artist
- **Browse Results** - View thumbnails, duration, and channel info
- **One-Click Download** - Select and download instantly

### 📺 Multi-Platform Support
- **YouTube** - Full support with quality options (4K, 1080p, 720p, 480p, 360p)
- **Instagram** - Posts, Reels, IGTV videos
- **Twitter/X** - Video tweets
- **TikTok** - Videos and sounds
- **Facebook** - Public videos
- **1000+ More Sites** - Vimeo, Dailymotion, Reddit, Twitch, and more!

### 🎬 Video Player
- **Built-in Player** - Preview videos before downloading
- **Full-screen Modal** - Beautiful player interface
- **YouTube Embed** - Seamless playback

### 🎨 Beautiful UI
- **Animate UI Theme** - Dark, modern, animated interface
- **Glassmorphic Design** - Blur effects and transparency
- **Smooth Animations** - Floating gradients, transitions
- **Responsive** - Works on desktop, tablet, and mobile

### 📥 Download Options
- **Video Formats** - MP4 with multiple quality options
- **Audio Only** - Extract audio as WebM (high quality)
- **Quality Selection** - Choose from Highest to Low quality
- **Progress Tracking** - Real-time download progress

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Sumer-Singh-Rao-001/Media--Downloader.git
cd Media--Downloader
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd server
npm install
cd ..
```

### Running the Application

1. **Start the backend server** (Terminal 1)
```bash
cd server
npm start
```
Backend runs on: http://localhost:3002

2. **Start the frontend** (Terminal 2)
```bash
npm run dev
```
Frontend runs on: http://localhost:5173

3. **Open in browser**
```
http://localhost:5173
```

## 📖 Usage

### Method 1: Search for Songs
1. Click "Search Songs" button
2. Enter song name, artist, or keywords
3. Browse results and click on any video
4. Select format (Video/Audio) and quality
5. Click Download!

### Method 2: Direct URL
1. Copy video URL from any supported website
2. Paste it in the input field
3. Click the fetch button (arrow icon)
4. Select format and quality
5. Click Download!

### Method 3: Play & Download
1. Paste a YouTube URL and fetch info
2. Click on the video thumbnail to play
3. Watch in the built-in player
4. Download when ready!

## 🌐 Supported Websites

### Popular Platforms
- YouTube, Instagram, Twitter/X, TikTok, Facebook
- Vimeo, Dailymotion, Twitch, Reddit
- LinkedIn, Pinterest, Snapchat

### Educational
- Coursera, Udemy, Khan Academy, edX, Skillshare

### News & Media
- CNN, BBC, NBC, CBS, Fox News, Al Jazeera

### Music & Audio
- SoundCloud, Bandcamp, Mixcloud, Audiomack

### And 1000+ more websites!

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **CSS3** - Animations and styling

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **yt-dlp** - Video download engine
- **youtube-search-api** - Search functionality

## 📁 Project Structure

```
youtube-downloader/
├── src/
│   ├── App.jsx          # Main React component
│   ├── App.css          # Styles and animations
│   └── main.jsx         # Entry point
├── server/
│   ├── server.js        # Express backend
│   ├── temp/            # Temporary download folder
│   └── package.json     # Backend dependencies
├── public/
├── index.html
├── package.json         # Frontend dependencies
└── README.md
```

## ⚙️ Configuration

### Backend Port
Default: `3002`
Change in `server/server.js`:
```javascript
const PORT = process.env.PORT || 3002;
```

### Frontend API URL
Default: `http://localhost:3002/api`
Change in `src/App.jsx`:
```javascript
const API_URL = 'http://localhost:3002/api';
```

## 🔧 Troubleshooting

### Audio Downloads Not Working
- Make sure you're selecting "Audio" format, not "Video"
- Audio downloads as `.webm` format (high quality, works in all players)

### Authentication Errors (Instagram/Twitter)
- Log into the platform in Chrome browser first
- The app uses browser cookies for authentication

### Port Already in Use
- Change the port in `server/server.js`
- Update `API_URL` in `src/App.jsx` to match

### Video Not Playing
- Video player works best with YouTube videos
- Other platforms may have playback restrictions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This tool is for personal use only. Please respect copyright laws and terms of service of the platforms you download from. Only download content you have the right to download.

## 👨‍💻 Author

**Sumer Singh Rao**
- GitHub: [@Sumer-Singh-Rao-001](https://github.com/Sumer-Singh-Rao-001)

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

## 📸 Screenshots

### Main Interface
Beautiful dark theme with animated background

### Search Feature
Search and browse YouTube videos

### Video Player
Built-in player for previewing videos

### Download Options
Multiple quality and format options

---

Made with ❤️ by Sumer Singh Rao

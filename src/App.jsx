import { useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

function App() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('video');
  const [quality, setQuality] = useState('highest');
  const [loading, setLoading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [availableFormats, setAvailableFormats] = useState([]);
  const [isPlaylist, setIsPlaylist] = useState(false);
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [downloadPlaylist, setDownloadPlaylist] = useState(false);

  const validateYouTubeUrl = (url) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return pattern.test(url);
  };

  const validateTwitterUrl = (url) => {
    const pattern = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+\/status\/.+/;
    return pattern.test(url);
  };

  const validateInstagramUrl = (url) => {
    const pattern = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/(p|reel|tv)\/[A-Za-z0-9_-]+/;
    return pattern.test(url);
  };

  const validateUrl = (url) => {
    return validateYouTubeUrl(url) || validateTwitterUrl(url) || validateInstagramUrl(url) || isValidUrl(url);
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const fetchVideoInfo = async () => {
    if (!url.trim() || !validateUrl(url)) return;

    setFetchingInfo(true);
    setError('');
    setVideoInfo(null);
    setAvailableFormats([]);
    setIsPlaylist(false);
    setPlaylistInfo(null);

    try {
      const response = await fetch(`${API_URL}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const data = await response.json();
        setVideoInfo(data);
        
        // Check if it's a playlist
        if (data.isPlaylist) {
          setIsPlaylist(true);
          setPlaylistInfo({
            title: data.playlistTitle,
            count: data.playlistCount,
            videos: data.playlistVideos || []
          });
        }
        
        // Set available formats if provided
        if (data.formats && data.formats.length > 0) {
          setAvailableFormats(data.formats);
        }
        
        // Set video URL for player (works best with YouTube)
        if (data.platform === 'youtube') {
          // Extract video ID and create embed URL
          const videoId = extractYouTubeId(url);
          if (videoId) {
            setVideoUrl(`https://www.youtube.com/embed/${videoId}`);
          }
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch video info');
      }
    } catch (err) {
      setError('Failed to fetch video info. Please check the URL.');
      console.error('Failed to fetch video info:', err);
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDownloadProgress(0);

    if (!url.trim()) {
      setError('Please enter a video URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid video URL (must start with http:// or https://)');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format, quality, downloadPlaylist: isPlaylist && downloadPlaylist }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if it's a Twitter auth error
        if (errorData.authRequired && (errorData.platform === 'twitter' || errorData.platform === 'instagram')) {
          const platformName = errorData.platform === 'twitter' ? 'Twitter/X' : 'Instagram';
          setError(`${platformName} requires authentication. Please log into ${platformName} in your browser (Chrome) first, then try again.`);
        } else {
          throw new Error(errorData.error || 'Download failed');
        }
        setLoading(false);
        return;
      }

      // Simulate progress (since we can't track actual download progress easily)
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `video.${format === 'audio' ? 'mp3' : 'mp4'}`;

      // Create blob and download
      const blob = await response.blob();
      clearInterval(progressInterval);
      setDownloadProgress(100);

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      setSuccess(`Successfully downloaded ${format === 'audio' ? 'audio' : 'video'}!`);
      
      setTimeout(() => {
        setDownloadProgress(0);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to download. Please try again.');
      setDownloadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const extractYouTubeId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handlePlayVideo = () => {
    setShowPlayer(true);
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setSearching(true);
    setError('');
    setSearchResults([]);

    try {
      const response = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        setShowSearch(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Search failed');
      }
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result) => {
    setUrl(result.url);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    // Auto-fetch video info
    setTimeout(() => {
      fetchVideoInfo();
    }, 100);
  };

  return (
    <div className="app">
      <div className="background-animation">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <div className="container">
        <div className="header">
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
            </svg>
          </div>
          <h1 className="title">Universal Video Downloader</h1>
          <p className="subtitle">Download from YouTube, Instagram, TikTok, Facebook, Twitter, Reddit, Vimeo, Twitch & 1000+ sites</p>
          
          <div className="supported-platforms">
            <span className="platform-chip">📺 YouTube</span>
            <span className="platform-chip">📷 Instagram</span>
            <span className="platform-chip">🎵 TikTok</span>
            <span className="platform-chip">👥 Facebook</span>
            <span className="platform-chip">🐦 Twitter/X</span>
            <span className="platform-chip">🔴 Reddit</span>
            <span className="platform-chip">🎬 Vimeo</span>
            <span className="platform-chip">📹 Dailymotion</span>
            <span className="platform-chip">🎮 Twitch</span>
            <span className="platform-chip">📌 Pinterest</span>
            <span className="platform-chip">✈️ Telegram</span>
            <span className="platform-chip">🌐 +1000 more</span>
          </div>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <button 
            className="toggle-search-btn"
            onClick={() => setShowSearch(!showSearch)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            {showSearch ? 'Hide Search' : 'Search Songs'}
          </button>

          {showSearch && (
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for songs, videos, artists..."
                  className="search-input"
                  disabled={searching}
                />
                <button
                  type="submit"
                  className="search-btn"
                  disabled={!searchQuery || searching}
                >
                  {searching ? (
                    <span className="spinner-small"></span>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                  )}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result) => (
                    <div 
                      key={result.id} 
                      className="search-result-item"
                      onClick={() => handleSelectResult(result)}
                    >
                      <img src={result.thumbnail} alt={result.title} className="result-thumbnail" />
                      <div className="result-info">
                        <h4 className="result-title">{result.title}</h4>
                        <p className="result-meta">
                          {result.channel} • {result.duration}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>
          )}
        </div>

        <form onSubmit={handleDownload} className="download-form">
          <div className="input-group">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste video URL (YouTube, Instagram, TikTok, Facebook, Twitter, Reddit, Vimeo, Twitch, Pinterest, Telegram & 1000+ sites)..."
              className="url-input"
              disabled={loading || fetchingInfo}
            />
            <button
              type="button"
              className="fetch-btn"
              onClick={fetchVideoInfo}
              disabled={!url || loading || fetchingInfo}
            >
              {fetchingInfo ? (
                <span className="spinner-small"></span>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z"/>
                </svg>
              )}
            </button>
          </div>

          {videoInfo && (
            <div className="video-info-card">
              {isPlaylist && playlistInfo && (
                <div className="playlist-banner">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                  </svg>
                  <div>
                    <strong>Playlist:</strong> {playlistInfo.title}
                    <span className="playlist-count">({playlistInfo.count} videos)</span>
                  </div>
                </div>
              )}
              <div className="video-preview" onClick={videoUrl ? handlePlayVideo : undefined} style={{ cursor: videoUrl ? 'pointer' : 'default' }}>
                {videoInfo.thumbnail && (
                  <img src={videoInfo.thumbnail} alt={videoInfo.title} className="video-thumbnail" />
                )}
                <div className="video-overlay">
                  <div className="play-icon">▶</div>
                  {videoUrl && <div className="play-text">Click to Play</div>}
                </div>
              </div>
              <div className="video-details">
                <h3 className="video-title">{videoInfo.title}</h3>
                <p className="video-author">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  {videoInfo.author}
                </p>
                <div className="video-stats">
                  {videoInfo.lengthSeconds > 0 && (
                    <span className="stat">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                      </svg>
                      {formatDuration(videoInfo.lengthSeconds)}
                    </span>
                  )}
                  {videoInfo.viewCount > 0 && (
                    <span className="stat">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                      {parseInt(videoInfo.viewCount).toLocaleString()} views
                    </span>
                  )}
                  {videoInfo.platform && (
                    <span className="platform-badge">
                      {videoInfo.platform === 'youtube' ? '📺 YouTube' : 
                       videoInfo.platform === 'instagram' ? '📷 Instagram' : 
                       videoInfo.platform === 'twitter' ? '🐦 Twitter/X' :
                       videoInfo.platform === 'tiktok' ? '🎵 TikTok' :
                       videoInfo.platform === 'facebook' ? '👥 Facebook' :
                       videoInfo.platform === 'vimeo' ? '🎬 Vimeo' :
                       videoInfo.platform === 'dailymotion' ? '📹 Dailymotion' :
                       videoInfo.platform === 'reddit' ? '🔴 Reddit' :
                       videoInfo.platform === 'twitch' ? '🎮 Twitch' :
                       videoInfo.platform === 'pinterest' ? '📌 Pinterest' :
                       videoInfo.platform === 'telegram' ? '✈️ Telegram' :
                       '🌐 ' + (new URL(url).hostname.replace('www.', ''))}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="format-selector">
            <button
              type="button"
              className={`format-btn ${format === 'video' ? 'active' : ''}`}
              onClick={() => setFormat('video')}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
              <div>
                <div className="format-label">Video</div>
                <div className="format-desc">MP4 Format</div>
              </div>
            </button>
            <button
              type="button"
              className={`format-btn ${format === 'audio' ? 'active' : ''}`}
              onClick={() => setFormat('audio')}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
              </svg>
              <div>
                <div className="format-label">Audio</div>
                <div className="format-desc">Audio Only (WebM)</div>
              </div>
            </button>
          </div>

          {isPlaylist && (
            <div className="playlist-option">
              <label className="playlist-checkbox">
                <input
                  type="checkbox"
                  checked={downloadPlaylist}
                  onChange={(e) => setDownloadPlaylist(e.target.checked)}
                  disabled={loading}
                />
                <span>Download entire playlist ({playlistInfo?.count || 0} videos)</span>
              </label>
              <p className="playlist-note">
                ⚠️ Downloading playlists may take a long time. Each video will be downloaded separately.
              </p>
            </div>
          )}

          <div className="quality-section">
            <label className="quality-label">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 14H9.5v-2h-2v2H6V7h1.5v2.5h2V7H11v10zm7-1c0 .55-.45 1-1 1h-.75v1.5h-1.5V17H14c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v4zm-3.5-.5h2v-3h-2v3z"/>
              </svg>
              Quality
            </label>
            <div className="quality-selector">
              {format === 'audio' ? (
                <>
                  <button
                    type="button"
                    className={`quality-btn ${quality === 'highest' ? 'active' : ''}`}
                    onClick={() => setQuality('highest')}
                    disabled={loading}
                  >
                    320kbps
                  </button>
                  <button
                    type="button"
                    className={`quality-btn ${quality === 'high' ? 'active' : ''}`}
                    onClick={() => setQuality('high')}
                    disabled={loading}
                  >
                    256kbps
                  </button>
                  <button
                    type="button"
                    className={`quality-btn ${quality === 'medium' ? 'active' : ''}`}
                    onClick={() => setQuality('medium')}
                    disabled={loading}
                  >
                    192kbps
                  </button>
                  <button
                    type="button"
                    className={`quality-btn ${quality === 'low' ? 'active' : ''}`}
                    onClick={() => setQuality('low')}
                    disabled={loading}
                  >
                    128kbps
                  </button>
                  <button
                    type="button"
                    className={`quality-btn ${quality === 'lowest' ? 'active' : ''}`}
                    onClick={() => setQuality('lowest')}
                    disabled={loading}
                  >
                    96kbps
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={`quality-btn ${quality === 'highest' ? 'active' : ''}`}
                    onClick={() => setQuality('highest')}
                    disabled={loading}
                  >
                    4K
                  </button>
                  <button
                    type="button"
                    className={`quality-btn ${quality === 'high' ? 'active' : ''}`}
                    onClick={() => setQuality('high')}
                    disabled={loading}
                  >
                    2K
                  </button>
                  <button
                    type="button"
                    className={`quality-btn ${quality === 'medium' ? 'active' : ''}`}
                    onClick={() => setQuality('medium')}
                    disabled={loading}
                  >
                    1080p
                  </button>
                  <button
                    type="button"
                    className={`quality-btn ${quality === 'low' ? 'active' : ''}`}
                    onClick={() => setQuality('low')}
                    disabled={loading}
                  >
                    720p
                  </button>
                  <button
                    type="button"
                    className={`quality-btn ${quality === 'lowest' ? 'active' : ''}`}
                    onClick={() => setQuality('lowest')}
                    disabled={loading}
                  >
                    480p
                  </button>
                </>
              )}
            </div>
          </div>

          {downloadProgress > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">{downloadProgress}%</span>
            </div>
          )}

          <button type="submit" className="download-btn" disabled={loading || !videoInfo}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Downloading...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z"/>
                </svg>
                Download {format === 'audio' ? 'Audio' : 'Video'}
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="message error-message">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="message success-message">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            {success}
          </div>
        )}

        {/* Video Player Modal */}
        {showPlayer && videoUrl && (
          <div className="player-modal" onClick={handleClosePlayer}>
            <div className="player-container" onClick={(e) => e.stopPropagation()}>
              <button className="close-player" onClick={handleClosePlayer}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
              <iframe
                src={videoUrl}
                title="Video Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="video-player"
              ></iframe>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

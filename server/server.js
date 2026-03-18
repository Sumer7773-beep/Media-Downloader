import express from 'express';
import cors from 'cors';
import youtubedl from 'youtube-dl-exec';
import youtubeSearch from 'youtube-search-api';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlinkSync, existsSync } from 'fs';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Validate YouTube URL
const isValidYouTubeUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return pattern.test(url);
};

// Validate Twitter/X URL
const isValidTwitterUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+\/status\/.+/;
  return pattern.test(url);
};

// Validate Instagram URL
const isValidInstagramUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/(p|reel|tv)\/[A-Za-z0-9_-]+/;
  return pattern.test(url);
};

// Validate TikTok URL
const isValidTikTokUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+/;
  return pattern.test(url);
};

// Validate Facebook URL
const isValidFacebookUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/.+/;
  return pattern.test(url);
};

// Validate Vimeo URL
const isValidVimeoUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(vimeo\.com)\/.+/;
  return pattern.test(url);
};

// Validate Dailymotion URL
const isValidDailymotionUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(dailymotion\.com)\/.+/;
  return pattern.test(url);
};

// Validate Reddit URL
const isValidRedditUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(reddit\.com|redd\.it)\/.+/;
  return pattern.test(url);
};

// Validate Twitch URL
const isValidTwitchUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(twitch\.tv)\/.+/;
  return pattern.test(url);
};

// Validate Pinterest URL
const isValidPinterestUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(pinterest\.com|pin\.it)\/.+/;
  return pattern.test(url);
};

// Validate Telegram URL
const isValidTelegramUrl = (url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\/.+/;
  return pattern.test(url);
};

// Check if URL is valid (basic check)
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Detect platform
const detectPlatform = (url) => {
  if (isValidYouTubeUrl(url)) return 'youtube';
  if (isValidTwitterUrl(url)) return 'twitter';
  if (isValidInstagramUrl(url)) return 'instagram';
  if (isValidTikTokUrl(url)) return 'tiktok';
  if (isValidFacebookUrl(url)) return 'facebook';
  if (isValidVimeoUrl(url)) return 'vimeo';
  if (isValidDailymotionUrl(url)) return 'dailymotion';
  if (isValidRedditUrl(url)) return 'reddit';
  if (isValidTwitchUrl(url)) return 'twitch';
  if (isValidPinterestUrl(url)) return 'pinterest';
  if (isValidTelegramUrl(url)) return 'telegram';
  if (isValidUrl(url)) return 'universal'; // Any other valid URL
  return null;
};

// Search for videos/songs
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Search YouTube
    const results = await youtubeSearch.GetListByKeyword(query, false, 10);
    
    if (!results || !results.items || results.items.length === 0) {
      return res.status(404).json({ error: 'No results found' });
    }

    // Format results
    const formattedResults = results.items
      .filter(item => item.type === 'video')
      .map(item => ({
        id: item.id,
        title: item.title,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        thumbnail: item.thumbnail?.thumbnails?.[0]?.url || '',
        duration: item.length?.simpleText || 'N/A',
        channel: item.channelTitle || 'Unknown',
        views: item.viewCount || '0',
      }));

    res.json({ results: formattedResults });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Failed to search. Please try again.' });
  }
});

// Get video info
app.post('/api/info', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const platform = detectPlatform(url);
    
    if (!platform) {
      return res.status(400).json({ error: 'Invalid URL. Please provide a valid video URL' });
    }

    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      flatPlaylist: true, // Get playlist info
    });

    // Check if it's a playlist
    const isPlaylist = info._type === 'playlist' || (info.entries && info.entries.length > 1);
    
    const videoDetails = {
      title: info.title || 'Video',
      author: info.uploader || info.channel || info.uploader_id || 'Unknown',
      lengthSeconds: info.duration || 0,
      thumbnail: info.thumbnail,
      viewCount: info.view_count || 0,
      platform: platform,
      isPlaylist: isPlaylist,
      playlistTitle: isPlaylist ? info.title : null,
      playlistCount: isPlaylist ? (info.entries ? info.entries.length : info.playlist_count) : 0,
      formats: [],
    };

    // Add available formats for better quality selection
    if (info.formats && Array.isArray(info.formats)) {
      const uniqueFormats = new Map();
      
      info.formats.forEach(fmt => {
        if (fmt.height && fmt.vcodec !== 'none') {
          const key = fmt.height;
          if (!uniqueFormats.has(key) || fmt.filesize > (uniqueFormats.get(key).filesize || 0)) {
            uniqueFormats.set(key, {
              height: fmt.height,
              width: fmt.width,
              ext: fmt.ext,
              filesize: fmt.filesize,
              fps: fmt.fps,
            });
          }
        }
      });
      
      videoDetails.formats = Array.from(uniqueFormats.values())
        .sort((a, b) => b.height - a.height)
        .slice(0, 10); // Top 10 formats
    }

    res.json(videoDetails);
  } catch (error) {
    console.error('Error fetching video info:', error);
    res.status(500).json({ error: 'Failed to fetch video information' });
  }
});

// Download video
app.post('/api/download', async (req, res) => {
  try {
    const { url, format, quality, downloadPlaylist } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const platform = detectPlatform(url);
    
    if (!platform) {
      return res.status(400).json({ error: 'Invalid URL. Please provide a valid video URL' });
    }

    // Get video info first to get the title
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      flatPlaylist: downloadPlaylist ? false : true, // Download playlist if requested
    });

    const title = (info.title || 'video').replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_');
    const tempDir = join(__dirname, 'temp');
    
    // Create temp directory if it doesn't exist
    if (!existsSync(tempDir)) {
      await import('fs').then(fs => fs.promises.mkdir(tempDir, { recursive: true }));
    }

    let outputPath;
    let downloadOptions = {
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ],
    };

    // Handle playlist downloads
    if (downloadPlaylist) {
      downloadOptions.noPlaylist = false;
      downloadOptions.yesPlaylist = true;
    } else {
      downloadOptions.noPlaylist = true;
    }

    // Add Twitter-specific options
    if (platform === 'twitter') {
      downloadOptions = {
        ...downloadOptions,
        cookies: 'from-browser:chrome', // Try to use browser cookies
        addHeader: [
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'accept:*/*',
          'accept-language:en-US,en;q=0.9',
          'referer:https://twitter.com/',
          'origin:https://twitter.com'
        ],
      };
    }

    // Add Instagram-specific options
    if (platform === 'instagram') {
      downloadOptions = {
        ...downloadOptions,
        cookies: 'from-browser:chrome', // Try to use browser cookies
        addHeader: [
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'accept:*/*',
          'accept-language:en-US,en;q=0.9',
          'referer:https://www.instagram.com/',
          'origin:https://www.instagram.com',
          'x-ig-app-id:936619743392459'
        ],
      };
    }

    // Universal download - try with cookies for better compatibility
    if (platform === 'universal') {
      downloadOptions = {
        ...downloadOptions,
        cookies: 'from-browser:chrome',
        noCheckCertificates: true,
        addHeader: [
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'accept:*/*',
          'accept-language:en-US,en;q=0.9'
        ],
      };
    }

    if (format === 'audio') {
      // Audio only - download best audio stream with quality options
      outputPath = join(tempDir, `${title}.webm`);
      
      let audioQuality;
      switch (quality) {
        case 'highest':
          audioQuality = '0'; // Best quality (320kbps)
          break;
        case 'high':
          audioQuality = '2'; // 256kbps
          break;
        case 'medium':
          audioQuality = '5'; // 192kbps
          break;
        case 'low':
          audioQuality = '7'; // 128kbps
          break;
        case 'lowest':
          audioQuality = '9'; // 96kbps
          break;
        default:
          audioQuality = '0'; // Best quality
      }
      
      downloadOptions = {
        ...downloadOptions,
        format: 'bestaudio/best',
        audioQuality: audioQuality,
        output: outputPath,
        noPlaylist: true,
      };
    } else {
      // Video with audio
      outputPath = join(tempDir, `${title}.mp4`);
      
      let formatString;
      if (platform === 'twitter' || platform === 'instagram' || platform === 'tiktok' || 
          platform === 'facebook' || platform === 'reddit' || platform === 'twitch' || 
          platform === 'pinterest' || platform === 'telegram' || platform === 'universal') {
        // Social media and other platforms - just get best quality
        formatString = 'best';
      } else {
        // YouTube videos with quality options
        // Use separate video+audio streams for high quality (requires ffmpeg)
        switch (quality) {
          case 'highest':
            // 4K - Best quality (2160p)
            formatString = 'bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=2160]+bestaudio/best';
            break;
          case 'high':
            // 2K - 1440p
            formatString = 'bestvideo[height<=1440][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1440]+bestaudio/best';
            break;
          case 'medium':
            // 1080p
            formatString = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best';
            break;
          case 'low':
            // 720p
            formatString = 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best';
            break;
          case 'lowest':
            // 480p
            formatString = 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best';
            break;
          default:
            formatString = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best';
        }
      }

      downloadOptions = {
        ...downloadOptions,
        format: formatString,
        output: outputPath,
        ffmpegLocation: ffmpegPath, // Use bundled ffmpeg
        mergeOutputFormat: 'mp4',
      };
    }

    // Download the video/audio
    await youtubedl(url, downloadOptions);

    // Send the file
    const fileExtension = format === 'audio' ? 'webm' : 'mp4';
    const contentType = format === 'audio' ? 'audio/webm' : 'video/mp4';
    
    res.setHeader('Content-Disposition', `attachment; filename="${title}.${fileExtension}"`);
    res.setHeader('Content-Type', contentType);

    const fileStream = await import('fs').then(fs => fs.createReadStream(outputPath));
    
    fileStream.pipe(res);

    // Clean up the file after sending
    fileStream.on('end', () => {
      try {
        if (existsSync(outputPath)) {
          unlinkSync(outputPath);
        }
      } catch (err) {
        console.error('Error cleaning up file:', err);
      }
    });

    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream file' });
      }
    });

  } catch (error) {
    console.error('Error downloading video:', error);
    
    const requestUrl = req.body.url || '';
    
    // Check for specific error types
    if (error.stderr) {
      // Instagram photo error
      if (error.stderr.includes('There is no video in this post')) {
        if (!res.headersSent) {
          res.status(400).json({ 
            error: 'This Instagram post contains only photos. Please use a post with video content.',
          });
        }
        return;
      }
      
      // Authentication error
      if (error.stderr.includes('403')) {
        const platform = requestUrl.includes('twitter.com') || requestUrl.includes('x.com') ? 'Twitter' : 
                        requestUrl.includes('instagram.com') ? 'Instagram' : 'This platform';
        
        if (!res.headersSent) {
          res.status(403).json({ 
            error: `${platform} requires authentication. Please log into ${platform} in your browser first, then try again.`,
            platform: platform.toLowerCase(),
            authRequired: true
          });
        }
        return;
      }
      
      // Private content error
      if (error.stderr.includes('private') || error.stderr.includes('login required')) {
        if (!res.headersSent) {
          res.status(403).json({ 
            error: 'This content is private or requires login. Please make sure you are logged in to the platform in your browser.',
          });
        }
        return;
      }
      
      // Age-restricted content
      if (error.stderr.includes('age') || error.stderr.includes('restricted')) {
        if (!res.headersSent) {
          res.status(403).json({ 
            error: 'This content is age-restricted. Please log into the platform in your browser first.',
          });
        }
        return;
      }
    }
    
    // Generic error
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download video. Please try again or check if the URL is valid.' });
    }
  }
});

// Alternative Twitter download using API
app.post('/api/download-twitter', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !isValidTwitterUrl(url)) {
      return res.status(400).json({ error: 'Valid Twitter/X URL is required' });
    }

    // Use a third-party API to get Twitter video URL
    // Note: This is a workaround since Twitter requires authentication
    const apiUrl = `https://twitsave.com/info?url=${encodeURIComponent(url)}`;
    
    res.status(200).json({ 
      message: 'Twitter downloads require authentication. Please use the browser extension or visit twitsave.com',
      alternativeUrl: `https://twitsave.com/info?url=${encodeURIComponent(url)}`,
      instructions: [
        '1. Visit the alternative URL provided',
        '2. Click the download button on that page',
        '3. Or install a Twitter video downloader browser extension'
      ]
    });

  } catch (error) {
    console.error('Error with Twitter download:', error);
    res.status(500).json({ error: 'Failed to process Twitter video' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - POST /api/info - Get video information`);
  console.log(`   - POST /api/download - Download video/audio`);
  console.log(`   - GET /api/health - Health check`);
});

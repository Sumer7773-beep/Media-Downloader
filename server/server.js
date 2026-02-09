import express from 'express';
import cors from 'cors';
import youtubedl from 'youtube-dl-exec';
import youtubeSearch from 'youtube-search-api';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlinkSync, existsSync } from 'fs';

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
    });

    const videoDetails = {
      title: info.title || 'Twitter Video',
      author: info.uploader || info.channel || info.uploader_id || 'Unknown',
      lengthSeconds: info.duration || 0,
      thumbnail: info.thumbnail,
      viewCount: info.view_count || 0,
      platform: platform,
      formats: [],
    };

    res.json(videoDetails);
  } catch (error) {
    console.error('Error fetching video info:', error);
    res.status(500).json({ error: 'Failed to fetch video information' });
  }
});

// Download video
app.post('/api/download', async (req, res) => {
  try {
    const { url, format, quality } = req.body;

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
      // Audio only - download best audio stream
      outputPath = join(tempDir, `${title}.webm`);
      downloadOptions = {
        ...downloadOptions,
        format: 'bestaudio/best', // Get best audio quality
        output: outputPath,
        noPlaylist: true, // Don't download playlists
      };
    } else {
      // Video with audio
      outputPath = join(tempDir, `${title}.mp4`);
      
      let formatString;
      if (platform === 'twitter' || platform === 'instagram' || platform === 'universal') {
        // Twitter, Instagram, and other platforms - just get best quality
        formatString = 'best';
      } else {
        // YouTube videos with quality options
        switch (quality) {
          case 'highest':
            formatString = 'best';
            break;
          case 'high':
            formatString = 'best[height<=720]';
            break;
          case 'medium':
            formatString = 'best[height<=480]';
            break;
          case 'low':
            formatString = 'best[height<=360]';
            break;
          default:
            formatString = 'best';
        }
      }

      downloadOptions = {
        ...downloadOptions,
        format: formatString,
        output: outputPath,
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
    
    // Check if it's a Twitter or Instagram authentication error
    if (error.stderr && error.stderr.includes('403')) {
      const platform = url.includes('twitter.com') || url.includes('x.com') ? 'Twitter' : 
                      url.includes('instagram.com') ? 'Instagram' : 'This platform';
      
      if (!res.headersSent) {
        res.status(403).json({ 
          error: `${platform} requires authentication. Please log into ${platform} in your browser first, then try again.`,
          platform: platform.toLowerCase(),
          authRequired: true
        });
      }
    } else if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download video. Please try again.' });
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

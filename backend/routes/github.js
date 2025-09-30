const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * Get repository contents
 * GET /api/github/contents
 */
router.get('/contents', async (req, res) => {
  try {
    const { repoUrl, path = '', token } = req.query;
    
    if (!repoUrl) {
      return res.status(400).json({
        success: false,
        error: 'Repository URL is required'
      });
    }
    
    // Parse repo URL to extract owner and repo name
    const { owner, repo } = parseRepoUrl(repoUrl);
    
    // Prepare headers with auth token if available
    const headers = {};
    if (token) {
      // Use user-provided token first
      headers.Authorization = `token ${token}`;
    } else if (process.env.GITHUB_TOKEN) {
      // Fall back to server-side token if available
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }
    
    // Make request to GitHub API
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers });
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('GitHub API error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message
    });
  }
});

/**
 * Get file content
 * GET /api/github/content
 */
router.get('/content', async (req, res) => {
  try {
    const { repoUrl, path, token } = req.query;
    
    if (!repoUrl || !path) {
      return res.status(400).json({
        success: false,
        error: 'Repository URL and path are required'
      });
    }
    
    // Parse repo URL to extract owner and repo name
    const { owner, repo } = parseRepoUrl(repoUrl);
    
    // Prepare headers with auth token if available
    const headers = {};
    if (token) {
      // Use user-provided token first
      headers.Authorization = `token ${token}`;
    } else if (process.env.GITHUB_TOKEN) {
      // Fall back to server-side token if available
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }
    
    // Make request to GitHub API
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers });
    
    if (!response.data.content) {
      throw new Error('Content not found or not a file');
    }
    
    // GitHub API returns content as base64
    const content = Buffer.from(response.data.content, 'base64').toString('utf8');
    
    res.json({
      success: true,
      data: {
        content,
        name: response.data.name,
        path: response.data.path,
        size: response.data.size
      }
    });
  } catch (error) {
    console.error('GitHub API error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message
    });
  }
});

/**
 * Extract owner and repo name from a GitHub URL
 * @param {string} url - GitHub repository URL
 * @returns {Object} An object containing owner and repo
 */
function parseRepoUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 2) {
      throw new Error('Invalid GitHub repository URL');
    }
    
    return {
      owner: pathParts[0],
      repo: pathParts[1]
    };
  } catch (error) {
    throw new Error(`Failed to parse GitHub URL: ${error.message}`);
  }
}

/**
 * Validate GitHub token
 * GET /api/github/validate-token
 */
router.get('/validate-token', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }
    
    // Set up headers with the token
    const headers = {
      'Authorization': `token ${token}`
    };
    
    // Make a request to GitHub API to get user info
    const response = await axios.get('https://api.github.com/user', { headers });
    
    res.json({
      success: true,
      data: {
        username: response.data.login,
        avatarUrl: response.data.avatar_url,
        name: response.data.name,
        valid: true
      }
    });
  } catch (error) {
    // Check if it's an authentication error
    if (error.response && error.response.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Invalid GitHub token',
        valid: false
      });
    }
    
    console.error('GitHub API error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
      valid: false
    });
  }
});

module.exports = router;

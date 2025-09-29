const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * Validate connection to Canvas
 * GET /api/canvas/validate
 */
router.get('/validate', async (req, res) => {
  try {
    const { apiKey, courseUrl } = req.query;
    
    if (!apiKey || !courseUrl) {
      return res.status(400).json({
        success: false,
        error: 'API key and course URL are required'
      });
    }
    
    // Parse course URL to extract base URL and course ID
    const parsedUrl = parseCourseUrl(courseUrl);
    
    // Create Axios instance with authentication
    const canvasApi = axios.create({
      baseURL: `${parsedUrl.baseUrl}/api/v1`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Attempt to get course information
    const response = await canvasApi.get(`/courses/${parsedUrl.courseId}`);
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Canvas validation error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.errors?.[0]?.message || error.message,
      details: error.response?.data
    });
  }
});

/**
 * Get a page by URL (slug)
 * GET /api/canvas/pages/:pageUrl
 */
router.get('/pages', async (req, res) => {
  try {
    const { apiKey, courseUrl, pageUrl } = req.query;
    
    if (!apiKey || !courseUrl || !pageUrl) {
      return res.status(400).json({
        success: false,
        error: 'API key, course URL, and page URL are required'
      });
    }
    
    // Parse course URL to extract base URL and course ID
    const parsedUrl = parseCourseUrl(courseUrl);
    
    // Create Axios instance with authentication
    const canvasApi = axios.create({
      baseURL: `${parsedUrl.baseUrl}/api/v1`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Get page content
    const response = await canvasApi.get(`/courses/${parsedUrl.courseId}/pages/${pageUrl}`);
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Canvas get page error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.errors?.[0]?.message || error.message
    });
  }
});

/**
 * Update a page content
 * PUT /api/canvas/pages
 */
router.put('/pages', async (req, res) => {
  try {
    const { apiKey, courseUrl, pageUrl, body } = req.body;
    
    if (!apiKey || !courseUrl || !pageUrl || !body) {
      return res.status(400).json({
        success: false,
        error: 'API key, course URL, page URL, and body are required'
      });
    }
    
    // Parse course URL to extract base URL and course ID
    const parsedUrl = parseCourseUrl(courseUrl);
    
    // Create Axios instance with authentication
    const canvasApi = axios.create({
      baseURL: `${parsedUrl.baseUrl}/api/v1`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Update page content
    const response = await canvasApi.put(`/courses/${parsedUrl.courseId}/pages/${pageUrl}`, {
      wiki_page: {
        body
      }
    });
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Canvas update page error:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.errors?.[0]?.message || error.message
    });
  }
});

/**
 * Extract base URL and course ID from a Canvas course URL
 * @param {string} url - Canvas course URL
 * @returns {Object} An object containing baseUrl and courseId
 */
function parseCourseUrl(url) {
  try {
    const parsedUrl = new URL(url);
    
    // Extract the course ID from the path
    const pathMatch = parsedUrl.pathname.match(/\/courses\/(\d+)/);
    if (!pathMatch) {
      throw new Error('Could not find course ID in the URL');
    }
    
    const courseId = pathMatch[1];
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
    
    return { baseUrl, courseId };
  } catch (error) {
    throw new Error(`Failed to parse Canvas URL: ${error.message}`);
  }
}

module.exports = router;

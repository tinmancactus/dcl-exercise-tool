import axios from 'axios';

// Use local API instead of direct Canvas API calls
/**
 * Service for interacting with the Canvas LMS API
 */
class CanvasService {
  constructor() {
    this.apiKey = null;
    this.courseUrl = null;
    this.courseId = null;
    this.apiClient = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the Canvas API client with the API key and course URL
   * @param {string} apiKey - Canvas API key
   * @param {string} courseUrl - URL of the Canvas course
   */
  initialize(apiKey, courseUrl) {
    // Store these values for use in subsequent API calls
    this.apiKey = apiKey;
    this.courseUrl = courseUrl;
    
    // Extract course ID from URL
    const courseIdMatch = courseUrl.match(/courses\/([0-9]+)/);
    if (!courseIdMatch) {
      throw new Error('Invalid Canvas URL: Could not extract course ID');
    }
    this.courseId = courseIdMatch[1];

    // Set up API client
    this.apiClient = axios.create({
      baseURL: '/api'
    });
    
    this.isInitialized = true;
  }
  
  /**
   * Validate API connection by getting course information
   * @returns {Promise<Object>} Course information
   */
  async validateConnection() {
    try {
      const response = await this.apiClient.get('/canvas/validate', {
        params: {
          apiKey: this.apiKey,
          courseUrl: this.courseUrl
        }
      });
      
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      throw new Error(`Failed to connect to Canvas: ${errorMsg}`);
    }
  }
  
  /**
   * Get a page by its URL
   * @param {string} pageUrl - The URL (slug) of the page
   * @returns {Promise<Object>} Page data
   */
  async getPage(pageUrl) {
    try {
      const response = await this.apiClient.get('/canvas/pages', {
        params: {
          apiKey: this.apiKey,
          courseUrl: this.courseUrl,
          pageUrl
        }
      });
      
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      if (error.response?.status === 404) {
        throw new Error(`Page not found: ${pageUrl}`);
      }
      throw new Error(`Failed to get page: ${errorMsg}`);
    }
  }
  
  /**
   * Update a page's content
   * @param {string} pageUrl - The URL (slug) of the page
   * @param {string} body - The new HTML body for the page
   * @returns {Promise<Object>} Updated page data
   */
  async updatePage(pageUrl, body) {
    try {
      const response = await this.apiClient.put('/canvas/pages', {
        apiKey: this.apiKey,
        courseUrl: this.courseUrl,
        pageUrl,
        body
      });
      
      return response.data.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      throw new Error(`Failed to update page: ${errorMsg}`);
    }
  }
  
  /**
   * Find the placeholder element in the page HTML and insert content
   * @param {string} html - The page HTML
   * @param {string} placement - The data-code-placement value to look for
   * @param {string} content - The content to insert
   * @returns {string} The updated HTML
   */
  insertContentAtPlaceholder(html, placement, content) {
    try {
      // Create a temporary DOM element to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Find the placeholder
      const placeholder = tempDiv.querySelector(`div[data-code-placement="${placement}"]`);
      
      if (!placeholder) {
        // Handle the case where the placeholder isn't found by using a regex approach as fallback
        const placeholderRegex = new RegExp(`<div[^>]*data-code-placement=["']${placement}["'][^>]*>.*?</div>`, 'i');
        const match = html.match(placeholderRegex);
        
        if (!match) {
          throw new Error(`Placeholder with data-code-placement="${placement}" not found`);
        }
        
        // Replace via string manipulation if DOM method fails
        return html.replace(match[0], `<div data-code-placement="${placement}">${content}</div>`);
      }
      
      // Replace the content of the placeholder
      placeholder.innerHTML = content;
      
      // Return the updated HTML
      return tempDiv.innerHTML;
    } catch (error) {
      console.error('Error processing HTML:', error);
      throw new Error(`Failed to insert content at placeholder: ${error.message}`);
    }
  }
  
  /**
   * Generate DataCamp Light embed code
   * @param {string} pythonCode - Python code for the exercise
   * @returns {string} HTML for the DCL embed
   */
  generateDclEmbed(pythonCode) {
    return `<div data-datacamp-exercise data-lang="python">
  <code data-type="sample-code">
${pythonCode}
  </code>
</div>`;
  }
}

export default new CanvasService();

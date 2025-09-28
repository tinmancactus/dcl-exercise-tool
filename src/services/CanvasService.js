import axios from 'axios';

/**
 * Service for interacting with the Canvas LMS API
 */
class CanvasService {
  constructor() {
    this.apiClient = null;
    this.baseUrl = '';
    this.courseId = '';
  }
  
  /**
   * Initialize the Canvas API client with the API key and course URL
   * @param {string} apiKey - Canvas API key
   * @param {string} courseUrl - URL of the Canvas course
   */
  initialize(apiKey, courseUrl) {
    // Extract base URL and course ID from the course URL
    const { baseUrl, courseId } = this.parseCourseUrl(courseUrl);
    
    this.baseUrl = baseUrl;
    this.courseId = courseId;
    
    // Create axios instance with authorization header
    this.apiClient = axios.create({
      baseURL: `${baseUrl}/api/v1`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          // Format API error message
          const status = error.response.status;
          let message = `Canvas API error (${status})`;
          
          if (error.response.data && error.response.data.errors) {
            message += `: ${error.response.data.errors.map(e => e.message).join(', ')}`;
          }
          
          error.message = message;
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Extract base URL and course ID from a Canvas course URL
   * @param {string} url - Canvas course URL
   * @returns {Object} An object containing baseUrl and courseId
   */
  parseCourseUrl(url) {
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
  
  /**
   * Validate API connection by getting course information
   * @returns {Promise<Object>} Course information
   */
  async validateConnection() {
    try {
      const response = await this.apiClient.get(`/courses/${this.courseId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to connect to Canvas: ${error.message}`);
    }
  }
  
  /**
   * Get a page by its URL
   * @param {string} pageUrl - The URL (slug) of the page
   * @returns {Promise<Object>} Page data
   */
  async getPage(pageUrl) {
    try {
      const response = await this.apiClient.get(`/courses/${this.courseId}/pages/${pageUrl}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error(`Page not found: ${pageUrl}`);
      }
      throw new Error(`Failed to get page: ${error.message}`);
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
      const response = await this.apiClient.put(`/courses/${this.courseId}/pages/${pageUrl}`, {
        wiki_page: {
          body
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update page: ${error.message}`);
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
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find the placeholder
    const placeholder = tempDiv.querySelector(`div[data-code-placement="${placement}"]`);
    
    if (!placeholder) {
      throw new Error(`Placeholder with data-code-placement="${placement}" not found`);
    }
    
    // Replace the content of the placeholder
    placeholder.innerHTML = content;
    
    // Return the updated HTML
    return tempDiv.innerHTML;
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

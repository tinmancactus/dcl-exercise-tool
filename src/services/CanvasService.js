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
   * Detect the element type for a placement
   * @param {string} html - HTML content
   * @param {string} placement - Value of data-code-placement attribute
   * @returns {string} Element type ('pre' or 'div')
   */
  detectPlacementElementType(html, placement) {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Check for pre element first
      const preElement = tempDiv.querySelector(`pre[data-code-placement="${placement}"]`);
      if (preElement) {
        return 'pre';
      }
      
      // Check for div element
      const divElement = tempDiv.querySelector(`div[data-code-placement="${placement}"]`);
      if (divElement) {
        return 'div';
      }
      
      // Fallback to regex if DOM approach doesn't work
      const preRegex = new RegExp(`<pre[^>]*data-code-placement=["']${placement}["'][^>]*>`, 'i');
      if (preRegex.test(html)) {
        return 'pre';
      }
      
      const divRegex = new RegExp(`<div[^>]*data-code-placement=["']${placement}["'][^>]*>`, 'i');
      if (divRegex.test(html)) {
        return 'div';
      }
      
      throw new Error(`Placeholder with data-code-placement="${placement}" not found`);
    } catch (error) {
      throw new Error(`Failed to detect element type: ${error.message}`);
    }
  }

  /**
   * Insert content at a specific placeholder in HTML
   * @param {string} html - HTML content
   * @param {string} placement - Value of data-code-placement attribute
   * @param {string} content - Content to insert
   * @param {boolean} isRawCode - If true, insert as raw code (for pre tags)
   * @param {boolean} includeLineNumbers - If true, add line-numbers class to pre elements
   * @param {string} customClasses - Custom CSS classes to add to pre elements
   * @returns {string} Updated HTML
   */
  insertContentAtPlaceholder(html, placement, content, isRawCode = false, includeLineNumbers = false, customClasses = '') {
    try {
      // Use DOMParser if available (browser environment) or jsdom approach for server
      // For now, we'll use a simpler approach with string manipulation
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Determine which element type to look for
      const elementType = this.detectPlacementElementType(html, placement);
      
      // Find the placeholder with the correct element type
      const placeholder = tempDiv.querySelector(`${elementType}[data-code-placement="${placement}"]`);
      
      if (!placeholder) {
        // Handle the case where the placeholder isn't found by using a regex approach as fallback
        const placeholderRegex = new RegExp(`<${elementType}[^>]*data-code-placement=["']${placement}["'][^>]*>.*?</${elementType}>`, 'is');
        const match = html.match(placeholderRegex);
        
        if (!match) {
          throw new Error(`Placeholder with data-code-placement="${placement}" not found`);
        }
        
        // Replace via string manipulation if DOM method fails
        if (elementType === 'pre' || isRawCode) {
          // For pre elements, escape HTML and wrap in code element
          const escapedContent = this.escapeHtml(content);
          
          // Build the class attribute for pre element
          let preClass = '';
          const classMatch = match[0].match(/class=["']([^"']*)["']/);
          const existingClasses = classMatch ? classMatch[1] : '';
          
          // Collect all classes to add
          const classesToAdd = [];
          if (existingClasses) {
            classesToAdd.push(existingClasses);
          }
          if (includeLineNumbers && !existingClasses.includes('line-numbers')) {
            classesToAdd.push('line-numbers');
          }
          if (customClasses) {
            // Add custom classes, avoiding duplicates
            const customClassArray = customClasses.split(/\s+/).filter(c => c && !classesToAdd.includes(c));
            classesToAdd.push(...customClassArray);
          }
          
          if (classesToAdd.length > 0) {
            preClass = ` class="${classesToAdd.join(' ')}"`;
          }
          
          return html.replace(match[0], `<${elementType}${preClass} data-code-placement="${placement}"><code class="language-python">${escapedContent}</code></${elementType}>`);
        } else {
          return html.replace(match[0], `<${elementType} data-code-placement="${placement}">${content}</${elementType}>`);
        }
      }
      
      // Replace the content of the placeholder
      if (elementType === 'pre' || isRawCode) {
        // For pre elements, add line-numbers class if requested
        if (includeLineNumbers && !placeholder.classList.contains('line-numbers')) {
          placeholder.classList.add('line-numbers');
        }
        
        // Add custom classes if provided
        if (customClasses) {
          const customClassArray = customClasses.split(/\s+/).filter(c => c);
          customClassArray.forEach(className => {
            if (!placeholder.classList.contains(className)) {
              placeholder.classList.add(className);
            }
          });
        }
        
        // Create a code element with language-python class
        const codeElement = document.createElement('code');
        codeElement.className = 'language-python';
        codeElement.textContent = content;
        
        // Clear placeholder and add the code element
        placeholder.innerHTML = '';
        placeholder.appendChild(codeElement);
      } else {
        // For div elements, use innerHTML for DCL embed
        placeholder.innerHTML = content;
      }
      
      // Return the updated HTML
      return tempDiv.innerHTML;
    } catch (error) {
      console.error('Error processing HTML:', error);
      throw new Error(`Failed to insert content at placeholder: ${error.message}`);
    }
  }
  
  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
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

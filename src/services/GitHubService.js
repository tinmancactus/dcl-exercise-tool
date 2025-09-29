import axios from 'axios';

/**
 * Service for interacting with the GitHub API via our backend proxy
 */
class GitHubService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: '/api/github'
    });
  }
  
  /**
   * Extract owner and repo name from a GitHub URL
   * @param {string} url - GitHub repository URL
   * @returns {Object} An object containing owner and repo
   */
  // No longer needed as the backend handles URL parsing
  
  /**
   * Get contents of a repository directory
   * @param {string} repoUrl - GitHub repository URL
   * @param {string} path - Path within the repository
   * @returns {Promise<Array>} Array of content objects
   */
  async getContents(repoUrl, path = '') {
    try {
      const response = await this.apiClient.get('/contents', {
        params: {
          repoUrl,
          path
        }
      });
      
      return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      if (error.response?.status === 404) {
        throw new Error('Repository or path not found');
      }
      throw new Error(`GitHub API error: ${errorMsg}`);
    }
  }
  
  /**
   * Get file content from a repository
   * @param {string} repoUrl - GitHub repository URL
   * @param {string} filePath - Path to the file
   * @returns {Promise<string>} Content of the file
   */
  async getFileContent(repoUrl, filePath) {
    try {
      const response = await this.apiClient.get('/content', {
        params: {
          repoUrl,
          path: filePath
        }
      });
      
      return response.data.data.content;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      if (error.response?.status === 404) {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(`GitHub API error: ${errorMsg}`);
    }
  }
  
  /**
   * Find all Python files in a directory recursively
   * @param {string} repoUrl - GitHub repository URL
   * @param {string} dirPath - Directory path
   * @returns {Promise<Array>} Array of Python file paths
   */
  async findPythonFiles(repoUrl, dirPath) {
    const pythonFiles = [];
    
    const processDirectory = async (path) => {
      const contents = await this.getContents(repoUrl, path);
      
      for (const item of contents) {
        const itemPath = path ? `${path}/${item.name}` : item.name;
        
        if (item.type === 'dir') {
          // Recursively process subdirectory
          await processDirectory(itemPath);
        } else if (item.type === 'file' && item.name.endsWith('.py')) {
          // Add Python file to the list
          pythonFiles.push(itemPath);
        }
      }
    };
    
    await processDirectory(dirPath);
    return pythonFiles;
  }
}

export default new GitHubService();

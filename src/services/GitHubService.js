import { Octokit } from '@octokit/rest';

/**
 * Service for interacting with the GitHub API
 */
class GitHubService {
  constructor() {
    this.octokit = new Octokit();
  }
  
  /**
   * Extract owner and repo name from a GitHub URL
   * @param {string} url - GitHub repository URL
   * @returns {Object} An object containing owner and repo
   */
  parseRepoUrl(url) {
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
   * Get contents of a repository directory
   * @param {string} repoUrl - GitHub repository URL
   * @param {string} path - Path within the repository
   * @returns {Promise<Array>} Array of content objects
   */
  async getContents(repoUrl, path = '') {
    try {
      const { owner, repo } = this.parseRepoUrl(repoUrl);
      
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path
      });
      
      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      if (error.status === 404) {
        throw new Error('Repository or path not found');
      }
      throw new Error(`GitHub API error: ${error.message}`);
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
      const { owner, repo } = this.parseRepoUrl(repoUrl);
      
      const response = await this.octokit.repos.getContent({
        owner,
        repo,
        path: filePath
      });
      
      if (Array.isArray(response.data)) {
        throw new Error('Expected a file but got a directory');
      }
      
      // GitHub API returns content as base64
      const content = Buffer.from(response.data.content, 'base64').toString('utf8');
      return content;
    } catch (error) {
      if (error.status === 404) {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(`GitHub API error: ${error.message}`);
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

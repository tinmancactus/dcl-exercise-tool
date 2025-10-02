import GitHubService from './GitHubService';
import CanvasService from './CanvasService';
import MetadataParser from './MetadataParser';

/**
 * Service for verifying Python files before processing
 */
class VerificationService {
  constructor() {
    this.githubRepoUrl = null;
    this.courseUrl = null;
    this.courseId = null;
  }

  /**
   * Initialize the verification service
   * @param {Object} config - Configuration object
   * @param {string} config.githubRepoUrl - GitHub repository URL
   * @param {string} config.courseUrl - Canvas course URL
   * @param {string} config.canvasApiKey - Canvas API key
   */
  initialize(config) {
    this.githubRepoUrl = config.githubRepoUrl;
    this.courseUrl = config.courseUrl;
    
    // Extract course ID from the course URL
    this.courseId = this.extractCourseId(config.courseUrl);
    if (!this.courseId) {
      throw new Error('Invalid Canvas URL: Could not extract course ID');
    }
    
    // Initialize Canvas service if not already initialized
    if (!CanvasService.isInitialized) {
      CanvasService.initialize(config.canvasApiKey, config.courseUrl);
    }
  }

  /**
   * Extract course ID from Canvas URL
   * @param {string} url - Canvas course URL
   * @returns {string|null} Extracted course ID or null if not found
   */
  extractCourseId(url) {
    try {
      const parsedUrl = new URL(url);
      
      // Extract the course ID from the path
      const pathMatch = parsedUrl.pathname.match(/\/courses\/(\d+)/);
      if (!pathMatch) {
        return null;
      }
      
      return pathMatch[1];
    } catch (error) {
      return null;
    }
  }

  /**
   * Construct the full Canvas page URL
   * @param {string} pageSlug - Canvas page slug
   * @returns {string|null} Full Canvas page URL or null
   */
  constructCanvasPageUrl(pageSlug) {
    if (!this.courseId || !pageSlug) return null;
    
    try {
      const parsedUrl = new URL(this.courseUrl);
      return `${parsedUrl.protocol}//${parsedUrl.host}/courses/${this.courseId}/pages/${pageSlug}`;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify all Python files in a directory
   * @param {string} directoryPath - Path to the directory in GitHub repo
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Array>} Array of verification results
   */
  async verifyDirectory(directoryPath, onProgress) {
    try {
      // Find all Python files in the directory
      const pythonFiles = await GitHubService.findPythonFiles(this.githubRepoUrl, directoryPath);
      
      const totalFiles = pythonFiles.length;
      if (totalFiles === 0) {
        throw new Error('No Python files found in the selected directory');
      }

      const results = [];
      let processed = 0;

      // Process each file
      for (const filePath of pythonFiles) {
        try {
          // Update progress
          if (onProgress) {
            onProgress({
              processed,
              total: totalFiles,
              currentFile: filePath,
              progress: Math.floor((processed / totalFiles) * 100)
            });
          }

          // Verify the file
          const result = await this.verifySingleFile(filePath);
          results.push({
            file: filePath,
            status: result.isValid ? 'valid' : 'invalid',
            checks: result.checks
          });
        } catch (error) {
          results.push({
            file: filePath,
            status: 'error',
            message: error.message
          });
        }

        // Update processed count
        processed++;
      }

      // Final progress update
      if (onProgress) {
        onProgress({
          processed,
          total: totalFiles,
          currentFile: '',
          progress: 100
        });
      }

      return {
        totalFiles,
        processedFiles: processed,
        results
      };
    } catch (error) {
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Verify a single Python file
   * @param {string} filePath - Path to the Python file in the GitHub repo
   * @returns {Promise<Object>} Verification result
   */
  async verifySingleFile(filePath) {
    try {
      const checks = [];
      let isValid = true;

      // Check 1: File exists and can be downloaded from GitHub
      try {
        const fileContent = await GitHubService.getFileContent(this.githubRepoUrl, filePath);
        checks.push({
          name: 'file_exists',
          passed: true,
          message: 'File exists in the repository'
        });

        // Check 2: File has valid metadata
        try {
          const { metadata } = MetadataParser.processPythonFile(fileContent);
          checks.push({
            name: 'metadata_valid',
            passed: true,
            message: 'Metadata is valid',
            metadata
          });

          // Check 3: Canvas page exists
          try {
            const page = await CanvasService.getPage(metadata.page);
            const canvasPageUrl = this.constructCanvasPageUrl(metadata.page);
            checks.push({
              name: 'page_exists',
              passed: true,
              message: 'Canvas page exists',
              pageTitle: page.title,
              canvasPageUrl
            });

            // Check 4: Placement exists in the page
            try {
              // Handle multiple placements if it's an array
              if (Array.isArray(metadata.placement)) {
                // Check each placement in the array
                const placementResults = [];
                let allPlacementsExist = true;
                
                for (const placement of metadata.placement) {
                  const placeholderExists = page.body.includes(`data-code-placement="${placement}"`);
                  
                  // Detect element type if placeholder exists
                  let elementType = null;
                  let isInteractive = null;
                  
                  if (placeholderExists) {
                    try {
                      elementType = CanvasService.detectPlacementElementType(page.body, placement);
                      isInteractive = elementType === 'div';
                    } catch (e) {
                      // If detection fails, just note it exists
                      elementType = 'unknown';
                    }
                  }
                  
                  placementResults.push({
                    placement,
                    exists: placeholderExists,
                    elementType,
                    interactive: isInteractive
                  });
                  
                  if (!placeholderExists) {
                    allPlacementsExist = false;
                  }
                }
                
                // Create a summary message
                const existingPlacements = placementResults.filter(r => r.exists);
                const missingPlacements = placementResults.filter(r => !r.exists).map(r => r.placement);
                
                const placementSummary = existingPlacements.map(r => 
                  `${r.placement} (<${r.elementType}>, ${r.interactive ? 'interactive' : 'non-interactive'})`
                ).join(', ');
                
                const message = allPlacementsExist
                  ? `All placements exist in the page: ${placementSummary}`
                  : `Missing placements: ${missingPlacements.join(', ')}. Found placements: ${existingPlacements.length > 0 ? placementSummary : 'none'}`;
                
                checks.push({
                  name: 'placeholder_exists',
                  passed: allPlacementsExist,
                  message: message,
                  placementDetails: placementResults
                });
                
                if (!allPlacementsExist) {
                  isValid = false;
                }
              } else {
                // Single placement (string)
                const placeholderExists = page.body.includes(`data-code-placement="${metadata.placement}"`);
                
                // Detect element type if placeholder exists
                let elementType = null;
                let isInteractive = null;
                
                if (placeholderExists) {
                  try {
                    elementType = CanvasService.detectPlacementElementType(page.body, metadata.placement);
                    isInteractive = elementType === 'div';
                  } catch (e) {
                    elementType = 'unknown';
                  }
                }
                
                checks.push({
                  name: 'placeholder_exists',
                  passed: placeholderExists,
                  message: placeholderExists 
                    ? `Placeholder '${metadata.placement}' exists (<${elementType}>, ${isInteractive ? 'interactive' : 'non-interactive'})`
                    : `Placeholder '${metadata.placement}' not found in page '${metadata.page}'`,
                  elementType,
                  interactive: isInteractive
                });
  
                if (!placeholderExists) {
                  isValid = false;
                }
              }
            } catch (placeholderError) {
              checks.push({
                name: 'placeholder_exists',
                passed: false,
                message: `Error checking placeholder: ${placeholderError.message}`
              });
              isValid = false;
            }
          } catch (pageError) {
            const canvasPageUrl = this.constructCanvasPageUrl(metadata.page);
            checks.push({
              name: 'page_exists',
              passed: false,
              message: `Canvas page '${metadata.page}' not found`,
              canvasPageUrl
            });
            isValid = false;
          }
        } catch (metadataError) {
          checks.push({
            name: 'metadata_valid',
            passed: false,
            message: `Invalid metadata: ${metadataError.message}`
          });
          isValid = false;
        }
      } catch (fileError) {
        checks.push({
          name: 'file_exists',
          passed: false,
          message: `File not found or cannot be accessed: ${fileError.message}`
        });
        isValid = false;
      }

      return {
        isValid,
        checks
      };
    } catch (error) {
      throw new Error(`Error verifying '${filePath}': ${error.message}`);
    }
  }
}

export default new VerificationService();

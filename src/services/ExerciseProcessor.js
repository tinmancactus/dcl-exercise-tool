import GitHubService from './GitHubService';
import CanvasService from './CanvasService';
import MetadataParser from './MetadataParser';

/**
 * Main processor for handling the end-to-end process of updating Canvas pages with DCL exercises
 */
class ExerciseProcessor {
  /**
   * Constructor for ExerciseProcessor
   */
  constructor() {
    // Initialize state
    this.config = null;
    this.courseId = null; // Will be extracted from Canvas URL
  }
  
  /**
   * Initialize the processor with configuration
   * @param {Object} config - Configuration object
   * @param {string} config.canvasApiKey - Canvas API key
   * @param {string} config.courseUrl - Canvas course URL
   * @param {string} config.githubRepoUrl - GitHub repo URL
   * @param {string} config.directoryPath - Path to directory in GitHub repo
   */
  initialize(config) {
    this.config = config;
    
    // Extract course ID from Canvas URL
    this.courseId = this.extractCourseId(config.courseUrl);
    if (!this.courseId) {
      throw new Error('Invalid Canvas URL: Could not extract course ID');
    }
    
    // Initialize Canvas service
    CanvasService.initialize(
      config.canvasApiKey, 
      config.courseUrl
    );
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
   * Construct a URL to a Canvas page
   * @param {string} courseId - Canvas course ID
   * @param {string} pageSlug - Canvas page slug
   * @returns {string} Full Canvas page URL
   */
  constructCanvasPageUrl(courseId, pageSlug) {
    if (!courseId || !pageSlug) return null;
    
    // Use the base URL from the Canvas URL in the config
    try {
      const parsedUrl = new URL(this.config.courseUrl);
      return `${parsedUrl.protocol}//${parsedUrl.host}/courses/${courseId}/pages/${pageSlug}`;
    } catch (error) {
      return null;
    }
  }

  /**
   * Process all Python files in the selected directory
   * @param {Function} onProgress - Callback for progress updates
   * @param {Function} onError - Callback for error notifications
   * @returns {Promise<Object>} Results of the processing operation
   */
  async processExercises(onProgress, onError) {
    try {
      // Validate Canvas connection
      await CanvasService.validateConnection();
      
      // Find all Python files in the directory
      const pythonFiles = await GitHubService.findPythonFiles(
        this.config.githubRepoUrl,
        this.config.directoryPath
      );
      
      const totalFiles = pythonFiles.length;
      if (totalFiles === 0) {
        throw new Error('No Python files found in the selected directory');
      }
      
      const results = [];
      let processed = 0;
      let successCount = 0;
      let errorCount = 0;
      
      // Process each file
      for (const filePath of pythonFiles) {
        try {
          // Update progress
          onProgress({
            processed,
            total: totalFiles,
            currentFile: filePath,
            progress: Math.floor((processed / totalFiles) * 100)
          });
          
          // Process the file
          const result = await this.processSingleFile(filePath);
          results.push({
            file: filePath,
            status: 'success',
            ...result
          });
          
          successCount++;
        } catch (error) {
          // Handle error for this file
          results.push({
            file: filePath,
            status: 'error',
            error: error.message
          });
          
          errorCount++;
          
          // Notify about the error
          onError({
            file: filePath,
            message: error.message
          });
        }
        
        // Update processed count
        processed++;
      }
      
      // Final progress update
      onProgress({
        processed,
        total: totalFiles,
        currentFile: '',
        progress: 100
      });
      
      return {
        totalFiles,
        processedFiles: processed,
        successCount,
        errorCount,
        results
      };
    } catch (error) {
      throw new Error(`Processing failed: ${error.message}`);
    }
  }
  
  /**
   * Validate metadata object has required fields and valid types
   * @param {Object} metadata - The metadata object to validate
   */
  validateMetadata(metadata) {
    if (!metadata) {
      throw new Error('Metadata is missing');
    }
    
    // Check for required fields
    const requiredFields = [
      { name: 'page', type: 'string' },
      { name: 'placement', type: 'string' }
    ];
    
    // Optional fields to validate if present
    const optionalFields = [
      { name: 'course', type: 'number|string' } // Now optional, used for administrative purposes only
    ];
    
    // Check required fields
    for (const field of requiredFields) {
      if (metadata[field.name] === undefined || metadata[field.name] === null) {
        throw new Error(`Required metadata field '${field.name}' is missing`);
      }
      
      // Special handling for placement field which can be string or array of strings
      if (field.name === 'placement') {
        const placement = metadata[field.name];
        
        // Check if it's an array
        if (Array.isArray(placement)) {
          // Validate that all items in array are strings
          const nonStringItems = placement.filter(item => typeof item !== 'string');
          if (nonStringItems.length > 0) {
            throw new Error(`All items in 'placement' array must be strings`);
          }
          if (placement.length === 0) {
            throw new Error(`'placement' array cannot be empty`);
          }
        } 
        // Check if it's a string
        else if (typeof placement !== 'string') {
          throw new Error(`Metadata field 'placement' should be a string or an array of strings`);
        }
      }
      // Type checking for other required fields
      else if (field.type === 'number|string') {
        if (typeof metadata[field.name] !== 'number' && typeof metadata[field.name] !== 'string') {
          throw new Error(`Metadata field '${field.name}' should be a number or string`);
        }
      } else if (typeof metadata[field.name] !== field.type) {
        throw new Error(`Metadata field '${field.name}' should be a ${field.type}`);
      }
    }
    
    // Check optional fields if present
    for (const field of optionalFields) {
      if (metadata[field.name] !== undefined && metadata[field.name] !== null) {
        // Type checking for optional fields
        if (field.type === 'number|string') {
          if (typeof metadata[field.name] !== 'number' && typeof metadata[field.name] !== 'string') {
            throw new Error(`Optional metadata field '${field.name}' should be a number or string`);
          }
        } else if (typeof metadata[field.name] !== field.type) {
          throw new Error(`Optional metadata field '${field.name}' should be a ${field.type}`);
        }
      }
    }
    
    return true;
  }
  
  /**
   * Process a single Python file
   * @param {string} filePath - Path to the Python file in the GitHub repo
   * @returns {Promise<Object>} Result of the processing
   */
  async processSingleFile(filePath) {
    try {
      // Get the file content from GitHub
      const fileContent = await GitHubService.getFileContent(
        this.config.githubRepoUrl,
        filePath
      );
      
      // Parse the file content
      const { metadata, code } = MetadataParser.processPythonFile(fileContent);
      
      // Validate metadata
      this.validateMetadata(metadata);
      
      // Get the Canvas page
      const page = await CanvasService.getPage(metadata.page);
      
      // Construct the Canvas page URL using the course ID from the Canvas URL
      const canvasPageUrl = this.constructCanvasPageUrl(this.courseId, metadata.page);
      
      // Process placements - could be a single string or array of strings
      const placements = Array.isArray(metadata.placement) 
        ? metadata.placement 
        : [metadata.placement];
      
      // Track the placements that were updated with their types
      const updatedPlacements = [];
      
      // Update the page content with each placement
      let updatedContent = page.body;
      
      for (const placement of placements) {
        try {
          // Detect the element type for this placement
          const elementType = CanvasService.detectPlacementElementType(updatedContent, placement);
          
          // Determine what content to insert based on element type
          let contentToInsert;
          let isInteractive;
          
          if (elementType === 'pre') {
            // For pre elements, use raw code (non-interactive)
            contentToInsert = code;
            isInteractive = false;
          } else {
            // For div elements, generate DCL embed (interactive)
            contentToInsert = CanvasService.generateDclEmbed(code);
            isInteractive = true;
          }
          
          // Debug log
          console.log('Processing placement:', {
            placement,
            elementType,
            isRawCode: elementType === 'pre',
            includeLineNumbers: this.config.includeLineNumbers,
            config: this.config,
            configKeys: Object.keys(this.config)
          });
          
          // Update content with this placement
          updatedContent = CanvasService.insertContentAtPlaceholder(
            updatedContent, // Use previously updated content for each iteration
            placement,
            contentToInsert,
            elementType === 'pre', // isRawCode flag
            this.config.includeLineNumbers // includeLineNumbers flag
          );
          
          updatedPlacements.push({
            name: placement,
            type: elementType,
            interactive: isInteractive
          });
        } catch (placeholderError) {
          throw new Error(`Placement '${placement}' not found in page '${metadata.page}': ${placeholderError.message}`);
        }
      }
      
      // Update the page
      const updatedPage = await CanvasService.updatePage(metadata.page, updatedContent);
      
      // Generate a detailed placement description
      const placementDescriptions = updatedPlacements.map(p => 
        `${p.name} (${p.interactive ? 'interactive' : 'non-interactive'})`
      );
      
      return {
        page: metadata.page,
        title: page.title,
        placement: metadata.placement,
        updated: updatedPage.updated_at,
        canvasPageUrl: canvasPageUrl,
        placementDetails: Array.isArray(metadata.placement)
          ? `Placeholders updated: ${placementDescriptions.join(', ')}`
          : `Placeholder '${updatedPlacements[0].name}' was updated (${updatedPlacements[0].interactive ? 'interactive' : 'non-interactive'})`,
        updatedPlacements: updatedPlacements
      };
    } catch (error) {
      // Enhance error with file information
      const enhancedError = new Error(`Error processing '${filePath}': ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.filePath = filePath;
      throw enhancedError;
    }
  }
}

export default new ExerciseProcessor();

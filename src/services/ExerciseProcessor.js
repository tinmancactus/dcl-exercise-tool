import GitHubService from './GitHubService';
import CanvasService from './CanvasService';
import MetadataParser from './MetadataParser';

/**
 * Main processor for handling the end-to-end process of updating Canvas pages with DCL exercises
 */
class ExerciseProcessor {
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
    
    // Initialize Canvas service
    CanvasService.initialize(config.canvasApiKey, config.courseUrl);
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
   * Process a single Python file
   * @param {string} filePath - Path to the Python file in the GitHub repo
   * @returns {Promise<Object>} Result of the processing
   */
  async processSingleFile(filePath) {
    // Get the file content from GitHub
    const fileContent = await GitHubService.getFileContent(
      this.config.githubRepoUrl,
      filePath
    );
    
    // Parse the file content
    const { metadata, code } = MetadataParser.processPythonFile(fileContent);
    
    // Get the Canvas page
    const page = await CanvasService.getPage(metadata.page);
    
    // Generate the DCL embed code
    const dclEmbed = CanvasService.generateDclEmbed(code);
    
    // Update the page content
    const updatedContent = CanvasService.insertContentAtPlaceholder(
      page.body,
      metadata.placement,
      dclEmbed
    );
    
    // Update the page
    await CanvasService.updatePage(metadata.page, updatedContent);
    
    return {
      page: metadata.page,
      placement: metadata.placement
    };
  }
}

export default new ExerciseProcessor();

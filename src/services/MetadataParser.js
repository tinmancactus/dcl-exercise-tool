/**
 * Service for parsing metadata from Python exercise files
 */
class MetadataParser {
  /**
   * Extract metadata from Python file content
   * @param {string} fileContent - Content of Python file
   * @returns {Object|null} Metadata object or null if not found
   */
  extractMetadata(fileContent) {
    try {
      // Regular expression to match the metadata block
      // Looks for __metadata__ = { ... } pattern
      const metadataRegex = /__metadata__\s*=\s*{([^}]*)}/;
      const match = fileContent.match(metadataRegex);
      
      if (!match) {
        return null;
      }
      
      // Extract the contents of the metadata block
      const metadataContent = match[1];
      
      // Parse the key-value pairs
      const keyValuePairs = metadataContent.split(',').map(pair => pair.trim());
      
      const metadata = {};
      
      keyValuePairs.forEach(pair => {
        const [key, value] = pair.split(':').map(part => part.trim());
        if (key && value) {
          // Remove quotes if present
          metadata[key] = value.replace(/['"]/g, '');
        }
      });
      
      // Validate required fields
      const requiredFields = ['course', 'page', 'placement'];
      for (const field of requiredFields) {
        if (!metadata[field]) {
          throw new Error(`Missing required metadata field: ${field}`);
        }
      }
      
      return metadata;
    } catch (error) {
      throw new Error(`Metadata parsing error: ${error.message}`);
    }
  }
  
  /**
   * Remove metadata block from Python file content
   * @param {string} fileContent - Content of Python file
   * @returns {string} File content without metadata block
   */
  removeMetadataBlock(fileContent) {
    // Regular expression to match the metadata line
    const metadataLineRegex = /^.*__metadata__\s*=.*$/m;
    
    return fileContent.replace(metadataLineRegex, '').trim();
  }
  
  /**
   * Process a Python file for DCL embedding
   * @param {string} fileContent - Content of Python file
   * @returns {Object} Object with metadata and code without metadata
   */
  processPythonFile(fileContent) {
    const metadata = this.extractMetadata(fileContent);
    
    if (!metadata) {
      throw new Error('No metadata block found in the file');
    }
    
    const codeWithoutMetadata = this.removeMetadataBlock(fileContent);
    
    return {
      metadata,
      code: codeWithoutMetadata
    };
  }
}

export default new MetadataParser();

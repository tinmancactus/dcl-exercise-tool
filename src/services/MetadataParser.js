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
      
      const keyValuePairs = metadataContent.split(',').map(pair => pair.trim());
      
      const metadata = {};
      
      keyValuePairs.forEach(pair => {
        // Handle the format "key: value" where key might not be quoted
        const colonIndex = pair.indexOf(':');
        if (colonIndex > 0) {
          const key = pair.substring(0, colonIndex).trim();
          const value = pair.substring(colonIndex + 1).trim();
          
          if (key && value) {
            // Remove quotes if present
            metadata[key] = value.replace(/["']/g, '');
          }
        }
      });
      
      // Validate required fields
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
        
        // Type checking for required fields
        if (field.type === 'number|string') {
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
    // Regular expression to match the metadata block
    const metadataBlockRegex = /^.*__metadata__\s*=\s*{[^}]*}.*$/m;
    
    return fileContent.replace(metadataBlockRegex, '').trim();
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

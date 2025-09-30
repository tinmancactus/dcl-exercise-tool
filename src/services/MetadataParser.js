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
      
      // Parse key-value pairs more carefully to handle arrays
      const metadata = this.parseMetadataContent(metadataContent);
      
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
      
      return metadata;
    } catch (error) {
      throw new Error(`Metadata parsing error: ${error.message}`);
    }
  }

  /**
   * Parse metadata content from the string inside the curly braces
   * Handles arrays, quoted strings, and comments
   * @param {string} content - The content inside the metadata block
   * @returns {Object} Parsed metadata object
   */
  parseMetadataContent(content) {
    const metadata = {};
    let i = 0;
    
    while (i < content.length) {
      // Skip whitespace and comments
      while (i < content.length && (content[i] === ' ' || content[i] === '\n' || content[i] === '\r' || content[i] === '\t')) {
        i++;
      }
      
      // Skip comments
      if (content[i] === '#') {
        while (i < content.length && content[i] !== '\n') {
          i++;
        }
        continue;
      }
      
      // End of content
      if (i >= content.length) break;
      
      // Find the key (read until ':')
      let key = '';
      while (i < content.length && content[i] !== ':') {
        if (content[i] !== ' ' && content[i] !== '\n' && content[i] !== '\r' && content[i] !== '\t') {
          key += content[i];
        }
        i++;
      }
      
      if (!key || i >= content.length) break;
      
      // Skip the ':'
      i++;
      
      // Skip whitespace after ':'
      while (i < content.length && (content[i] === ' ' || content[i] === '\t')) {
        i++;
      }
      
      // Parse the value
      let value = null;
      
      // Check if it's an array
      if (content[i] === '[') {
        // Parse array
        i++; // Skip '['
        const arrayItems = [];
        
        while (i < content.length && content[i] !== ']') {
          // Skip whitespace
          while (i < content.length && (content[i] === ' ' || content[i] === '\t' || content[i] === '\n' || content[i] === '\r')) {
            i++;
          }
          
          if (content[i] === ']') break;
          
          // Parse array item (could be quoted string)
          let item = '';
          if (content[i] === '"' || content[i] === "'") {
            const quote = content[i];
            i++; // Skip opening quote
            while (i < content.length && content[i] !== quote) {
              item += content[i];
              i++;
            }
            i++; // Skip closing quote
          } else {
            // Unquoted value
            while (i < content.length && content[i] !== ',' && content[i] !== ']' && content[i] !== '\n') {
              item += content[i];
              i++;
            }
            item = item.trim();
          }
          
          if (item) {
            arrayItems.push(item);
          }
          
          // Skip whitespace and comma
          while (i < content.length && (content[i] === ' ' || content[i] === '\t' || content[i] === ',' || content[i] === '\n' || content[i] === '\r')) {
            i++;
          }
        }
        
        i++; // Skip ']'
        value = arrayItems;
      }
      // Check if it's a quoted string
      else if (content[i] === '"' || content[i] === "'") {
        const quote = content[i];
        i++; // Skip opening quote
        let str = '';
        while (i < content.length && content[i] !== quote) {
          str += content[i];
          i++;
        }
        i++; // Skip closing quote
        value = str;
      }
      // Unquoted value
      else {
        let str = '';
        while (i < content.length && content[i] !== ',' && content[i] !== '\n' && content[i] !== '#') {
          str += content[i];
          i++;
        }
        value = str.trim();
      }
      
      // Store the key-value pair
      if (key && value !== null) {
        metadata[key] = value;
      }
      
      // Skip comma and whitespace
      while (i < content.length && (content[i] === ',' || content[i] === ' ' || content[i] === '\t' || content[i] === '\n' || content[i] === '\r')) {
        i++;
      }
    }
    
    return metadata;
  }

  /**
   * Parse array content from a string, handling quoted values
   * @param {string} arrayContentStr - The content of an array (inside the brackets)
   * @returns {Array} Array of parsed values
   */
  parseArrayContent(arrayContentStr) {
    const items = [];
    let currentItem = '';
    let inQuotes = false;
    let quoteChar = null;
    
    // Process each character
    for (let i = 0; i < arrayContentStr.length; i++) {
      const char = arrayContentStr[i];
      
      // Handle quotes
      if ((char === '"' || char === "'") && (i === 0 || arrayContentStr[i-1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
          continue;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = null;
          continue;
        }
      }
      
      // Handle commas (only as delimiters if not in quotes)
      if (char === ',' && !inQuotes) {
        items.push(currentItem.trim());
        currentItem = '';
        continue;
      }
      
      // Add character to current item
      currentItem += char;
    }
    
    // Add the last item if not empty
    if (currentItem.trim()) {
      items.push(currentItem.trim());
    }
    
    // Clean up quotes from items
    return items.map(item => item.replace(/^['"]|['"]$/g, ''));
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

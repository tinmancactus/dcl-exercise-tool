// Test script for MetadataParser
const fs = require('fs');
const path = require('path');

// Import the MetadataParser class definition (not the instance)
const MetadataParserClass = require('./services/MetadataParser').default.constructor;

// Create a new instance
const parser = new MetadataParserClass();

// Read the sample file
const sampleFilePath = path.join(__dirname, '..', 'sample-exercise.py');
const fileContent = fs.readFileSync(sampleFilePath, 'utf8');

try {
  console.log('Attempting to parse metadata from sample file:');
  const metadata = parser.extractMetadata(fileContent);
  console.log('Extracted metadata:', metadata);
  
  console.log('\nRemoving metadata block:');
  const codeWithoutMetadata = parser.removeMetadataBlock(fileContent);
  console.log(codeWithoutMetadata);
  
  console.log('\nProcessing file:');
  const processed = parser.processPythonFile(fileContent);
  console.log('Processed result:', processed);
} catch (error) {
  console.error('Error:', error.message);
}

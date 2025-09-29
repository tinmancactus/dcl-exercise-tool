// Simple test script for MetadataParser
const fs = require('fs');

// Import our MetadataParser
const MetadataParser = require('./src/services/MetadataParser').default;

// Read the sample file
const fileContent = fs.readFileSync('./sample-exercise.py', 'utf8');

console.log('Sample Python file content:');
console.log('------------------------');
console.log(fileContent);
console.log('------------------------\n');

try {
  console.log('Attempting to parse metadata:');
  const metadata = MetadataParser.extractMetadata(fileContent);
  console.log('Extracted metadata:', metadata);
  
  console.log('\nRemoving metadata block:');
  const codeWithoutMetadata = MetadataParser.removeMetadataBlock(fileContent);
  console.log('------------------------');
  console.log(codeWithoutMetadata);
  console.log('------------------------');
  
  console.log('\nFull file processing:');
  const processed = MetadataParser.processPythonFile(fileContent);
  console.log('Processed result:', processed);
} catch (error) {
  console.error('Error:', error.message);
}

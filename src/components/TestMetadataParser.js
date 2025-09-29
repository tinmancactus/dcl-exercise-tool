import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Textarea,
  VStack,
  Code,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider
} from '@chakra-ui/react';
import MetadataParser from '../services/MetadataParser';

const TestMetadataParser = () => {
  const [pythonCode, setPythonCode] = useState(
`#!/usr/bin/env python
# -*- coding: utf-8 -*-

__metadata__ = { 
    page: 'introduction-to-python', 
    placement: 'datacamp' 
}

# Introduction to Python
# This is a simple Python exercise for DataCamp Light

# Print a welcome message
print("Welcome to Python!")

# Create some variables
name = "Student"
course = "Introduction to Python"

# Print a personalized message
print(f"Hello, {name}! Welcome to {course}.")

# Basic calculation
result = 5 + 10
print(f"5 + 10 = {result}")`);
  
  const [metadata, setMetadata] = useState(null);
  const [codeWithoutMetadata, setCodeWithoutMetadata] = useState('');
  const [error, setError] = useState('');

  const parseMetadata = () => {
    setError('');
    try {
      const extractedMetadata = MetadataParser.extractMetadata(pythonCode);
      setMetadata(extractedMetadata);
      
      const cleanCode = MetadataParser.removeMetadataBlock(pythonCode);
      setCodeWithoutMetadata(cleanCode);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box p={5}>
      <Heading as="h1" size="xl" mb={5}>
        Metadata Parser Test
      </Heading>
      
      <VStack spacing={5} align="stretch">
        <Box>
          <Heading as="h2" size="md" mb={2}>
            Python Code with Metadata
          </Heading>
          <Textarea
            value={pythonCode}
            onChange={(e) => setPythonCode(e.target.value)}
            height="300px"
            fontFamily="monospace"
          />
        </Box>
        
        <Button colorScheme="blue" onClick={parseMetadata}>
          Parse Metadata
        </Button>
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle mr={2}>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {metadata && (
          <Box>
            <Heading as="h2" size="md" mb={2}>
              Extracted Metadata
            </Heading>
            <Code p={4} borderRadius="md" display="block" whiteSpace="pre-wrap">
              {JSON.stringify(metadata, null, 2)}
            </Code>
          </Box>
        )}
        
        {codeWithoutMetadata && (
          <Box>
            <Heading as="h2" size="md" mb={2}>
              Code Without Metadata
            </Heading>
            <Code p={4} borderRadius="md" display="block" whiteSpace="pre-wrap">
              {codeWithoutMetadata}
            </Code>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default TestMetadataParser;

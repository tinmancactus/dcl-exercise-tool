import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  VStack,
  Heading,
  Text,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Divider,
  Select,
  Spinner,
  InputGroup,
  InputRightElement,
  IconButton,
  Tooltip,
  Switch,
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import CanvasService from '../services/CanvasService';

const TestCanvasAPI = () => {
  const [canvasApiKey, setCanvasApiKey] = useState('');
  const [courseUrl, setCourseUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [courseInfo, setCourseInfo] = useState(null);
  const [error, setError] = useState('');
  
  // Page operations
  const [pageUrl, setPageUrl] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [pageInfo, setPageInfo] = useState(null);
  
  // DCL operations
  const [placement, setPlacement] = useState('datacamp');
  const [pythonCode, setPythonCode] = useState('# Sample Python code\nprint("Hello from DataCamp Light!")');
  const [updatedContent, setUpdatedContent] = useState('');
  
  const handleConnect = async () => {
    setIsLoading(true);
    setError('');
    setCourseInfo(null);
    setIsConnected(false);
    
    try {
      // Initialize the Canvas service
      CanvasService.initialize(canvasApiKey, courseUrl);
      
      // Test the connection by getting course info
      const course = await CanvasService.validateConnection();
      setCourseInfo(course);
      setIsConnected(true);
    } catch (err) {
      setError(`Connection failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGetPage = async () => {
    if (!isConnected || !pageUrl) return;
    
    setIsLoading(true);
    setError('');
    setPageInfo(null);
    setPageContent('');
    
    try {
      const page = await CanvasService.getPage(pageUrl);
      setPageInfo(page);
      setPageContent(page.body);
    } catch (err) {
      setError(`Failed to get page: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateEmbed = () => {
    if (!pageContent) return;
    
    try {
      const dclEmbed = CanvasService.generateDclEmbed(pythonCode);
      const updated = CanvasService.insertContentAtPlaceholder(pageContent, placement, dclEmbed);
      setUpdatedContent(updated);
    } catch (err) {
      setError(`Failed to generate embed: ${err.message}`);
    }
  };
  
  const handleUpdatePage = async () => {
    if (!isConnected || !pageUrl || !updatedContent) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await CanvasService.updatePage(pageUrl, updatedContent);
      setPageInfo(result);
      alert('Page updated successfully!');
    } catch (err) {
      setError(`Failed to update page: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };
  
  return (
    <Box width="100%">
      <VStack spacing={6} align="stretch">
        <Heading as="h2" size="lg">
          Canvas API Test
        </Heading>
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle mr={2}>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Box p={4} borderWidth="1px" borderRadius="md">
          <Heading as="h3" size="md" mb={4}>
            1. Connect to Canvas
          </Heading>
          
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Canvas API Key</FormLabel>
              <InputGroup>
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={canvasApiKey}
                  onChange={(e) => setCanvasApiKey(e.target.value)}
                  placeholder="Enter your Canvas API key"
                />
                <InputRightElement>
                  <Tooltip label={showApiKey ? "Hide API Key" : "Show API Key"}>
                    <IconButton
                      aria-label={showApiKey ? "Hide API Key" : "Show API Key"}
                      size="sm"
                      onClick={toggleApiKeyVisibility}
                      icon={showApiKey ? <FaEyeSlash /> : <FaEye />}
                    />
                  </Tooltip>
                </InputRightElement>
              </InputGroup>
              <FormHelperText>
                You can generate an API key from your Canvas account settings.
              </FormHelperText>
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Canvas Course URL</FormLabel>
              <Input
                type="url"
                value={courseUrl}
                onChange={(e) => setCourseUrl(e.target.value)}
                placeholder="https://canvas.institution.edu/courses/12345"
              />
              <FormHelperText>
                The full URL of your Canvas course.
              </FormHelperText>
            </FormControl>
            
            
            <Button 
              colorScheme="blue" 
              onClick={handleConnect}
              isLoading={isLoading && !isConnected}
              loadingText="Connecting..."
              isDisabled={!canvasApiKey || !courseUrl}
            >
              Connect to Canvas
            </Button>
          </VStack>
          
          {courseInfo && (
            <Box mt={4} p={4} bg="green.50" borderRadius="md">
              <Heading as="h4" size="sm" color="green.600" mb={2}>
                Connected Successfully
              </Heading>
              <Text>
                <strong>Course:</strong> {courseInfo.name}
              </Text>
              <Text>
                <strong>ID:</strong> {courseInfo.id}
              </Text>
            </Box>
          )}
        </Box>
        
        {isConnected && (
          <>
            <Divider />
            
            <Box p={4} borderWidth="1px" borderRadius="md">
              <Heading as="h3" size="md" mb={4}>
                2. Get Canvas Page
              </Heading>
              
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Page URL (slug)</FormLabel>
                  <Input
                    value={pageUrl}
                    onChange={(e) => setPageUrl(e.target.value)}
                    placeholder="introduction-to-python"
                  />
                  <FormHelperText>
                    The URL slug of the page (not the full URL).
                  </FormHelperText>
                </FormControl>
                
                <Button 
                  colorScheme="blue" 
                  onClick={handleGetPage}
                  isLoading={isLoading && !pageContent}
                  loadingText="Getting page..."
                  isDisabled={!pageUrl}
                >
                  Get Page
                </Button>
              </VStack>
              
              {pageInfo && (
                <Box mt={4}>
                  <Heading as="h4" size="sm" mb={2}>
                    Page Info
                  </Heading>
                  <Text>
                    <strong>Title:</strong> {pageInfo.title}
                  </Text>
                  <Text>
                    <strong>URL:</strong> {pageInfo.url}
                  </Text>
                  <Text>
                    <strong>Last updated:</strong> {new Date(pageInfo.updated_at).toLocaleString()}
                  </Text>
                  <Heading as="h4" size="sm" mt={4} mb={2}>
                    Page Content
                  </Heading>
                  <Box 
                    maxH="300px" 
                    overflowY="auto" 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md"
                    bg="gray.50"
                  >
                    <Code whiteSpace="pre-wrap" display="block">
                      {pageContent}
                    </Code>
                  </Box>
                </Box>
              )}
            </Box>
            
            {pageContent && (
              <>
                <Divider />
                
                <Box p={4} borderWidth="1px" borderRadius="md">
                  <Heading as="h3" size="md" mb={4}>
                    3. Generate DCL Embed Code
                  </Heading>
                  
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Placement ID</FormLabel>
                      <Input
                        value={placement}
                        onChange={(e) => setPlacement(e.target.value)}
                        placeholder="datacamp"
                      />
                      <FormHelperText>
                        The data-code-placement attribute value to look for.
                      </FormHelperText>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Python Code</FormLabel>
                      <Textarea
                        value={pythonCode}
                        onChange={(e) => setPythonCode(e.target.value)}
                        placeholder="# Your Python code here"
                        rows={8}
                        fontFamily="monospace"
                      />
                    </FormControl>
                    
                    <Button 
                      colorScheme="blue" 
                      onClick={handleGenerateEmbed}
                    >
                      Generate and Insert DCL Code
                    </Button>
                  </VStack>
                  
                  {updatedContent && (
                    <Box mt={4}>
                      <Heading as="h4" size="sm" mb={2}>
                        Updated Content Preview
                      </Heading>
                      <Box 
                        maxH="300px" 
                        overflowY="auto" 
                        p={3} 
                        borderWidth="1px" 
                        borderRadius="md"
                        bg="gray.50"
                      >
                        <Code whiteSpace="pre-wrap" display="block">
                          {updatedContent}
                        </Code>
                      </Box>
                      
                      <Button 
                        mt={4}
                        colorScheme="green" 
                        onClick={handleUpdatePage}
                        isLoading={isLoading}
                        loadingText="Updating page..."
                      >
                        Update Canvas Page
                      </Button>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
};

export default TestCanvasAPI;

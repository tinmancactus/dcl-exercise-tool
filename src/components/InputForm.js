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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Text,
  InputGroup,
  InputRightElement,
  IconButton,
  Tooltip,
  Switch
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const InputForm = ({ onSubmit }) => {
  const [canvasApiKey, setCanvasApiKey] = useState('');
  const [courseUrl, setCourseUrl] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  const validateInput = () => {
    // Clear previous errors
    setError('');
    
    // Check that all fields are filled
    if (!canvasApiKey || !courseUrl || !githubRepoUrl) {
      setError('All fields are required');
      return false;
    }
    
    // Validate Canvas course URL format
    try {
      const url = new URL(courseUrl);
      if (!url.hostname.includes('canvas') && !url.pathname.includes('courses')) {
        setError('Please enter a valid Canvas course URL');
        return false;
      }
    } catch (e) {
      setError('Please enter a valid URL for the Canvas course');
      return false;
    }
    
    // Validate GitHub repo URL format
    try {
      const url = new URL(githubRepoUrl);
      if (!url.hostname.includes('github.com')) {
        setError('Please enter a valid GitHub repository URL');
        return false;
      }
    } catch (e) {
      setError('Please enter a valid URL for the GitHub repository');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateInput()) {
      onSubmit({
        canvasApiKey,
        courseUrl,
        githubRepoUrl
      });
    }
  };
  
  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };
  
  return (
    <Box as="form" onSubmit={handleSubmit} width="100%">
      <VStack spacing={6} align="stretch">
        <Heading as="h3" size="lg">
          Configuration
        </Heading>
        
        <Text>
          Enter your Canvas API key, course URL, and GitHub repository URL to get started.
        </Text>
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle mr={2}>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
            This is needed to authenticate with the Canvas API. You can generate an API key from your Canvas account settings.
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
            The URL of the Canvas course you want to update.
          </FormHelperText>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>GitHub Repository URL</FormLabel>
          <Input
            type="url"
            value={githubRepoUrl}
            onChange={(e) => setGithubRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
          />
          <FormHelperText>
            The URL of the GitHub repository containing your Python exercise files.
          </FormHelperText>
        </FormControl>

        
        <Button type="submit" colorScheme="blue" size="lg" alignSelf="flex-start">
          Next
        </Button>
      </VStack>
    </Box>
  );
};

export default InputForm;

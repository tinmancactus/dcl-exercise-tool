import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  VStack,
  HStack,
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
  Switch,
  Spinner,
  Icon
} from '@chakra-ui/react';
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import GitHubService from '../services/GitHubService';

const InputForm = ({ onSubmit }) => {
  const [canvasApiKey, setCanvasApiKey] = useState('');
  const [courseUrl, setCourseUrl] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [includeLineNumbers, setIncludeLineNumbers] = useState(true);
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(null); // null, valid, invalid
  const [tokenValidating, setTokenValidating] = useState(false);
  const [tokenUser, setTokenUser] = useState(null);
  
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
        githubRepoUrl,
        githubToken,
        includeLineNumbers
      });
    }
  };
  
  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };
  
  const toggleGithubTokenVisibility = () => {
    setShowGithubToken(!showGithubToken);
  };
  
  // Validate GitHub token when it changes
  useEffect(() => {
    const validateToken = async () => {
      // Don't validate if token is empty
      if (!githubToken) {
        setTokenStatus(null);
        return;
      }
      
      setTokenValidating(true);
      
      try {
        const result = await GitHubService.validateToken(githubToken);
        
        if (result.valid) {
          setTokenStatus('valid');
          setTokenUser(result.user);
        } else {
          setTokenStatus('invalid');
          setTokenUser(null);
        }
      } catch (error) {
        setTokenStatus('invalid');
        setTokenUser(null);
      } finally {
        setTokenValidating(false);
      }
    };
    
    // Use a debounce to avoid too many requests
    const timeoutId = setTimeout(validateToken, 500);
    
    return () => clearTimeout(timeoutId);
  }, [githubToken]);
  
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
        
        <FormControl>
          <FormLabel>GitHub Personal Access Token (Optional)</FormLabel>
          <InputGroup>
            <Input
              type={showGithubToken ? 'text' : 'password'}
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="Enter GitHub token for private repos"
              borderColor={tokenStatus === 'valid' ? 'green.500' : tokenStatus === 'invalid' ? 'red.500' : undefined}
            />
            <InputRightElement>
              {tokenValidating ? (
                <Spinner size="sm" mr={2} />
              ) : tokenStatus === 'valid' ? (
                <Icon as={FaCheck} color="green.500" mr={2} />
              ) : tokenStatus === 'invalid' ? (
                <Icon as={FaTimes} color="red.500" mr={2} />
              ) : null}
              <Tooltip label={showGithubToken ? "Hide Token" : "Show Token"}>
                <IconButton
                  aria-label={showGithubToken ? "Hide Token" : "Show Token"}
                  size="sm"
                  onClick={toggleGithubTokenVisibility}
                  icon={showGithubToken ? <FaEyeSlash /> : <FaEye />}
                />
              </Tooltip>
            </InputRightElement>
          </InputGroup>
          {tokenStatus === 'valid' && tokenUser ? (
            <Alert status="success" size="sm" mt={2} py={2}>
              <AlertIcon />
              <AlertDescription>
                Token valid. Authenticated as {tokenUser.name || tokenUser.username}.
              </AlertDescription>
            </Alert>
          ) : tokenStatus === 'invalid' ? (
            <Alert status="error" size="sm" mt={2} py={2}>
              <AlertIcon />
              <AlertDescription>
                Token validation failed. Please check and try again.
              </AlertDescription>
            </Alert>
          ) : (
            <FormHelperText>
              For private repositories or to avoid rate limiting. Create one at GitHub → Settings → Developer Settings → Personal access tokens.
            </FormHelperText>
          )}
        </FormControl>
        
        <FormControl>
          <HStack spacing={3}>
            <Switch
              id="line-numbers"
              isChecked={includeLineNumbers}
              onChange={(e) => setIncludeLineNumbers(e.target.checked)}
              colorScheme="blue"
            />
            <FormLabel htmlFor="line-numbers" mb={0}>
              Include line numbers in non-interactive code blocks
            </FormLabel>
          </HStack>
          <FormHelperText>
            When enabled, non-interactive code blocks (in &lt;pre&gt; tags) will display with line numbers using Prism.js styling.
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

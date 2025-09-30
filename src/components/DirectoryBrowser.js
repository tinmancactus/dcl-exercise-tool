import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  List,
  ListItem,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Icon,
  useColorModeValue,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from '@chakra-ui/react';
import { FaFolder, FaFile } from 'react-icons/fa';
import GitHubService from '../services/GitHubService';


const DirectoryBrowser = ({ githubRepoUrl, onDirectorySelect }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [contents, setContents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pathHistory, setPathHistory] = useState([{ name: 'Root', path: '' }]);
  
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const hoverBgColor = useColorModeValue('blue.50', 'blue.900');
  
  // Check if using authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if the GitHubService has a token set
    setIsAuthenticated(!!GitHubService.token);
    
    if (githubRepoUrl) {
      loadDirectoryContents(currentPath);
    }
  }, [githubRepoUrl, currentPath]);
  
  const loadDirectoryContents = async (path) => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await GitHubService.getContents(githubRepoUrl, path);
      
      // Sort: directories first, then files
      const sortedData = [...data].sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      });
      
      setContents(sortedData);
    } catch (err) {
      setError(`Error loading repository contents: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleItemClick = (item) => {
    if (item.type === 'dir') {
      // Navigate into directory
      const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      setCurrentPath(newPath);
      setPathHistory([...pathHistory, { name: item.name, path: newPath }]);
    }
  };
  
  const handleBreadcrumbClick = (index) => {
    const item = pathHistory[index];
    setCurrentPath(item.path);
    setPathHistory(pathHistory.slice(0, index + 1));
  };
  
  const handleSelectDirectory = () => {
    onDirectorySelect(currentPath);
  };

  return (
    <Box width="100%">
      <VStack spacing={6} align="stretch">
        <Heading as="h3" size="lg">
          Select a Directory
        </Heading>
        
        {isAuthenticated && (
          <Alert status="success" variant="subtle">
            <AlertIcon />
            <Box>
              <AlertTitle>Authenticated with GitHub</AlertTitle>
              <AlertDescription>Using token for API requests. Private repositories are accessible.</AlertDescription>
            </Box>
          </Alert>
        )}
        
        <Text>
          Browse and select the directory containing your Python exercise files.
        </Text>
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle mr={2}>Error!</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Breadcrumb spacing="8px" separator="/">
          {pathHistory.map((item, index) => (
            <BreadcrumbItem key={index}>
              <BreadcrumbLink
                onClick={() => handleBreadcrumbClick(index)}
                fontWeight={index === pathHistory.length - 1 ? 'bold' : 'normal'}
              >
                {item.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </Breadcrumb>
        
        {isLoading ? (
          <Box textAlign="center" p={8}>
            <Spinner size="xl" />
            <Text mt={4}>Loading repository contents...</Text>
          </Box>
        ) : (
          <>
            <List spacing={1} borderWidth="1px" borderRadius="md">
              {contents.length === 0 ? (
                <ListItem p={4}>No files or directories found.</ListItem>
              ) : (
                contents.map((item) => (
                  <ListItem
                    key={item.path}
                    p={4}
                    bg={bgColor}
                    cursor={item.type === 'dir' ? 'pointer' : 'default'}
                    _hover={item.type === 'dir' ? { bg: hoverBgColor } : {}}
                    onClick={() => item.type === 'dir' && handleItemClick(item)}
                  >
                    <HStack>
                      <Icon as={item.type === 'dir' ? FaFolder : FaFile} color={item.type === 'dir' ? 'blue.500' : 'gray.500'} />
                      <Text>{item.name}</Text>
                      {item.type === 'dir' && <Text color="gray.500">/</Text>}
                    </HStack>
                  </ListItem>
                ))
              )}
            </List>
            
            <Box pt={4}>
              <Button 
                colorScheme="blue" 
                size="lg"
                onClick={handleSelectDirectory}
                isDisabled={!currentPath}
              >
                Select This Directory
              </Button>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default DirectoryBrowser;

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Progress,
  List,
  ListItem,
  ListIcon,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Badge,
  Code
} from '@chakra-ui/react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import ExerciseProcessor from '../services/ExerciseProcessor';

// Real processing function using ExerciseProcessor service
const processExercises = async (config, onProgress, onError) => {
  try {
    // Initialize the processor
    ExerciseProcessor.initialize({
      canvasApiKey: config.canvasApiKey,
      courseUrl: config.courseUrl,
      githubRepoUrl: config.githubRepoUrl,
      directoryPath: config.directoryPath,
      useCorsProxy: config.useCorsProxy || false
    });
    
    // Process the exercises
    const results = await ExerciseProcessor.processExercises(onProgress, onError);
    return results;
  } catch (error) {
    console.error('Processing error:', error);
    throw error;
  }
};

const ProcessingStatus = ({ isProcessing, config, errors: initialErrors, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [errors, setErrors] = useState(initialErrors || []);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [currentError, setCurrentError] = useState(null);
  
  useEffect(() => {
    if (isProcessing) {
      startProcessing();
    }
  }, [isProcessing]);
  
  const startProcessing = async () => {
    try {
      const results = await processExercises(
        config,
        (progressData) => {
          setProgress(progressData.progress);
          setCurrentFile(progressData.currentFile);
          setProcessed(progressData.processed);
          setTotal(progressData.total);
        },
        (error) => {
          setErrors(prev => [...prev, error]);
          setCurrentError(error);
          setErrorDialogOpen(true);
        }
      );
      
      onComplete(results);
    } catch (error) {
      console.error('Processing error:', error);
      setErrors(prev => [...prev, { message: 'An unexpected error occurred' }]);
    }
  };
  
  const handleContinue = () => {
    setErrorDialogOpen(false);
  };
  
  const handleAbort = () => {
    // In a real implementation, we'd need to cancel the processing
    setErrorDialogOpen(false);
    onComplete({
      aborted: true,
      processedFiles: processed,
      totalFiles: total,
      errors
    });
  };
  
  return (
    <Box width="100%">
      <VStack spacing={6} align="stretch">
        <Heading as="h3" size="lg">
          Processing Files
        </Heading>
        
        {!errorDialogOpen ? (
          <>
            <Progress 
              value={progress} 
              size="lg" 
              colorScheme="blue" 
              hasStripe={progress < 100}
              isAnimated={progress < 100}
            />
            
            <HStack justify="space-between">
              <Text>
                Processing file: <strong>{currentFile}</strong>
              </Text>
              <Text>
                {processed} of {total} files
              </Text>
            </HStack>
            
            {processed > 0 && (
              <List spacing={3}>
                {errors.map((error, i) => (
                  <ListItem key={`error-${i}`} display="flex" alignItems="center">
                    <ListIcon as={FaTimes} color="red.500" />
                    <Text>
                      <strong>{error.file}:</strong> {error.message}
                    </Text>
                  </ListItem>
                ))}
                
                {processed > errors.length && (
                  <ListItem display="flex" alignItems="center">
                    <ListIcon as={FaCheck} color="green.500" />
                    <Text>
                      Successfully processed {processed - errors.length} files
                    </Text>
                  </ListItem>
                )}
              </List>
            )}
          </>
        ) : (
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Error Processing File
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              {currentError?.message || 'An error occurred while processing files'}
            </AlertDescription>
            <HStack mt={4} spacing={4}>
              <Button colorScheme="blue" onClick={handleContinue}>
                Continue
              </Button>
              <Button variant="outline" onClick={handleAbort}>
                Abort
              </Button>
            </HStack>
          </Alert>
        )}
        
        {errors.length > 0 && !errorDialogOpen && (
          <Box>
            <Heading as="h4" size="md" mb={2}>
              Errors
            </Heading>
            <List spacing={3}>
              {errors.map((error, index) => (
                <ListItem key={index}>
                  <HStack>
                    <Badge colorScheme="red">Error</Badge>
                    <Text>
                      {error.file}: {error.message}
                    </Text>
                  </HStack>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default ProcessingStatus;

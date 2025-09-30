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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  HStack
} from '@chakra-ui/react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import VerificationService from '../services/VerificationService';

const VerificationStatus = ({ isVerifying, config, onComplete, onAbort }) => {
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [errors, setErrors] = useState([]);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (isVerifying) {
      startVerification();
    }
  }, [isVerifying, config]);

  const handleProgress = (progressInfo) => {
    setProgress(progressInfo.progress);
    setCurrentFile(progressInfo.currentFile);
    setProcessed(progressInfo.processed);
    setTotal(progressInfo.total);
  };

  const handleError = (error) => {
    setErrors(prevErrors => [...prevErrors, error]);
  };

  const startVerification = async () => {
    try {
      // Reset state
      setProgress(0);
      setCurrentFile('');
      setProcessed(0);
      setTotal(0);
      setErrors([]);
      setResults(null);

      // Initialize verification service with all config
      VerificationService.initialize({
        githubRepoUrl: config.githubRepoUrl,
        courseUrl: config.courseUrl,
        canvasApiKey: config.canvasApiKey
      });

      // Initialize Canvas service in the VerificationService's initialization
      const verificationResults = await VerificationService.verifyDirectory(
        config.directoryPath,
        handleProgress
      );

      // Set results when verification is complete
      setResults(verificationResults);
      onComplete(verificationResults);
    } catch (error) {
      console.error('Verification error:', error);
      handleError({
        message: error.message
      });
      onComplete({ 
        aborted: true, 
        totalFiles: total, 
        processedFiles: processed, 
        error: error.message 
      });
    }
  };

  if (!isVerifying && !results) {
    return (
      <Box width="100%" textAlign="center" p={8}>
        <Text>Waiting to start verification...</Text>
      </Box>
    );
  }

  return (
    <Box width="100%">
      <VStack spacing={6} align="stretch">
        <Heading as="h3" size="lg">
          Verifying Files
        </Heading>

        <Box>
          <HStack justify="space-between">
            <Text>Progress: {processed} of {total} files</Text>
            <Text>{progress}%</Text>
          </HStack>
          <Progress value={progress} size="lg" colorScheme="blue" mt={2} />
        </Box>

        {currentFile && (
          <Box p={4} borderWidth="1px" borderRadius="md">
            <Text fontWeight="bold">Currently verifying:</Text>
            <Text fontFamily="monospace">{currentFile}</Text>
          </Box>
        )}

        {errors.length > 0 && (
          <Alert status="error">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle mb={1}>Errors ({errors.length})</AlertTitle>
              <AlertDescription>
                <List spacing={2}>
                  {errors.map((error, index) => (
                    <ListItem key={index}>
                      <HStack>
                        <ListIcon as={FaTimes} color="red.500" />
                        <Text>{error.message}</Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {isVerifying && (
          <Button colorScheme="red" variant="outline" onClick={onAbort}>
            Abort Verification
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default VerificationStatus;

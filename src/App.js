import { Box, ChakraProvider, Container, Heading, Button, HStack, ButtonGroup } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import DirectoryBrowser from './components/DirectoryBrowser';
import ProcessingStatus from './components/ProcessingStatus';
import ResultsReport from './components/ResultsReport';
import VerificationStatus from './components/VerificationStatus';
import VerificationReport from './components/VerificationReport';
import TestMetadataParser from './components/TestMetadataParser';
import TestCanvasAPI from './components/TestCanvasAPI';
import GitHubService from './services/GitHubService';
import CanvasService from './services/CanvasService';

function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    canvasApiKey: '',
    courseUrl: '',
    githubRepoUrl: '',
    includeLineNumbers: true // Default to true for line numbers
  });
  const [selectedDirectory, setSelectedDirectory] = useState('');
  const [verificationResults, setVerificationResults] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [processingResults, setProcessingResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'metadata', 'canvas'

  const handleFormSubmit = (data) => {
    console.log('handleFormSubmit received data:', data);
    setFormData(data);
    console.log('formData after setState:', data);
    
    // If a GitHub token is provided, set it in the GitHubService
    if (data.githubToken) {
      GitHubService.setAuthToken(data.githubToken);
    }
    
    setStep(2);
  };

  const handleDirectorySelect = (directory) => {
    setSelectedDirectory(directory);
    setStep(3);
    // Initialize Canvas service first
    CanvasService.initialize(formData.canvasApiKey, formData.courseUrl);
    // Start verification
    setIsVerifying(true);
  };

  const handleVerificationComplete = (results) => {
    setVerificationResults(results);
    setIsVerifying(false);
    setStep(4);
  };
  
  const handleVerifyAgain = () => {
    setVerificationResults(null);
    setIsVerifying(true);
  };
  
  const handleProceedToProcessing = () => {
    setStep(5);
    setIsProcessing(true);
  };
  
  const handleProcessingComplete = (results) => {
    setProcessingResults(results);
    setIsProcessing(false);
    setStep(6);
  };

  const handleStartOver = () => {
    setStep(1);
    setSelectedDirectory('');
    setVerificationResults(null);
    setProcessingResults(null);
    setIsVerifying(false);
    setIsProcessing(false);
    setErrors([]);
  };
  
  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return <InputForm onSubmit={handleFormSubmit} />;
      case 2:
        return <DirectoryBrowser githubRepoUrl={formData.githubRepoUrl} onDirectorySelect={handleDirectorySelect} />;
      case 3:
        return <VerificationStatus isVerifying={isVerifying} config={{ ...formData, directoryPath: selectedDirectory }} onComplete={handleVerificationComplete} onAbort={handleStartOver} />;
      case 4:
        return <VerificationReport results={verificationResults} onStartOver={handleStartOver} onProceed={handleProceedToProcessing} onVerifyAgain={handleVerifyAgain} isVerifying={isVerifying} />;
      case 5:
        return <ProcessingStatus isProcessing={isProcessing} config={{ ...formData, directoryPath: selectedDirectory }} errors={errors} onComplete={handleProcessingComplete} />;
      case 6:
        return <ResultsReport results={processingResults} onStartOver={handleStartOver} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <ChakraProvider>
      <Container maxW="container.xl" py={10}>
        <Box mb={8}>
          <Heading as="h1" size="2xl" textAlign="center" mb={2}>
            DCL Exercise Tool
          </Heading>
          <Heading as="h2" size="md" textAlign="center" color="gray.600">
            Populate Canvas courses with DataCamp Light exercises
          </Heading>
          <ButtonGroup variant="outline" spacing={4} justifyContent="center" mt={4}>
            <Button 
              colorScheme={currentView === 'main' ? 'blue' : 'gray'} 
              variant={currentView === 'main' ? 'solid' : 'outline'}
              onClick={() => setCurrentView('main')}
            >
              Main App
            </Button>
            <Button 
              colorScheme={currentView === 'metadata' ? 'blue' : 'gray'} 
              variant={currentView === 'metadata' ? 'solid' : 'outline'}
              onClick={() => setCurrentView('metadata')}
            >
              Test Metadata Parser
            </Button>
            <Button 
              colorScheme={currentView === 'canvas' ? 'blue' : 'gray'} 
              variant={currentView === 'canvas' ? 'solid' : 'outline'}
              onClick={() => setCurrentView('canvas')}
            >
              Test Canvas API
            </Button>
          </ButtonGroup>
        </Box>

        {currentView === 'metadata' ? (
          <TestMetadataParser />
        ) : currentView === 'canvas' ? (
          <TestCanvasAPI />
        ) : (
          <>
            {currentView === 'main' && renderCurrentStep()}
          </>
        )}
      </Container>
    </ChakraProvider>
  );
}

export default App;

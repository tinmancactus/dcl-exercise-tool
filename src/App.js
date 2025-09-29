import { Box, ChakraProvider, Container, Heading, Button, HStack, ButtonGroup } from '@chakra-ui/react';
import { useState } from 'react';
import InputForm from './components/InputForm';
import DirectoryBrowser from './components/DirectoryBrowser';
import ProcessingStatus from './components/ProcessingStatus';
import ResultsReport from './components/ResultsReport';
import TestMetadataParser from './components/TestMetadataParser';
import TestCanvasAPI from './components/TestCanvasAPI';

function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    canvasApiKey: '',
    courseUrl: '',
    githubRepoUrl: ''
  });
  const [selectedDirectory, setSelectedDirectory] = useState('');
  const [processingResults, setProcessingResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'metadata', 'canvas'

  const handleFormSubmit = (data) => {
    setFormData(data);
    setStep(2);
  };

  const handleDirectorySelect = (directory) => {
    setSelectedDirectory(directory);
    setStep(3);
    // Start the processing
    setIsProcessing(true);
    
    // Now we'll use the real processor through the ProcessingStatus component
    // The processing will start in that component once it receives isProcessing=true
  };

  const handleProcessingComplete = (results) => {
    setProcessingResults(results);
    setIsProcessing(false);
    setStep(4);
  };

  const handleStartOver = () => {
    setStep(1);
    setSelectedDirectory('');
    setProcessingResults(null);
    setErrors([]);
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
            {step === 1 && <InputForm onSubmit={handleFormSubmit} />}
            
            {step === 2 && (
              <DirectoryBrowser 
                githubRepoUrl={formData.githubRepoUrl}
                onDirectorySelect={handleDirectorySelect}
              />
            )}
            
            {step === 3 && (
              <ProcessingStatus 
                isProcessing={isProcessing}
                config={{
                  ...formData,
                  directoryPath: selectedDirectory
                }}
                errors={errors}
                onComplete={handleProcessingComplete}
              />
            )}
            
            {step === 4 && (
              <ResultsReport 
                results={processingResults}
                onStartOver={handleStartOver}
              />
            )}
          </>
        )}
      </Container>
    </ChakraProvider>
  );
}

export default App;

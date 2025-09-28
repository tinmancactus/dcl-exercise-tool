import { Box, ChakraProvider, Container, Heading } from '@chakra-ui/react';
import { useState } from 'react';
import InputForm from './components/InputForm';
import DirectoryBrowser from './components/DirectoryBrowser';
import ProcessingStatus from './components/ProcessingStatus';
import ResultsReport from './components/ResultsReport';

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

  const handleFormSubmit = (data) => {
    setFormData(data);
    setStep(2);
  };

  const handleDirectorySelect = (directory) => {
    setSelectedDirectory(directory);
    setStep(3);
    // Normally we'd start processing here
    setIsProcessing(true);
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
        </Box>

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
      </Container>
    </ChakraProvider>
  );
}

export default App;

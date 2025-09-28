import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  HStack,
  Icon
} from '@chakra-ui/react';

const ResultsReport = ({ results, onStartOver }) => {
  // If no results are provided yet, show a loading state
  if (!results) {
    return (
      <Box width="100%" textAlign="center" p={8}>
        <Text>Loading results...</Text>
      </Box>
    );
  }

  // If the operation was aborted, show a special message
  if (results.aborted) {
    return (
      <Box width="100%">
        <VStack spacing={6} align="stretch">
          <Heading as="h3" size="lg">
            Processing Aborted
          </Heading>
          
          <Text>
            The operation was aborted after processing {results.processedFiles} of {results.totalFiles} files.
          </Text>
          
          <Button colorScheme="blue" size="lg" onClick={onStartOver}>
            Start Over
          </Button>
        </VStack>
      </Box>
    );
  }

  // Regular results display
  return (
    <Box width="100%">
      <VStack spacing={6} align="stretch">
        <Heading as="h3" size="lg">
          Processing Complete
        </Heading>
        
        <StatGroup>
          <Stat>
            <StatLabel>Total Files</StatLabel>
            <StatNumber>{results.totalFiles}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Successfully Processed</StatLabel>
            <StatNumber>{results.successCount}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Errors</StatLabel>
            <StatNumber>{results.errorCount}</StatNumber>
          </Stat>
        </StatGroup>
        
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>File</Th>
                <Th>Status</Th>
                <Th>Details</Th>
              </Tr>
            </Thead>
            <Tbody>
              {results.results && results.results.map((result, index) => (
                <Tr key={index}>
                  <Td>{result.file}</Td>
                  <Td>
                    <HStack>
                      {result.status === 'success' ? (
                        <>
                          <Icon as={() => <span>✅</span>} />
                          <Badge colorScheme="green">Success</Badge>
                        </>
                      ) : (
                        <>
                          <Icon as={() => <span>❌</span>} />
                          <Badge colorScheme="red">Error</Badge>
                        </>
                      )}
                    </HStack>
                  </Td>
                  <Td>{result.error || 'Exercise embedded successfully'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        
        <Box pt={4}>
          <Button colorScheme="blue" size="lg" onClick={onStartOver}>
            Start Over
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};

export default ResultsReport;

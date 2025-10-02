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
  Icon,
  Link,
  Tooltip
} from '@chakra-ui/react';
import { FaExternalLinkAlt } from 'react-icons/fa';

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
                <Th width="50%">Details</Th>
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
                  <Td>
                    {result.status === 'success' ? (
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Text fontWeight="bold">Page:</Text>
                          <Text>{result.title || result.page}</Text>
                          {result.canvasPageUrl && (
                            <Tooltip label="Open Canvas page in new tab">
                              <Link href={result.canvasPageUrl} isExternal color="blue.500">
                                <Icon as={FaExternalLinkAlt} ml={1} boxSize={3} />
                              </Link>
                            </Tooltip>
                          )}
                        </HStack>
                        {result.placementDetails && (
                          <Text fontSize="sm" color="gray.600">{result.placementDetails}</Text>
                        )}
                      </VStack>
                    ) : (
                      <VStack align="start" spacing={1}>
                        <Text color="red.500">{result.error}</Text>
                        {result.canvasPageUrl && (
                          <HStack>
                            <Text fontSize="sm" fontWeight="bold">Page:</Text>
                            <Tooltip label="Open Canvas page in new tab">
                              <Link href={result.canvasPageUrl} isExternal color="blue.500" fontSize="sm">
                                View in Canvas
                                <Icon as={FaExternalLinkAlt} ml={1} boxSize={3} />
                              </Link>
                            </Tooltip>
                          </HStack>
                        )}
                      </VStack>
                    )}
                  </Td>
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

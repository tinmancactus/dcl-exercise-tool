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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tooltip,
  Flex,
  Spacer,
  UnorderedList,
  ListItem
} from '@chakra-ui/react';
import { FaCheck, FaTimes, FaExclamationTriangle, FaFileAlt, FaInfoCircle } from 'react-icons/fa';

const VerificationReport = ({ results, onStartOver, onProceed, onVerifyAgain, isVerifying }) => {
  // If no results are provided yet, show a loading state
  if (!results) {
    return (
      <Box width="100%" textAlign="center" p={8}>
        <Text>Loading verification results...</Text>
      </Box>
    );
  }

  // Count valid and invalid files
  const validCount = results.results.filter(r => r.status === 'valid').length;
  const invalidCount = results.results.filter(r => r.status !== 'valid').length;
  const allValid = invalidCount === 0;

  // Sort results - invalid files first
  const sortedResults = [...results.results].sort((a, b) => {
    if (a.status === 'valid' && b.status !== 'valid') return 1;
    if (a.status !== 'valid' && b.status === 'valid') return -1;
    return 0;
  });

  // Define badge colors and icons for check status
  const checkStatusMap = {
    valid: { color: 'green', icon: FaCheck },
    invalid: { color: 'red', icon: FaTimes },
    error: { color: 'red', icon: FaExclamationTriangle }
  };

  return (
    <Box width="100%">
      <VStack spacing={6} align="stretch">
        <Heading as="h3" size="lg">
          Verification Report
        </Heading>
        
        <Text>
          {allValid
            ? 'All files have been verified and are ready to be processed.'
            : 'Some files did not pass verification. Please review the issues below before proceeding.'}
        </Text>
        
        <StatGroup>
          <Stat>
            <StatLabel>Total Files</StatLabel>
            <StatNumber>{results.totalFiles}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Valid Files</StatLabel>
            <StatNumber>{validCount}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Invalid Files</StatLabel>
            <StatNumber>{invalidCount}</StatNumber>
          </Stat>
        </StatGroup>
        
        <Accordion allowToggle defaultIndex={allValid ? [] : [0]}>
          {sortedResults.map((result, index) => (
            <AccordionItem key={index}>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Icon 
                        as={result.status === 'valid' ? FaCheck : FaExclamationTriangle}
                        color={result.status === 'valid' ? 'green.500' : 'red.500'}
                      />
                      <Text fontWeight="medium" isTruncated>
                        {result.file}
                      </Text>
                      <Badge colorScheme={result.status === 'valid' ? 'green' : 'red'} ml={2}>
                        {result.status === 'valid' ? 'Valid' : 'Invalid'}
                      </Badge>
                    </HStack>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                {result.status === 'error' ? (
                  <Box p={3} bg="red.50" color="red.800" borderRadius="md">
                    <HStack align="flex-start">
                      <Icon as={FaTimes} mt={1} />
                      <Text>{result.message}</Text>
                    </HStack>
                  </Box>
                ) : (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th width="20%">Check</Th>
                        <Th width="15%">Status</Th>
                        <Th>Details</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {result.checks && result.checks.map((check, checkIndex) => (
                        <Tr key={checkIndex}>
                          <Td>
                            <HStack>
                              <Icon as={FaFileAlt} />
                              <Text fontWeight="medium">{check.name.replace('_', ' ')}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge colorScheme={check.passed ? 'green' : 'red'}>
                              {check.passed ? 'Passed' : 'Failed'}
                            </Badge>
                          </Td>
                          <Td>
                            <Text>{check.message}</Text>
                            {check.name === 'metadata_valid' && check.passed && check.metadata && (
                              <Box mt={1} p={2} bg="gray.50" borderRadius="md" fontSize="sm">
                                <Text fontWeight="bold">Metadata:</Text>
                                <Text>Page: {check.metadata.page}</Text>
                                {Array.isArray(check.metadata.placement) ? (
                                  <Box>
                                    <Text fontWeight="bold">Multiple Placements:</Text>
                                    <UnorderedList>
                                      {check.metadata.placement.map((place, i) => (
                                        <ListItem key={i}>{place}</ListItem>
                                      ))}
                                    </UnorderedList>
                                  </Box>
                                ) : (
                                  <Text>Placement: {check.metadata.placement}</Text>
                                )}
                                {check.metadata.course && (
                                  <Text>Course (for admin only): {check.metadata.course}</Text>
                                )}
                              </Box>
                            )}
                            {check.name === 'placeholder_exists' && check.placementDetails && (
                              <Box mt={1} p={2} bg={check.passed ? "green.50" : "red.50"} borderRadius="md" fontSize="sm">
                                <Text fontWeight="bold">Placement Details:</Text>
                                <Table size="sm" variant="simple" mt={1}>
                                  <Thead>
                                    <Tr>
                                      <Th>Placement</Th>
                                      <Th>Status</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {check.placementDetails.map((detail, i) => (
                                      <Tr key={i}>
                                        <Td>{detail.placement}</Td>
                                        <Td>
                                          {detail.exists ? (
                                            <Badge colorScheme="green">Found</Badge>
                                          ) : (
                                            <Badge colorScheme="red">Missing</Badge>
                                          )}
                                        </Td>
                                      </Tr>
                                    ))}
                                  </Tbody>
                                </Table>
                              </Box>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
        
        <Box pt={4}>
          <Flex>
            <Button 
              colorScheme="blue" 
              variant="outline"
              onClick={onStartOver}
              mr={2}
            >
              Start Over
            </Button>
            <Button
              colorScheme="teal"
              onClick={onVerifyAgain}
              isLoading={isVerifying}
              loadingText="Verifying"
              mr={2}
            >
              Verify Again
            </Button>
            <Spacer />
            <Tooltip 
              label={allValid ? 
                "Proceed to processing" : 
                "Some files have issues but you can still proceed"}
              placement="top"
            >
              <Button
                colorScheme="blue"
                onClick={onProceed}
                isDisabled={results.totalFiles === 0}
                rightIcon={!allValid ? <Icon as={FaExclamationTriangle} /> : undefined}
              >
                {allValid ? "Proceed" : "Proceed Anyway"}
              </Button>
            </Tooltip>
          </Flex>
        </Box>
      </VStack>
    </Box>
  );
};

export default VerificationReport;

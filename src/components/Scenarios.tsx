import {Checkbox, CheckboxGroup, Flex, Tab, TabList, Tabs, Text, VStack} from "@chakra-ui/react";

interface ScenariosProps {
    setSelectedTab: (tab: string) => void;
    selectedScenarios: string[];
    setSelectedScenarios: (scenarios: string[]) => void;
    getScenariosByTab: () => string[];
}


const Scenarios = ({setSelectedTab, selectedScenarios, setSelectedScenarios, getScenariosByTab}: ScenariosProps) => {
    return (
        <>
            <Text fontSize="sm" fontWeight="bold" mb={4}>
                Select a damaging energy mechanism(s) to see the list of scenarios (risk events)
            </Text>

            <Flex width={'100%'}>
                <Tabs variant='unstyled' width="100%" size={'sm'} mb={6} borderRadius="lg"
                      onChange={(index) => {
                          const tabNames = ['Vehicle to person', 'Vehicle to vehicle', 'Vehicle to environment'];
                          setSelectedTab(tabNames[index]);
                      }}
                >
                    <TabList gap={2} width="100%">
                        <Tab _selected={{color: 'white', bg: 'orange.500'}} color={'white'} bg={"gray.300"} borderRadius="md" fontWeight="bold" p={4} flex="1" textAlign="center">
                            Vehicle to person
                        </Tab>
                        <Tab _selected={{color: 'white', bg: 'orange.500'}} color={'white'} bg={"gray.300"} borderRadius="md" fontWeight="bold" flex="1" textAlign="center" p={4}>
                            Vehicle to vehicle
                        </Tab>
                        <Tab _selected={{color: 'white', bg: 'orange.500'}} color={'white'} bg={"gray.300"} borderRadius="md" fontWeight="bold" flex="1" textAlign="center" p={4}>
                            Vehicle to environment
                        </Tab>
                    </TabList>
                </Tabs>
            </Flex>

            <CheckboxGroup colorScheme="orange" value={selectedScenarios}>
                <VStack align="flex-start" spacing={3}>
                    {getScenariosByTab().map((scenario) => (
                        <Checkbox
                            key={scenario}
                            value={scenario}
                            isChecked={selectedScenarios.includes(scenario)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedScenarios([...selectedScenarios, scenario]);
                                } else {
                                    setSelectedScenarios(selectedScenarios.filter(s => s !== scenario));
                                }
                            }}
                        >
                            {scenario}
                        </Checkbox>
                    ))}
                </VStack>
            </CheckboxGroup>
        </>
    );
};

export default Scenarios;
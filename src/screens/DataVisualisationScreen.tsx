import React, {useState, useEffect} from 'react';
import {
    Box,
    Flex,
    Text,
    VStack,
    Tabs,
    TabList,
    Tab,
    Tag,
    TagLabel,
    TagCloseButton,
    Wrap,
    WrapItem,
    HStack,
    Divider,
} from '@chakra-ui/react';
import Scenarios from "../components/Scenarios.tsx";
import {
    allDEMs,
    v2eScenarios,
    v2pScenarios,
    v2vScenarios,
    equipment,
    createStructuredRiskTitleData, operatingContext
} from "../data/Data.tsx";
import OperatingContext from "../components/OperatingContext.tsx";
import EquipmentPicker, {EquipmentChild, EquipmentItem} from "../components/EquipmentPicker.tsx";
import NestedTreemap from "../components/NestedTreemap.tsx";


const DataVisualisationScreen = () => {
    const [selectedScenarios, setSelectedScenarios] = useState<string[]>(() =>
        Object.values(allDEMs).flat() // Get all DEM scenarios
    );

    // Add state for selected contexts
    const [selectedContexts, setSelectedContexts] = useState<string[]>(() =>
        operatingContext.map((context) => context.name) // Select all contexts
    );

    // Initialize equipment data with everything selected
    const [selectedEquipmentData, setSelectedEquipmentData] = useState<EquipmentItem[]>(() =>
        equipment.map((item) => ({
            name: item.name,
            selected: true, // Select parent equipment
            children: item.children.map((child) => ({
                name: child.name,
                selected: true, // Select sub-equipment
            }))
        }))
    );


    // Add state to track if equipment is being updated from tag removal
    const [isUpdatingFromTagRemoval, setIsUpdatingFromTagRemoval] = useState(false);

    const tagBgColor = 'gray.500';
    const activeBgColor = 'orange.500';
    const activeColor = 'white';

    const handleRemoveScenario = (scenario: string) => {
        setSelectedScenarios(selectedScenarios.filter(s => s !== scenario));
    };

    // Add handler to remove context
    const handleRemoveContext = (context: string) => {
        setSelectedContexts(selectedContexts.filter(c => c !== context));
    };

    // Add handler for equipment changes from EquipmentPicker
    const handleEquipmentChange = (equipment: EquipmentItem[]) => {
        // Only update if the change isn't coming from tag removal
        if (!isUpdatingFromTagRemoval) {
            setSelectedEquipmentData(equipment);
        }
        // Reset the flag after the updating
        setIsUpdatingFromTagRemoval(false);
    };

    // Add handler to remove equipment child
    const handleRemoveEquipmentChild = (parentName: string, childName: string) => {
        // Set flag to prevent the update cycle
        setIsUpdatingFromTagRemoval(true);

        const updatedEquipment = selectedEquipmentData.map(parent => {
            if (parent.name === parentName) {
                const updatedChildren = parent.children.map(child => {
                    if (child.name === childName) {
                        return {...child, selected: false};
                    }
                    return child;
                });

                // Check if any children are still selected
                const hasSelectedChild = updatedChildren.some(child => child.selected);

                return {
                    ...parent,
                    children: updatedChildren,
                    selected: hasSelectedChild
                };
            }
            return parent;
        });

        setSelectedEquipmentData(updatedEquipment);
    };

    const [selectedSelectYourTab, setSelectedSelectYourTab] = useState(0);
    const [selectedTab, setSelectedTab] = useState('Vehicle to person');

    // Add this useEffect to preserve the selectedTab when returning to scenarios
    useEffect(() => {
        // This effect will run when selectedSelectYourTab changes to 0 (Scenarios tab)
        // It does nothing but ensures we keep the current selectedTab value
    }, [selectedSelectYourTab]);

    const getScenariosByTab = () => {
        switch (selectedTab) {
            case 'Vehicle to vehicle':
                return v2vScenarios;
            case 'Vehicle to environment':
                return v2eScenarios;
            default:
                return v2pScenarios;
        }
    };

    // Create a function to handle scenario tab changes that updates the selectedTab state
    const handleScenarioTabChange = (newTab: string) => {
        setSelectedTab(newTab);
    };

    // Group selected scenarios by their DEM category
    const getGroupedScenarios = () => {
        const grouped: { [key: string]: string[] } = {};

        // Initialize all DEMs
        Object.keys(allDEMs).forEach(dem => {
            grouped[dem] = [];
        });

        // Group selected scenarios by DEM
        selectedScenarios.forEach(scenario => {
            if (scenario === 'Vehicle to person' ||
                scenario === 'Vehicle to vehicle' ||
                scenario === 'Vehicle to environment') {
                return;
            }

            // Determine which DEM this scenario belongs to
            for (const [dem, scenarios] of Object.entries(allDEMs)) {
                if (scenarios.includes(scenario)) {
                    grouped[dem].push(scenario);
                    break;
                }
            }
        });

        return grouped;
    };

    // Get selected equipment data for display
    const getSelectedEquipment = () => {
        const result: { parent: EquipmentItem; children: EquipmentChild[] }[] = [];

        selectedEquipmentData.forEach(parent => {
            if (parent.selected) {
                const selectedChildren = parent.children.filter(child => child.selected);
                if (selectedChildren.length > 0) {
                    result.push({
                        parent,
                        children: selectedChildren
                    });
                }
            }
        });

        return result;
    };

    const riskTitle = "Vehicle Incident"
    const dynamicData = createStructuredRiskTitleData(riskTitle, selectedContexts, selectedEquipmentData, selectedScenarios)
    // Uncomment for sample data
    // const dynamicData = sampleData

    return (
        <Box p={4} width="90vw">
            <Box width={"100%"} height={"600px"} mb={10}>
                <NestedTreemap data={dynamicData} maxDepth={3}/>
            </Box>
            <HStack justify="space-between" align="flex-start" width="100%">
                <VStack flex="1" align="stretch">
                    <Text size="md">Scenario(s) are:</Text>
                    <Box flex="1" bg="gray.100" p={4} borderRadius="md" minHeight="300px" maxHeight="300px"
                         overflowY="auto">
                        <Wrap spacing={2}>
                            {/* Render grouped DEM tags and their scenarios */}
                            {Object.entries(getGroupedScenarios()).map(([dem, scenarios]) => {
                                if (scenarios.length === 0) return null;

                                return (
                                    <React.Fragment key={dem}>
                                        {/* DEM Tag (Orange) - Always starts on a new line */}
                                        <HStack spacing={2} wrap="wrap">
                                            <Tag
                                                size="sm"
                                                variant="solid"
                                                bg={activeBgColor}
                                                color={activeColor}
                                                py={1}
                                                px={2}
                                                height="28px"
                                            >
                                                <TagLabel>{dem}</TagLabel>
                                            </Tag>

                                            {/* Scenario Tags (Gray) - Can follow on the same line */}
                                            {scenarios.map((scenario) => (
                                                <Tag
                                                    key={scenario}
                                                    size="sm"
                                                    variant="solid"
                                                    bg={tagBgColor}
                                                    color="white"
                                                    py={1}
                                                    px={2}
                                                    height="28px"
                                                >
                                                    <TagLabel>{scenario}</TagLabel>
                                                    <TagCloseButton onClick={() => handleRemoveScenario(scenario)}/>
                                                </Tag>
                                            ))}
                                        </HStack>
                                    </React.Fragment>
                                );
                            })}
                        </Wrap>
                    </Box>
                </VStack>

                <VStack flex="1" align="stretch">
                    <Text size="md">and the Risk Environment is:</Text>
                    <Box flex="1" bg="gray.100" p={4} borderRadius="md" minHeight="300px" maxHeight="300px"
                         overflowY="auto">
                        {/* Operating Context Tags */}
                        {selectedContexts.length > 0 && (
                            <Wrap spacing={2} mb={3}>
                                {selectedContexts.map((context) => (
                                    <WrapItem key={context}>
                                        <Tag
                                            size="sm"
                                            variant="solid"
                                            bg={tagBgColor}
                                            color="white"
                                            width="auto"
                                            py={1}
                                            px={2}
                                            display="inline-flex"
                                            height="28px"
                                        >
                                            <TagLabel>{context}</TagLabel>
                                            <TagCloseButton onClick={() => handleRemoveContext(context)}/>
                                        </Tag>
                                    </WrapItem>
                                ))}
                            </Wrap>
                        )}

                        {/* Divider if we have both contexts and equipment */}
                        {selectedContexts.length > 0 && getSelectedEquipment().length > 0 && (
                            <Divider my={3} borderColor="transparent"/>
                        )}

                        {/* Equipment Tags */}
                        {getSelectedEquipment().length > 0 ? (
                            <Wrap spacing={2}>
                                {getSelectedEquipment().map(({parent, children}) => (
                                    <React.Fragment key={parent.name}>
                                        {/* Parent Equipment Tag (Orange) - Always starts on a new line */}
                                        <HStack spacing={2} wrap="wrap">
                                            <Tag
                                                size="sm"
                                                variant="solid"
                                                bg={activeBgColor}
                                                color={activeColor}
                                                py={1}
                                                px={2}
                                                height="28px"
                                            >
                                                <TagLabel>{parent.name}</TagLabel>
                                            </Tag>

                                            {/* Child Equipment Tags (Gray) - Can follow on the same line */}
                                            {children.map((child) => (
                                                <Tag
                                                    key={`${parent.name}-${child.name}`}
                                                    size="sm"
                                                    variant="solid"
                                                    bg={tagBgColor}
                                                    color="white"
                                                    py={1}
                                                    px={2}
                                                    height="28px"
                                                >
                                                    <TagLabel>{child.name}</TagLabel>
                                                    <TagCloseButton
                                                        onClick={() => handleRemoveEquipmentChild(parent.name, child.name)}/>
                                                </Tag>
                                            ))}
                                        </HStack>
                                    </React.Fragment>
                                ))}
                            </Wrap>
                        ) : (
                            !selectedContexts.length && (
                                <Flex h="200px" justify="center" align="center">
                                    {/* Placeholder for empty state */}
                                </Flex>
                            )
                        )}
                    </Box>
                </VStack>
            </HStack>

            <Text fontSize="sm" fontWeight="bold" mt={4} py={2}>Select your:</Text>

            <Flex>
                <Tabs
                    size="sm"
                    color="gray.500"
                    mb={6}
                    bg="gray.200"
                    borderRadius="lg"
                    p={0.5}
                    index={selectedSelectYourTab}
                    onChange={(index) => setSelectedSelectYourTab(index)}
                >
                    <TabList>
                        <Tab _selected={{color: 'black', bg: 'white'}} borderRadius="lg" fontWeight="bold">
                            Scenarios
                        </Tab>
                        <Tab _selected={{color: 'black', bg: 'white'}} borderRadius="lg" fontWeight="bold">
                            Operating context / Work location
                        </Tab>
                        <Tab _selected={{color: 'black', bg: 'white'}} borderRadius="lg" fontWeight="bold">
                            Equipment
                        </Tab>
                    </TabList>
                </Tabs>
            </Flex>
            <Box height={"300px"}>
                {selectedSelectYourTab === 0 &&
                    <Scenarios
                        setSelectedTab={handleScenarioTabChange}
                        selectedTab={selectedTab} // Add this to pass current tab to component
                        selectedScenarios={selectedScenarios}
                        setSelectedScenarios={setSelectedScenarios}
                        getScenariosByTab={getScenariosByTab}
                    />
                }
                {selectedSelectYourTab === 1 &&
                    <OperatingContext
                        selectedContexts={selectedContexts}
                        setSelectedContexts={setSelectedContexts}
                    />
                }
                {selectedSelectYourTab === 2 &&
                    <EquipmentPicker
                        onEquipmentChange={handleEquipmentChange}
                        externalEquipmentData={selectedEquipmentData} // Pass the current equipment data
                    />
                }
            </Box>
        </Box>
    );
};

export default DataVisualisationScreen;
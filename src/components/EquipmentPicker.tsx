import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Text,
    VStack,
    Checkbox,
    Heading,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { equipment } from "../data/Data.tsx";

// Define TypeScript interfaces for our data structure
export interface EquipmentChild {
    name: string;
    selected?: boolean;
}

export interface EquipmentItem {
    name: string;
    children: EquipmentChild[];
    selected?: boolean;
}

export interface EquipmentPickerProps {
    onEquipmentChange?: (equipment: EquipmentItem[]) => void;
    externalEquipmentData?: EquipmentItem[]; // Add this prop to receive external updates
}

const EquipmentPicker: React.FC<EquipmentPickerProps> = ({
                                                             onEquipmentChange,
                                                             externalEquipmentData
                                                         }) => {
    // Equipment data structure with hierarchical relationships
    const [equipmentData, setEquipmentData] = useState<EquipmentItem[]>(
        externalEquipmentData && externalEquipmentData.length > 0 ? externalEquipmentData : equipment
    );
    const [selectedParent, setSelectedParent] = useState<EquipmentItem>(
        externalEquipmentData && externalEquipmentData.length > 0 ? externalEquipmentData[0] : equipment[0]
    );

    // Prevent circular updates by using a ref to track if we're currently responding to prop changes
    const [isProcessingExternalUpdate, setIsProcessingExternalUpdate] = useState(false);

    // Update internal state when external data changes - but only if it's an external change
    useEffect(() => {
        if (externalEquipmentData && externalEquipmentData.length > 0) {
            // Set flag to prevent notification back to parent during this update
            setIsProcessingExternalUpdate(true);

            setEquipmentData(externalEquipmentData);

            // Update selected parent if it no longer exists or its children changed
            const currentParentInNewData = externalEquipmentData.find(
                item => item.name === selectedParent.name
            );

            if (currentParentInNewData) {
                setSelectedParent(currentParentInNewData);
            } else if (externalEquipmentData.length > 0) {
                setSelectedParent(externalEquipmentData[0]);
            }

            // Clear the flag in the next tick after state updates are processed
            setTimeout(() => {
                setIsProcessingExternalUpdate(false);
            }, 0);
        }
    }, [externalEquipmentData]);

    // Notify parent component when equipment selection changes
    // But only if the change originated from this component (not from props)
    useEffect(() => {
        if (onEquipmentChange && !isProcessingExternalUpdate) {
            onEquipmentChange(equipmentData);
        }
    }, [equipmentData, onEquipmentChange, isProcessingExternalUpdate]);

    // Count selected children for a parent
    const countSelectedChildren = (parent: EquipmentItem): number => {
        return parent.children.filter(child => child.selected).length;
    };

    // Update parent status based on children's status
    const updateParentStatus = (updatedData: EquipmentItem[]): EquipmentItem[] => {
        return updatedData.map(parent => {
            // A parent is selected if at least one of its children is selected
            const hasSelectedChild = parent.children.some(child => child.selected);
            return {
                ...parent,
                selected: hasSelectedChild || (parent.children.length === 0 && parent.selected)
            };
        });
    };

    // Toggle child selection status
    const toggleChildSelection = (parentIndex: number, childIndex: number): void => {
        const updatedData = [...equipmentData];
        const parent = updatedData[parentIndex];

        // Toggle selected state of the child
        parent.children[childIndex] = {
            ...parent.children[childIndex],
            selected: !parent.children[childIndex].selected
        };

        // Update the parent's selected state based on children
        setEquipmentData(updateParentStatus(updatedData));
    };

    // Handle clicking a parent item to display its children
    const handleParentClick = (parent: EquipmentItem): void => {
        setSelectedParent(parent);
    };

    return (
        <Flex width="100%" gap={4}>
            {/* Level 1 Column */}
            <Box width="50%" borderWidth={1} borderRadius="md">
                <Heading size="sm" p={3} borderBottomWidth={1}>
                    Level 1
                </Heading>
                <VStack p={2} align="stretch" spacing={2}>
                    {equipmentData.map((item, index) => {
                        const isSelected = selectedParent.name === item.name;
                        const hasChildren = item.children.length > 0;
                        const selectedChildrenCount = countSelectedChildren(item);

                        return (
                            <Flex
                                key={index}
                                p={2}
                                borderRadius="md"
                                alignItems="center"
                                cursor="pointer"
                                bg={isSelected
                                    ? "orange.500"
                                    : item.selected
                                        ? "gray.400"
                                        : "gray.100"}
                                color={isSelected || item.selected ? "white" : "black"}
                                onClick={() => handleParentClick(item)}
                            >
                                <Checkbox
                                    isChecked={item.selected}
                                    mr={2}
                                    isReadOnly={true}
                                    colorScheme="white"
                                />
                                <Text flex={1} fontWeight={isSelected ? "medium" : "normal"}>
                                    {item.name}
                                    {hasChildren && selectedChildrenCount > 0 && ` (${selectedChildrenCount})`}
                                </Text>
                                {hasChildren && <ChevronRightIcon boxSize={5}/>}
                            </Flex>
                        );
                    })}
                </VStack>
            </Box>

            {/* Level 2 Column */}
            <Box width="50%" borderWidth={1} borderRadius="md">
                <Heading size="sm" p={3} borderBottomWidth={1}>
                    Level 2
                </Heading>
                <VStack p={2} align="stretch" spacing={2}>
                    {selectedParent.children.map((item, index) => {
                        const parentIndex = equipmentData.findIndex(p => p.name === selectedParent.name);

                        return (
                            <Flex
                                key={index}
                                p={2}
                                borderRadius="md"
                                alignItems="center"
                                cursor="pointer"
                                bg={item.selected ? "gray.400" : "gray.100"}
                                color={item.selected ? "white" : "black"}
                                onClick={() => toggleChildSelection(parentIndex, index)}
                            >
                                <Checkbox
                                    isChecked={item.selected}
                                    mr={2}
                                    colorScheme="white"
                                    onChange={() => toggleChildSelection(parentIndex, index)}
                                />
                                <Text flex={1} fontWeight={item.selected ? "medium" : "normal"}>
                                    {item.name}
                                </Text>
                            </Flex>
                        );
                    })}
                </VStack>
            </Box>
        </Flex>
    );
};

export default EquipmentPicker;
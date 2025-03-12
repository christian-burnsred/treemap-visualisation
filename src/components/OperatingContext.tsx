import { Text, Tag, HStack } from "@chakra-ui/react";
import { operatingContext } from "../data/Data.tsx";

// Update props to accept and modify selectedContexts from parent
interface OperatingContextProps {
    selectedContexts: string[];
    setSelectedContexts: (updateFn: (contexts: string[]) => string[]) => void;
}

function OperatingContext({ selectedContexts, setSelectedContexts }: OperatingContextProps) {
    const handleToggle = (contextName: string) => {
        setSelectedContexts((prevSelected) =>
            prevSelected.includes(contextName)
                ? prevSelected.filter((name) => name !== contextName)
                : [...prevSelected, contextName]
        );
    };

    return (
        <>
            <Text fontSize="sm" fontWeight="bold" mb={4}>
                Operating context
            </Text>

            <HStack align="flex-start" spacing={2} wrap="wrap">
                {operatingContext.map((context) => {
                    const isSelected = selectedContexts.includes(context.name);
                    return (
                        <Tag
                            key={context.name}
                            size="md"
                            p={2}
                            cursor="pointer"
                            bg={isSelected ? "orange.500" : "gray.500"}
                            color="white"
                            onClick={() => handleToggle(context.name)}
                        >
                            {context.name}
                        </Tag>
                    );
                })}
            </HStack>
        </>
    );
}

export default OperatingContext;

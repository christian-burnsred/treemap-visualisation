import './App.css';
import DataVisualisationScreen from "./screens/DataVisualisationScreen.tsx";
import { Flex } from "@chakra-ui/react";

function App() {
    return (
        <>
            <Flex
                bgColor="gray.100"
                minHeight="100vh"
                justify="center"
            >
                <Flex
                    bgColor="white"
                    borderRadius="md"
                    boxShadow="md"
                    p={6}
                    my={"30px"}
                >
                    <DataVisualisationScreen />
                </Flex>
            </Flex>
        </>
    );
}

export default App;

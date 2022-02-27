import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box, ChakraProvider, Flex, theme } from "@chakra-ui/react";
import NavBar from "./components/NavBar";
import NewStory from "./components/NewStory";
import Canvas from "./Canvas";

export const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <Box bg="gray.1">
        <NavBar />
        <Flex p={20} w="auto" justifyContent="center" alignItems="center">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<NewStory />} />
              <Route path="*" element={<Canvas />} />
            </Routes>
          </BrowserRouter>
        </Flex>
      </Box>
    </ChakraProvider>
  );
};

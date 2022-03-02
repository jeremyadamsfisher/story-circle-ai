import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box, ChakraProvider, Flex, extendTheme } from "@chakra-ui/react";
import NavBar from "./components/NavBar";
import NewStory from "./components/NewStory";
import Canvas from "./Canvas";

const theme = extendTheme({});

export const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <Box bg="#f7f7f7">
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

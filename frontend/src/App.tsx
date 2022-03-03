import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box, ChakraProvider, Flex, extendTheme } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "react-query";

import NavBar from "./components/NavBar";
import NewStory from "./components/NewStory";
import Canvas from "./Canvas";

const queryClient = new QueryClient();
const theme = extendTheme({
  styles: {
    global: {
      body: {
        background: "#f7f7f7",
      },
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <Box>
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
    </QueryClientProvider>
  );
};

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "react-query";
import NewStory from "./components/NewStory";
import RespondToInvitation from "./components/RespondToInvitation";
import Canvas from "./Canvas";
import StoryList from "./StoriesList";
import theme from "./theme";
import { AppPageWrapper } from "./AppPageWrapper";
import { Auth0ProviderWithHistory } from "./Auth0ProviderWithHistory";

const queryClient = new QueryClient();

export const App = () => {
  return (
    <BrowserRouter>
      <Auth0ProviderWithHistory>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider theme={theme}>
            <Routes>
              <Route
                path="/"
                element={
                  <AppPageWrapper>
                    <NewStory />
                  </AppPageWrapper>
                }
              />
              <Route
                path="/s"
                element={
                  <AppPageWrapper>
                    <StoryList />
                  </AppPageWrapper>
                }
              />
              <Route path="/i/*" element={<RespondToInvitation />} />
              <Route
                path="/g/*"
                element={
                  <AppPageWrapper>
                    <Canvas />
                  </AppPageWrapper>
                }
              />
            </Routes>
          </ChakraProvider>
        </QueryClientProvider>
      </Auth0ProviderWithHistory>
    </BrowserRouter>
  );
};

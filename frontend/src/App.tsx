import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Box,
  ChakraProvider,
  Flex,
  useBreakpointValue,
} from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { Auth0Provider } from "@auth0/auth0-react";
import auth0config from "./auth0config.json";
import NavBar from "./components/NavBarRefined";
import NewStory from "./components/NewStory";
import Canvas from "./Canvas";
import Auth0Redirect from "./components/Auth0Redirect";
import StoryList from "./StoriesList";
import theme from "./theme";

const queryClient = new QueryClient();

export const App = () => {
  const auth0redirect = window.location.origin + "/oauth2redirect";
  const mainPadding = useBreakpointValue({ base: 10, md: 30 });
  return (
    <Auth0Provider
      domain={auth0config.domain}
      clientId={auth0config.clientId}
      redirectUri={auth0redirect}
      audience={auth0config.audience}
      scope={auth0config.scope}
    >
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          <Box>
            <BrowserRouter>
              <NavBar />
              <Box p={5}>
                <Routes>
                  <Route path="/" element={<NewStory />} />
                  <Route path={auth0redirect} element={<Auth0Redirect />} />
                  <Route path="/s" element={<StoryList />} />
                  <Route path="/g/*" element={<Canvas />} />
                </Routes>
              </Box>
            </BrowserRouter>
          </Box>
        </ChakraProvider>
      </QueryClientProvider>
    </Auth0Provider>
  );
};

import Layout from "../components/layout";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "../lib/theme";

import { Auth0ProviderWithRedirects } from "../lib/auth";

export default ({ Component, pageProps }: AppProps) => {
  //@ts-ignore
  const getLayout = Component.getLayout || ((page) => page);
  return (
    <Auth0ProviderWithRedirects>
      <ChakraProvider theme={theme}>
        {getLayout(<Component {...pageProps} />)}
      </ChakraProvider>
    </Auth0ProviderWithRedirects>
  );
};

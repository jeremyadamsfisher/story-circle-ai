import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import { useEffect } from "react";
import theme from "../lib/theme";

export default ({ Component, pageProps }: AppProps) => {
  //@ts-ignore
  const getLayout = Component.getLayout || ((page) => page);
  useEffect(() => {
    if ("Notification" in window) Notification.requestPermission();
  });
  return (
    <ChakraProvider theme={theme}>
      {getLayout(<Component {...pageProps} />)}
    </ChakraProvider>
  );
};

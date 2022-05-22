import React from "react";
import Navbar from "./Navbar";
import { Box } from "@chakra-ui/react";

const Layout: React.FC<{ returnTo: string; children: React.ReactNode }> = ({
  returnTo,
  children,
}) => {
  return (
    <>
      <Navbar returnTo={returnTo} />
      <Box p={{ base: 5, md: 10 }}>{children}</Box>
    </>
  );
};

export default Layout;

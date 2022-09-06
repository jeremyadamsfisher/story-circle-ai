import React from "react";
import Navbar from "./Navbar";
import { Box } from "@chakra-ui/react";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Navbar />
      <Box p={{ base: 5, md: 10 }}>{children}</Box>
    </>
  );
};

export default Layout;

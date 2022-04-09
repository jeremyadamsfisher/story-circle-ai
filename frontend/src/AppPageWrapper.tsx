import { Box } from "@chakra-ui/react";
import { FC } from "react";
import NavBar from "./components/NavBarRefined";

const AppPageWrapper: FC = ({ children }) => (
  <>
    <NavBar />
    <Box p={5}>{children}</Box>
  </>
);

export { AppPageWrapper };

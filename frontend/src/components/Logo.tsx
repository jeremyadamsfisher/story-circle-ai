import { FaLink } from "react-icons/fa";
import { chakra, HStack, Text } from "@chakra-ui/react";

const Logo = () => (
  <chakra.h1 fontSize="xl" fontWeight="bold" ml="2">
    <HStack spacing={0}>
      <Text>story</Text>
      <FaLink />
      <Text>chain</Text>
    </HStack>
  </chakra.h1>
);

export default Logo;

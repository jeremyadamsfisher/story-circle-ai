import { FaLink } from "react-icons/fa";
import { chakra, Flex, HStack, Text, Avatar } from "@chakra-ui/react";
import LogInButton from "./LogInButton";

const NavBar = () => (
  <chakra.header w="full" px={{ base: 2, sm: 4 }} py={4} shadow="sm">
    <Flex alignItems="center" justifyContent="space-between" mx="auto">
      <Flex>
        <chakra.h1 fontSize="xl" fontWeight="bold" ml="2">
          <HStack spacing={0}>
            <Text>story</Text>
            <FaLink />
            <Text>chain</Text>
            <Text color="#7da2a9">(.ai)</Text>
          </HStack>
        </chakra.h1>
      </Flex>
      <Flex>
        <LogInButton />
        {/* <Avatar size="sm" name="single-player" /> */}
      </Flex>
    </Flex>
  </chakra.header>
);

export default NavBar;

import { FaLink } from "react-icons/fa";

import { chakra, Flex, HStack, Text } from "@chakra-ui/react";

const NavBar = () => (
  <chakra.header w="full" px={{ base: 2, sm: 4 }} py={4} shadow="sm">
    <Flex alignItems="center" justifyContent="space-between" mx="auto">
      <Flex>
        <chakra.h1 fontSize="xl" fontWeight="bold" ml="2">
          <HStack spacing={0}>
            {/*
          <GiUnicycle />
          */}
            <Text>story</Text>
            <FaLink />
            <Text>chain</Text>
            <Text color="#7da2a9">(.ai)</Text>
          </HStack>
        </chakra.h1>
      </Flex>
    </Flex>
  </chakra.header>
);

export default NavBar;

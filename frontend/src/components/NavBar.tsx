import { GiUnicycle } from "react-icons/gi";
import { chakra, Flex, HStack, Text } from "@chakra-ui/react";

const NavBar = () => (
  <chakra.header w="full" px={{ base: 2, sm: 4 }} py={4} shadow="sm">
    <Flex alignItems="center" justifyContent="space-between" mx="auto">
      <Flex>
        <chakra.h1 fontSize="xl" fontWeight="bold" ml="2">
          <HStack>
            <GiUnicycle />
            <Text>storycircle.ai</Text>
          </HStack>
        </chakra.h1>
      </Flex>
    </Flex>
  </chakra.header>
);

export default NavBar;

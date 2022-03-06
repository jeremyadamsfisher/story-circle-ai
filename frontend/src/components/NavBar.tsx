import { FaLink } from "react-icons/fa";
import { chakra, Flex, HStack, Text, Avatar } from "@chakra-ui/react";
import { useAuth0 } from '@auth0/auth0-react';
import LogInButton from "./LogInButton";


const NavBar = () => {
  const { isAuthenticated, user } = useAuth0();
  return <chakra.header w="full" px={{ base: 2, sm: 4 }} py={4}>
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
        {isAuthenticated ? <Avatar size="sm" name={user?.name} /> : <LogInButton />}
      </Flex>
    </Flex>
  </chakra.header>
}

export default NavBar;

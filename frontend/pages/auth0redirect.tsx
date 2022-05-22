import React from "react";
import { Center, Text, Spinner, VStack } from "@chakra-ui/react";

const auth0redirect = () => {
  return (
    <Center py={175}>
      <VStack>
        <Text>Redirecting...</Text>
        <Spinner />
      </VStack>
    </Center>
  );
};

export default auth0redirect;

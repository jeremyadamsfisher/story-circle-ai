import { LogInButton } from "../components/LogInOutButtons";
import { Text, Center, VStack } from "@chakra-ui/react";
import { useAuth0 } from "@auth0/auth0-react";

export default () => {
  const { isLoading, error, isAuthenticated, user } = useAuth0();
  if (isLoading || error) {
    return <></>;
  }

  return (
    <Center py={175}>
      <VStack>
        <Text>
          Thanks for joining! We just need to log in to start playing.
        </Text>
        <LogInButton />
      </VStack>
    </Center>
  );
};

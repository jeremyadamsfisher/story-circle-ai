import { useEffect } from "react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { LogInButton } from "../components/LogInOutButtons";
import { Text, Center, VStack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useAuth0 } from "@auth0/auth0-react";
import { useRespondToInvitationCallback } from "../lib/invitation";

export default () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth0();
  const respondToInvitation = useRespondToInvitationCallback();

  useEffect(() => {
    if (isAuthenticated && router.isReady) {
      alert(isAuthenticated!);
      respondToInvitation(router.query!.id as string).then((invitation) => {
        router.push({
          pathname: "/story",
          query: { id: invitation.story.story_uuid },
        });
      });
    }
  }, [isAuthenticated, router.isReady, router.query?.id]);

  if (router.isReady && !router.query?.id) {
    return (
      <Alert borderRadius={5} status="error">
        <AlertIcon />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Malformed query</AlertDescription>
      </Alert>
    );
  }

  if (!isAuthenticated) {
    return (
      <Center py={175}>
        <VStack>
          <Text p={[5, 5, 5, 5]}>
            Thanks for joining! We just need to log in to start playing.
          </Text>
          <LogInButton returnTo="/invitation" />
        </VStack>
      </Center>
    );
  }
};

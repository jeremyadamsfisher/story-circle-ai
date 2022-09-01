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
import { useRespondToInvitationCallback } from "../lib/invitation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/auth";

export default () => {
  const router = useRouter();
  const respondToInvitation = useRespondToInvitationCallback();
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (user && router.isReady) {
      respondToInvitation(router.query!.id as string).then((invitation) => {
        router.push({
          pathname: "/story",
          query: { id: invitation.story.story_uuid },
        });
      });
    }
  }, [user, router.isReady, router.query?.id]);

  if (router.isReady && !router.query?.id) {
    return (
      <Alert borderRadius={5} status="error">
        <AlertIcon />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Malformed query</AlertDescription>
      </Alert>
    );
  }

  if (!user) {
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

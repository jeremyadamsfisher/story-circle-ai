import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { Center, VStack, Text } from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import auth0config from "../auth0config.json";
import CenterSpinner from "./CenterSpinner";
import { LogInButtonSimple } from "./LogInOutButtons";
import config from "../config";

const RespondToInvitation = () => {
  const {
    isLoading: auth0Loading,
    loginWithRedirect,
    isAuthenticated,
    getAccessTokenSilently
  } = useAuth0();
  const [doneResponding, setDoneResponding] = useState<boolean>(false);
  const [storyUuid, setStoryUuid] = useState<string | undefined>();

  const location = useLocation();
  const invitationId = location.pathname.slice("/i/".length);

  useEffect(() => {
    const respond = async () => {
      const token = await getAccessTokenSilently({
        audience: auth0config.audience,
      });
      const { data: invitationResp } = await axios({
        url: `${config.baseUrl}/invitations/respond/${invitationId}`,
        method: "get",
        headers: { Authorization: `Bearer ${token}` },
      });
      setStoryUuid(invitationResp.story_uuid)
    }
    respond()
    setDoneResponding(true);
  }, []);

  if (auth0Loading || doneResponding == true) {
    return <CenterSpinner />;
  } else if (isAuthenticated) {
    return <Navigate to={`/g/${storyUuid}`} />;
  }

  return (
    <Center h={256}>
      <VStack>
        <Text>
          Thanks for joining! We just need to log in to start playing.
        </Text>
        <LogInButtonSimple
          variant="outline"
          onClick={() => {
            loginWithRedirect({
              appState: { returnTo: location.pathname },
            });
          }}
        />
      </VStack>
    </Center>
  );
};

export default RespondToInvitation;

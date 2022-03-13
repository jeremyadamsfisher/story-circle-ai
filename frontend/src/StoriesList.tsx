import axios from "axios";
import {
  Alert,
  Heading,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Text,
  List,
  ListItem,
} from "@chakra-ui/react";
import { useAuth0 } from "@auth0/auth0-react";
import { useQuery } from "react-query";
import CenterSpinner from "./components/CenterSpinner";
import auth0config from "./auth0config.json";
import config from "./config";

interface StoryListData {
  stories_originated: number[];
  stories_participated_in: number[];
}

const StoryList = () => {
  const auth0 = useAuth0();

  const query = useQuery<StoryListData, Error>("storyList", async () => {
    const token = await auth0.getAccessTokenSilently({
      audience: auth0config.audience,
    });
    const { data } = await axios.get(`${config.baseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data;
  });

  if (auth0.isLoading || query.isLoading) {
    return <CenterSpinner />;
  }

  if (!auth0.isAuthenticated) {
    return <Text>Log in to view stories.</Text>;
  }

  if (query.isError) {
    <Alert status="error">
      <AlertIcon />
      <AlertTitle mr={2}>Error:</AlertTitle>
      <AlertDescription>{query.error}</AlertDescription>
    </Alert>;
  }

  return (
    <HStack>
      <Heading size="md">Stories Originated</Heading>
      <List>
        {query.data!.stories_originated.map((x) => (
          <ListItem>{x}</ListItem>
        ))}
      </List>
      <br />
      <Heading size="md">Stories Participated In</Heading>
      <List>
        {query.data!.stories_participated_in.map((x) => (
          <ListItem>{x}</ListItem>
        ))}
      </List>
    </HStack>
  );
};

export default StoryList;

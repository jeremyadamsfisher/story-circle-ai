import { QuestionIcon, SettingsIcon } from "@chakra-ui/icons";
import { Center, Spinner, VStack, Text, Box, Button } from "@chakra-ui/react";
import { FaUserPlus } from "react-icons/fa";
import { VscDebugContinue } from "react-icons/vsc";
import axios from "axios";
import { useQuery, useMutation } from "react-query";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Story, Segment } from "./Story";
import WriteField from "./components/WriteField";
import config from "./config";
import BeatLoader from "react-spinners/BeatLoader";
import { useAuth0 } from "@auth0/auth0-react";
import auth0config from "./auth0config.json";
import CenterSpinner from "./components/CenterSpinner";

type Sentence = Segment;

const Canvas = () => {
  const auth0 = useAuth0();

  const useStory = (story_uuid: string) =>
    useQuery<Story, Error>(
      story_uuid,
      async () => {
        const { data } = await axios.get(
          `${config.baseUrl}/story/${story_uuid}`
        );
        return data;
      },
      { refetchInterval: 1000 }
    );

  const addToStory = useMutation(
    async ({
      story_uuid,
      segment,
    }: {
      story_uuid: string;
      segment: string;
    }) => {
      if (auth0.isAuthenticated) {
        const token = await auth0.getAccessTokenSilently({
          audience: auth0config.audience,
        });
        axios({
          url: `${
            config.baseUrl
          }/story/${story_uuid}/multiPlayer?content=${encodeURI(segment)}`,
          method: "put",
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        axios.put(
          `${
            config.baseUrl
          }/story/${story_uuid}/singlePlayer?content=${encodeURI(segment)}`
        );
      }
    }
  );

  const [content, setContent] = useState<string>("");

  const location = useLocation();
  const story_uuid = location.pathname.slice(3); // remove beginning `/g/`

  const { isLoading, isError, data, error } = useStory(story_uuid);

  if (isLoading || auth0.isLoading) {
    return <CenterSpinner />;
  }
  if (isError) {
    return <div>Error: {error}</div>;
  }

  const isCurrentUserTurn =
    data!.whose_turn_is_it.single_player ||
    data!.whose_turn_is_it.name === auth0.user!.email;

  // reshape segments such that segments with multiple lines are rendered
  // as <br/>'s
  const elems: (Sentence | null)[] = [];
  data!.segments.forEach((segment) => {
    const [firstLine, ...remainingLines] = segment.content.split("\n");
    elems.push({ content: firstLine, author: segment.author } as Sentence);
    remainingLines.forEach((remainingLine) => {
      elems.push(null); // flag to render <br/> - can this be merged?
      elems.push({
        content: remainingLine,
        author: segment.author,
      } as Sentence);
    });
  });

  return (
    <Box>
      <Box bg="gray.50" borderRadius="5" shadow="inner" width="100%">
        <Box textAlign="center" fontSize="xl" p={10}>
          {elems.map((elem) =>
            elem ? <Text as="span">{elem.content} </Text> : <br />
          )}
          {isCurrentUserTurn ? (
            <WriteField content={content} setContent={setContent} />
          ) : (
            <BeatLoader size={7} />
          )}
        </Box>
      </Box>
      <VStack p={10} spacing={3}>
        <Button
          onClick={() => {
            setContent("");
            addToStory.mutate({
              story_uuid: story_uuid,
              segment: content,
            });
          }}
          disabled={!isCurrentUserTurn}
          w="250px"
          rightIcon={<VscDebugContinue />}
        >
          end turn
        </Button>
        <Button w="250px" variant="outline" rightIcon={<FaUserPlus />}>
          invite another player
        </Button>
        <Button w="250px" variant="outline" rightIcon={<SettingsIcon />}>
          change ai settings
        </Button>
        <Button w="250px" variant="outline" rightIcon={<QuestionIcon />}>
          how do i play this game
        </Button>
      </VStack>
    </Box>
  );
};

export default Canvas;

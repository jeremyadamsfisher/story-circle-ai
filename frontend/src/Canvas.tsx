import {
  Kbd,
  HStack,
  Spinner,
  Text,
  VStack,
  Box,
  Button,
} from "@chakra-ui/react";
import axios from "axios";
import { useQuery, useMutation } from "react-query";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Story, Segment } from "./Story";
import WriteField from "./components/WriteField";
import config from "./config";
import BeatLoader from "react-spinners/BeatLoader";
import { useAuth0 } from "@auth0/auth0-react";

type Sentence = Segment;

const Canvas = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

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
      if (isAuthenticated) {
        const token = await getAccessTokenSilently();
        axios.put(
          `${config.baseUrl}/story/${story_uuid}?content=${encodeURI(segment)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        axios.put(
          `${config.baseUrl}/story/${story_uuid}?content=${encodeURI(segment)}`
        );
      }
    }
  );

  const [content, setContent] = useState<string>("");

  const location = useLocation();
  const story_uuid = location.pathname.slice(3); // remove beginning `/g/`

  const { isLoading, isError, data, error } = useStory(story_uuid);

  if (isLoading) {
    return <Spinner />;
  }
  if (isError) {
    return <div>Error: {error}</div>;
  }

  const isCurrentUserTurn = data!.whose_turn_is_it.single_player;
  const isAiTurn = data!.whose_turn_is_it.ai_player;

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
    <Box bg="white" borderRadius="5" shadow="xs">
      <VStack p={15}>
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
        <HStack p={10}>
          <span>to end your turn, type</span>
          <span>
            <Kbd>shift</Kbd> + <Kbd>enter</Kbd>
          </span>
          <span>or click on</span>
          <Button
            colorScheme="purple"
            onClick={() => {
              setContent("");
              addToStory.mutate({
                story_uuid: story_uuid,
                segment: content,
              });
            }}
            disabled={!isCurrentUserTurn}
          >
            end turn
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default Canvas;

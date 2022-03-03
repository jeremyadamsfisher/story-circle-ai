import {
  HStack,
  Spinner,
  Text,
  VStack,
  Box,
  Button,
  ButtonGroup,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
} from "@chakra-ui/react";
import axios from "axios";
import { useQuery, useMutation } from "react-query";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Story, Segment } from "./Story";
import WriteField from "./components/WriteField";
import LogInButton from "./components/LogInButton";
import config from "./config";
import BeatLoader from "react-spinners/BeatLoader";

type SentenceBreak = {
  content: string;
};
type Sentence = Segment;

const isSentence = (x: any): x is Sentence => {
  return (x as Sentence) !== undefined;
};

const Canvas = () => {
  const useStory = (story_uuid: string) =>
    useQuery<Story, Error>(
      story_uuid,
      async () => {
        const { data } = await axios.get(
          `${config.baseUrl}/story/${story_uuid}`
        );
        return data;
      }
      // { refetchInterval: 1000 }
    );
  const addToStory = useMutation(
    ({ story_uuid, segment }: { story_uuid: string; segment: string }) =>
      axios.put(
        `${config.baseUrl}/story/${story_uuid}?content=${encodeURI(segment)}`
      )
  );

  const [content, setContent] = useState<string>("");

  const location = useLocation();
  const story_uuid = location.pathname.slice(1); // remove beginning slash

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
  const elems: (Sentence | SentenceBreak)[] = [];
  data!.segments.forEach((segment) => {
    const [firstLine, ...remainingLines] = segment.content.split("\n");
    elems.push({ content: firstLine, author: segment.author } as Sentence);
    remainingLines.forEach((remainingLine) => {
      elems.push({ content: "" } as SentenceBreak);
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
          {elems.map((elem) => {
            if (elem.content === "") {
              return <br />;
            } else {
              return <Text as="span">{elem.content} </Text>;
            }
          })}
          {isCurrentUserTurn ? (
            <WriteField content={content} setContent={setContent} />
          ) : (
            <BeatLoader size={7} />
          )}
        </Box>
        <HStack p={10}>
          <ButtonGroup size="sm" isAttached variant="outline">
            <Button
              onClick={() => {
                setContent("");
                addToStory.mutate({
                  story_uuid: story_uuid,
                  segment: content,
                });
              }}
              disabled={!isCurrentUserTurn}
            >
              Add this to the story
            </Button>
            <Popover>
              <PopoverTrigger>
                <Button>Invite another player</Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader pt={4} fontWeight="bold" border="0">
                  Hold on a sec!
                </PopoverHeader>
                <PopoverBody>
                  <VStack>
                    <Text>
                      Before you can invite a player, you need to log in so they
                      will know who is inviting them.
                    </Text>
                    <ButtonGroup d="flex" justifyContent="left">
                      <LogInButton />
                    </ButtonGroup>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </ButtonGroup>
        </HStack>
      </VStack>
    </Box>
  );
};

export default Canvas;

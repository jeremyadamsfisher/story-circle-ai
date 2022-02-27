import {
  HStack,
  Stack,
  Skeleton,
  Spinner,
  Text,
  VStack,
  Box,
  Button,
  ButtonGroup,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { Story } from "./Story";

const Canvas = () => {
  const location = useLocation();
  const user = new URLSearchParams(location.search).get("user");

  const [story, setStory] = useState<Story | undefined>();
  const [currentSegmentContent, setCurrentSegmentContent] =
    useState<string>("");

  const submitStorySegment = async () => {
    await fetch(
      `http://localhost:8000/story${location.pathname}?content=${encodeURI(
        currentSegmentContent
      )}`,
      {
        method: "PUT",
        headers: { "x-user": user! },
      }
    );
  };

  const isCurrentUserTurn = story
    ? story!.whose_turn_is_it.name === user
    : false;

  const fetchStory = async () => {
    const response = await fetch(
      `http://localhost:8000/story${location.pathname}`,
      {
        method: "GET",
      }
    );
    const story = await response.json();
    setStory(story);
  };
  useEffect(() => {
    fetchStory();
  }, []);

  return story ? (
    <Box bg="white" borderRadius="5" shadow="xs">
      <VStack p={15}>
        <Box textAlign="center" fontSize="xl" p={10}>
          {story.segments.map((segment, index) => (
            <Tooltip
              label={
                segment.author.single_player
                  ? "Written by you"
                  : segment.author.ai_player
                  ? "Written by AI player"
                  : `Written by ${segment.author.name}`
              }
              placement="top"
            >
              <span key={index}>{segment.content} </span>
            </Tooltip>
          ))}
          {isCurrentUserTurn && (
            <span
              contentEditable={true}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                setCurrentSegmentContent(e.target.innerText);
              }}
            >
              Write here.
            </span>
          )}
        </Box>
        {!isCurrentUserTurn && (
          <Stack>
            <Skeleton height="20px" />
            <Skeleton height="20px" />
            <Skeleton height="20px" />
          </Stack>
        )}
        <HStack p={10}>
          <ButtonGroup size="sm" isAttached variant="solid">
            <Button onClick={submitStorySegment} disabled={!isCurrentUserTurn}>
              Add this to the story
            </Button>
            <Popover>
              <PopoverTrigger>
                <Button colorScheme="teal">Invite another player</Button>
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
                      <Button leftIcon={<FaUserCircle />} colorScheme="teal">
                        Log in
                      </Button>
                    </ButtonGroup>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </ButtonGroup>
        </HStack>
      </VStack>
    </Box>
  ) : (
    <Spinner />
  );
};

export default Canvas;

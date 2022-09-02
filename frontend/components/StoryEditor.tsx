import React from "react";
import {
  Avatar,
  Box,
  Center,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  HStack,
  Text,
} from "@chakra-ui/react";
import { useStory } from "../lib/story";
import StoryNewLineField from "../components/StoryNewLineField";
import { hashString } from "../lib/utils";
import { BeatLoader } from "react-spinners";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/auth";

export default () => {
  const [user] = useAuthState(auth);
  const { story, error } = useStory();
  const outline = {
    shadow: "xs",
    borderRadius: 5,
    width: "100%",
    padding: 10,
  };
  const greyBg = useColorModeValue("gray.50", "gray.700");
  if (!story)
    return (
      <Center {...outline} background={greyBg}>
        <Spinner />
      </Center>
    );
  if (error)
    return (
      <Alert status="error" {...outline}>
        <AlertIcon />
        <AlertTitle mr={2}>Error:</AlertTitle>
        <AlertDescription>{error.toString()}</AlertDescription>
      </Alert>
    );

  const isPlayerTurn = user
    ? story.whose_turn_is_it.name === user.email
    : story.whose_turn_is_it.single_player === true;

  return (
    <Box {...outline} textAlign={"center"} background={greyBg}>
      {story.segments.map((segment, i: number) => {
        const lines = segment.content.split("\n");
        return (
          <>
            {/* new line characters are ignored by HTML engines */}
            {lines.map((line, j: number) => {
              const key = hashString(line + "@" + i + ":" + j);
              const lastLine = j === lines.length - 1;
              return (
                <>
                  <span key={key}>{line}</span>
                  {!lastLine && <br />}{" "}
                </>
              );
            })}
          </>
        );
      })}
      {isPlayerTurn ? (
        <StoryNewLineField />
      ) : story.whose_turn_is_it.ai_player ? (
        <span>
          <BeatLoader size={5} />
        </span>
      ) : (
        <Center>
          <Box
            mt={10}
            p={2}
            w={"auto"}
            borderWidth={1}
            rounded={"md"}
            bg={greyBg}
          >
            <HStack>
              <Text>Waiting for</Text>
              <Avatar size={"xs"} name={story.whose_turn_is_it.name} />
            </HStack>
          </Box>
        </Center>
      )}
    </Box>
  );
};

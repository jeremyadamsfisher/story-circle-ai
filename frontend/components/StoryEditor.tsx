import React, { useEffect } from "react";
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
import { isUserTurn } from "../lib/story";
import { schemas } from "../lib/access";

type StorySegment = schemas["StorySegmentRead"];

const useGreyBg = () => useColorModeValue("gray.50", "gray.700");

const TurnIndicator: React.FC = () => {
  const [user] = useAuthState(auth);
  const { story } = useStory();

  if (!story || story?.whose_turn_is_it === undefined) {
    // loading story or waiting for server to update
    return <React.Fragment></React.Fragment>;
  } else if (story?.whose_turn_is_it?.ai_player) {
    return <WaitingForAI />;
  } else {
    if (!isUserTurn(user, story)) {
      return <WaitingForOtherPlayer playerName={story.whose_turn_is_it.name} />;
    } else {
      // If it is single player, display nothing
      return <React.Fragment></React.Fragment>;
    }
  }
};

const WaitingForOtherPlayer = ({ playerName }: { playerName: string }) => {
  const greyBg = useGreyBg();
  return (
    <Center>
      <Box mt={10} p={2} w={"auto"} borderWidth={1} rounded={"md"} bg={greyBg}>
        <HStack>
          <Text>Waiting for</Text>
          <Avatar size={"xs"} name={playerName} />
        </HStack>
      </Box>
    </Center>
  );
};

const WaitingForAI: React.FC = () => {
  const foregroundColor = useColorModeValue("black", "white");
  return (
    <span>
      <BeatLoader size={5} color={foregroundColor} />
    </span>
  );
};

export default () => {
  const [user] = useAuthState(auth);
  const { story, error } = useStory();

  const outline = {
    shadow: "xs",
    borderRadius: 5,
    width: "100%",
    padding: 10,
  };
  const greyBg = useGreyBg();
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

  return (
    <Box {...outline} textAlign={"center"} background={greyBg}>
      {story.segments.map((segment: StorySegment, i: number) => {
        const lines = segment.content.split("\n");
        return (
          <React.Fragment key={i}>
            {/* new line characters are ignored by HTML engines */}
            {lines.map((line, j: number) => {
              const key = hashString(line + "@" + i + ":" + j);
              const lastLine = j === lines.length - 1;
              return (
                <React.Fragment key={j}>
                  <span key={key}>{line}</span>
                  {!lastLine && <br />}{" "}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
      {story.whose_turn_is_it !== undefined && isUserTurn(user, story) ? (
        <StoryNewLineField />
      ) : (
        <TurnIndicator />
      )}
    </Box>
  );
};

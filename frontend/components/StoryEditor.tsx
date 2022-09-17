import React, { useMemo } from "react";
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
  Tooltip,
} from "@chakra-ui/react";
import { useStory } from "../lib/story";
import StoryNewLineField from "../components/StoryNewLineField";
import { hashString } from "../lib/utils";
import { BeatLoader } from "react-spinners";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/auth";
import { isUserTurn } from "../lib/user";
import { schemas } from "../lib/access";

type StorySegment = schemas["StorySegmentRead"];

const useTextColor = () => useColorModeValue("black", "white");
const useGreyBg = () => useColorModeValue("gray.50", "gray.700");
const useUserColors = () => {
  const blue = useColorModeValue("blue.50", "blue.700");
  const red = useColorModeValue("red.50", "red.700");
  const green = useColorModeValue("green.50", "green.700");
  const purple = useColorModeValue("purple.50", "purple.700");
  return [blue, red, green, purple];
};

const TurnIndicator: React.FC = () => {
  const [user] = useAuthState(auth);
  const { story } = useStory();

  if (
    !story ||
    story?.whose_turn_is_it === undefined ||
    story?.whose_turn_is_it?.ai_player
  ) {
    // loading story, waiting for AI or waiting for server to update
    return <WaitingForServerAction />;
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

const WaitingForServerAction: React.FC = () => {
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

  const playerColors = useUserColors();
  const player2Color = useMemo(() => {
    if (!story) return;
    const m = new Map();
    story.players.forEach((player, i) => {
      m.set(player.name, playerColors[i % playerColors.length]);
    });
    return m;
  }, [story, playerColors]);

  const outline = {
    shadow: "xs",
    borderRadius: 5,
    width: "100%",
    padding: 10,
  };
  const greyBg = useGreyBg();
  const textColor = useTextColor();

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
    <Box {...outline} textAlign={"center"}>
      {story.segments.map((segment: StorySegment, i: number) => {
        const lines = segment.content.split("\n");
        const author = segment.author.name;
        const label = `Written by: ${
          author === "ai-player"
            ? "AI agent"
            : author === "single-player"
            ? "you"
            : author
        }`;
        return (
          <Tooltip label={label} aria-label={label}>
            <Box
              color={textColor}
              background={player2Color?.get(author)}
              rounded={"md"}
              as={"span"}
              key={i}
              m={1}
            >
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
            </Box>
          </Tooltip>
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

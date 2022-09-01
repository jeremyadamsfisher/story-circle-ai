import React from "react";
import {
  Box,
  Center,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
} from "@chakra-ui/react";
import { useStory } from "../lib/story";
import StoryNewLineField from "../components/StoryNewLineField";
import { hashString } from "../lib/utils";

export default () => {
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
  return (
    <Box {...outline} textAlign={"center"} background={greyBg}>
      {story.segments.map((segment, i: number) => {
        const lines = segment.content.split("\n");
        return (
          <>
            {/* new line characters are ignored by HTML engines */}
            {lines.map((line, j: number) => {
              const key = hashString(line + "@" + i + ":" + j);
              const notLastLine = j !== lines.length - 1;
              return (
                <>
                  <span key={key}>{line}</span>
                  {notLastLine && <br />}{" "}
                </>
              );
            })}
          </>
        );
      })}
      <StoryNewLineField />
    </Box>
  );
};

import {
  useBreakpoint,
  Stack,
  Spacer,
  Button,
  ButtonProps,
} from "@chakra-ui/react";
import { useStory } from "../lib/story";
import { useClientContext } from "../pages/story";
import { InviteButton } from "../components/InviteButton";
// import { AddIcon } from "@chakra-ui/icons";
import NextLink from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/auth";

const ToolkitButtonOps = {
  w: { base: "100%", md: "300px" },
};

const ToolkitButton = ({ children, ...props }: ButtonProps) => {
  return (
    <Button {...ToolkitButtonOps} {...props}>
      {children}
    </Button>
  );
};

export default () => {
  const { newLineContent, setNewLineContent } = useClientContext();
  const { addToStoryCallback } = useStory();
  const [user] = useAuthState(auth);

  return (
    <Stack py={5} direction={{ base: "column", md: "row" }} align={"center"}>
      <ToolkitButton
        colorScheme={"teal"}
        onClick={() => {
          addToStoryCallback(newLineContent);
          setNewLineContent("");
        }}
        disabled={newLineContent ? false : true}
      >
        Add to story
      </ToolkitButton>
      <ToolkitButton variant={"solid"} mr={4}>
        <NextLink href={"/"}>
          <a>New story</a>
        </NextLink>
      </ToolkitButton>
      {useBreakpoint() !== "sm" && <Spacer />}{" "}
      {user && <InviteButton variant={"solid"} {...ToolkitButtonOps} />}
      {/* <ToolkitButton>How do I play this game</ToolkitButton> */}
    </Stack>
  );
};

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
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/auth";
import { useRouter } from "next/router";

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
  const router = useRouter();

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
      <ToolkitButton
        variant={"solid"}
        mr={4}
        onClick={() => {
          router.push("/");
        }}
      >
        New story
      </ToolkitButton>
      {useBreakpoint() !== "sm" && <Spacer />}{" "}
      {user && <InviteButton variant={"solid"} {...ToolkitButtonOps} />}
      {/* <ToolkitButton>How do I play this game</ToolkitButton> */}
    </Stack>
  );
};

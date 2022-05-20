import { Button, ButtonProps } from "@chakra-ui/react";
import { useAuth0 } from "@auth0/auth0-react";
import { FaUserCircle } from "react-icons/fa";
import { useStoryUuid } from "../lib/story";

export const LogInButton: React.FC<ButtonProps> = (props) => {
  const { loginWithRedirect } = useAuth0();
  const storyUuid = useStoryUuid();
  return (
    <Button
      leftIcon={<FaUserCircle />}
      {...props}
      onClick={() =>
        loginWithRedirect({
          returnTo: "/story",
          appState: { id: storyUuid },
        })
      }
    >
      Log in
    </Button>
  );
};

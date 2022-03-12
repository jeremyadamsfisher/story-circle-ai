import { Button } from "@chakra-ui/react";
import { FaUserCircle } from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";

const LogInButton = () => {
  const { loginWithRedirect } = useAuth0();
  return (
    <Button
      colorScheme="purple"
      onClick={() => loginWithRedirect()}
      leftIcon={<FaUserCircle />}
    >
      Log in
    </Button>
  );
};

const LogOutButton = () => {
  const { logout } = useAuth0();
  return (
    <Button colorScheme="purple" onClick={() => logout()}>
      Log out
    </Button>
  );
};

export { LogInButton, LogOutButton };

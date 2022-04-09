import { Button, ButtonProps, useMediaQuery } from "@chakra-ui/react";
import { FaUserCircle } from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";

const LogInButton: React.FC<ButtonProps> = (props) => {
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const { loginWithRedirect } = useAuth0();
  if (isMobile) {
    return (
      <Button variant="ghost" onClick={() => loginWithRedirect()} {...props}>
        log in
      </Button>
    );
  }
  return <LogInButtonSimple variant="ghost" onClick={() => loginWithRedirect()} />;
};

const LogInButtonSimple: React.FC<ButtonProps> = (props) => {
  return (
    <Button leftIcon={<FaUserCircle />} {...props}>
      log in
    </Button>
  );
};

const LogOutButton: React.FC<ButtonProps> = (props) => {
  const { logout } = useAuth0();
  return (
    <Button onClick={() => logout()} variant="secondary" {...props}>
      log out
    </Button>
  );
};

export { LogInButton, LogOutButton, LogInButtonSimple };

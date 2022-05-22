import { Button, ButtonProps, Spinner } from "@chakra-ui/react";
import { useAuth0 } from "@auth0/auth0-react";
import { FaUserCircle } from "react-icons/fa";
import { useRouter } from "next/router";

interface LoginButtonProps extends ButtonProps {
  returnTo: string;
}

export const LogInButton: React.FC<LoginButtonProps> = ({
  returnTo,
  ...props
}) => {
  const { loginWithRedirect } = useAuth0();
  const { query, isReady } = useRouter();

  if (!isReady) {
    return <Spinner />;
  }

  return (
    <Button
      leftIcon={<FaUserCircle />}
      {...props}
      onClick={() => {
        loginWithRedirect({
          appState: {
            id: query.id,
            returnTo: returnTo,
          },
        });
      }}
    >
      Log in
    </Button>
  );
};

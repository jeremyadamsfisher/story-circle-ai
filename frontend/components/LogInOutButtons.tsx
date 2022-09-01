import { Button, ButtonProps, Spinner } from "@chakra-ui/react";
import { FaUserCircle } from "react-icons/fa";
import { auth } from "../lib/auth";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useCallback } from "react";

interface LoginButtonProps extends ButtonProps {
  returnTo: string;
}

export const LogInButton: React.FC<LoginButtonProps> = ({
  returnTo,
  ...props
}) => {
  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  return (
    <Button
      leftIcon={<FaUserCircle />}
      {...props}
      onClick={() => signInWithGoogle()}
    >
      Log in
    </Button>
  );
};

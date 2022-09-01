import {
  Box,
  Flex,
  Avatar,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Button,
  Center,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorMode,
  useColorModeValue,
  Heading,
} from "@chakra-ui/react";
import { CgLogOut } from "react-icons/cg";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { BiBookOpen } from "react-icons/bi";
import { LogInButton } from "./LogInOutButtons";
import { signOut } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/auth";

const Logo = () => <Heading size={"md"}>Story Circle</Heading>;

interface INavBar {
  returnTo: string;
}

const NavBar: React.FC<INavBar> = ({ returnTo }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [user, isLoading, auth0Error] = useAuthState(auth);

  return (
    <Box
      bg={useColorModeValue("white", "gray.800")}
      color={useColorModeValue("gray.600", "white")}
      minH={"60px"}
      py={{ base: 2 }}
      px={{ base: 4 }}
      borderBottom={1}
      borderStyle={"solid"}
      borderColor={useColorModeValue("gray.200", "gray.700")}
    >
      <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
        <Logo />
        <HStack alignItems={"center"}>
          <Button variant={"ghost"} onClick={toggleColorMode}>
            {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          </Button>
          {!isLoading && auth0Error && (
            <Alert borderRadius={5} status="error">
              <AlertIcon />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{auth0Error.message}</AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <></>
          ) : user ? (
            <Flex alignItems={"center"}>
              <Menu>
                <MenuButton
                  as={Button}
                  rounded={"full"}
                  variant={"link"}
                  cursor={"pointer"}
                  minW={0}
                >
                  <Avatar size={"md"} name={user!.displayName || ""} />
                </MenuButton>
                <MenuList>
                  <Center style={{ padding: 10 }}>
                    <Avatar
                      size={"2xl"}
                      src={user!.photoURL ? user!.photoURL : undefined}
                    />
                  </Center>
                  <Center style={{ padding: 10 }}>
                    <p>{user!.email}</p>
                  </Center>
                  {/* <MenuItem icon={<BiBookOpen />}>Your stories</MenuItem> */}
                  <MenuItem icon={<CgLogOut />} onClick={() => signOut(auth)}>
                    Log out
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>
          ) : (
            <LogInButton returnTo={returnTo} />
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default NavBar;

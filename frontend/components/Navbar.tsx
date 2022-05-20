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
import { useAuth0 } from "@auth0/auth0-react";

const Logo = () => <Heading size={"md"}>Story Circle</Heading>;

export default function Navbar() {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isLoading, error: auth0Error, isAuthenticated, user } = useAuth0();
  const { logout } = useAuth0();
  return (
    <>
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
            {auth0Error && (
              <Alert borderRadius={5} status="error">
                <AlertIcon />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{auth0Error.message}</AlertDescription>
              </Alert>
            )}
            {isLoading ? (
              <></>
            ) : isAuthenticated ? (
              <Flex alignItems={"center"}>
                <Menu>
                  <MenuButton
                    as={Button}
                    rounded={"full"}
                    variant={"link"}
                    cursor={"pointer"}
                    minW={0}
                  >
                    <Avatar size={"md"} name={"Jeremy Fisher"} />
                  </MenuButton>
                  <MenuList>
                    <MenuItem icon={<BiBookOpen />}>Your stories</MenuItem>
                    <MenuItem icon={<CgLogOut />} onClick={logout}>
                      Log out
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
            ) : (
              <LogInButton />
            )}
          </HStack>
        </Flex>
      </Box>
    </>
  );
}

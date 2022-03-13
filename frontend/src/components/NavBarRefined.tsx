import {
  Avatar,
  Center,
  Stack,
  MenuDivider,
  Flex,
  Button,
  ButtonGroup,
  Menu,
  Box,
  MenuButton,
  IconButton,
  MenuItem,
  MenuList,
  useMediaQuery,
} from "@chakra-ui/react";
import Logo from "./Logo";
import { useAuth0 } from "@auth0/auth0-react";
import { AddIcon } from "@chakra-ui/icons";
import { BiLibrary, BiLogOut } from "react-icons/bi";
import { LogInButton } from "./LogInOutButtons";
import { Link } from "react-router-dom";

const NewStoryButton = () => {
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  return (
    <Link to="/">
      {isMobile ? (
        <IconButton
          borderRadius="999px"
          aria-label="new story"
          icon={<AddIcon />}
        />
      ) : (
        <Button leftIcon={<AddIcon />}>new story</Button>
      )}
    </Link>
  );
};

const NavBar = () => {
  const { isLoading, isAuthenticated, user } = useAuth0();
  const { logout } = useAuth0();

  return (
    <Box boxShadow="xs" px={4}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Logo />
        <Flex alignItems="center">
          <Stack direction="row">
            {!isLoading &&
              (isAuthenticated ? (
                <>
                  <NewStoryButton />
                  <Menu size="md">
                    <MenuButton
                      as={Button}
                      rounded="full"
                      variant="link"
                      cursor="pointer"
                      minW={0}
                      shadow="none"
                    >
                      <Avatar size="full" boxSize="40px" />
                    </MenuButton>
                    <MenuList alignItems="center">
                      <br />
                      <Center>
                        <Avatar size="xl" name={user!.name} />
                      </Center>
                      <br />
                      <Link to="/s">
                        <MenuItem icon={<BiLibrary />}>
                          see your stories
                        </MenuItem>
                      </Link>
                      <MenuDivider />
                      <MenuItem onClick={() => logout()} icon={<BiLogOut />}>
                        log out
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </>
              ) : (
                <ButtonGroup>
                  <NewStoryButton />
                  <LogInButton />
                </ButtonGroup>
              ))}
          </Stack>
        </Flex>
      </Flex>
    </Box>
  );
};

export default NavBar;

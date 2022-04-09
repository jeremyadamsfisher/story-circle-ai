import { QuestionIcon } from "@chakra-ui/icons";
import {
  FormErrorMessage,
  Input,
  FormControl,
  FormLabel,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  VStack,
  Text,
  Box,
  Button,
  ButtonProps,
  useToast,
} from "@chakra-ui/react";
import { FaUserPlus } from "react-icons/fa";
import { VscDebugContinue } from "react-icons/vsc";
import axios from "axios";
import { useQuery, useMutation } from "react-query";
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Story, Segment } from "./Story";
import WriteField from "./components/WriteField";
import config from "./config";
import BeatLoader from "react-spinners/BeatLoader";
import { useAuth0 } from "@auth0/auth0-react";
import auth0config from "./auth0config.json";
import { Formik, Form, Field, FieldInputProps, FormikProps } from "formik";
import CenterSpinner from "./components/CenterSpinner";

type Sentence = Segment;

const InvitePlayerForm: React.FC<{ storyUuid: string, dismiss: () => void }> = ({ storyUuid, dismiss }) => {
  const toast = useToast();
  const auth0 = useAuth0();

  const validateName = (value: string) => {
    let error;
    if (!value) {
      error = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)) {
      error = "Invalid email address";
    }
    return error;
  };

  return (
    <Formik
      initialValues={{ email: "" }}
      onSubmit={async (values, actions) => {
        const token = await auth0.getAccessTokenSilently({
          audience: auth0config.audience,
        });
        const {data:invitationResp} = await axios({
          url: `${config.baseUrl}/invitations/send`,
          method: "post",
          headers: { Authorization: `Bearer ${token}` },
          data: { story_uuid: storyUuid, invitee_email: values.email },
        });
        console.log(invitationResp);
        toast({
          title: "invitation sent",
          description: `${values.email} will be able to create an account and join this game!`,
          status: "success",
          duration: 9000,
          isClosable: true,
        });
        actions.setSubmitting(false);
        dismiss();
      }}
    >
      {(props) => (
        <Form>
          <Field name="email" validate={validateName}>
            {({
              field,
              form,
            }: {
              field: FieldInputProps<string>;
              form: FormikProps<any>;
            }) => (
              //@ts-ignore
              <FormControl isInvalid={form.errors.email && form.touched.email}>
                <FormLabel htmlFor="email">email of other player</FormLabel>
                <Input
                  {...field}
                  type="email"
                  id="email"
                  placeholder="foo@bar.com"
                />
                <FormErrorMessage>{form.errors.email}</FormErrorMessage>
              </FormControl>
            )}
          </Field>
          <Button
            mt={4}
            w={"100%"}
            isLoading={props.isSubmitting}
            type="submit"
          >
            send
          </Button>
        </Form>
      )}
    </Formik>
  );
};

interface InvitePlayerPopoverProps extends ButtonProps {
  storyUuid: string;
}

const InvitePlayerPopover: React.FC<InvitePlayerPopoverProps> = ({ storyUuid, ...buttonProps }) => {
  const [invitePlayerDialogOpen, setInvitePlayerDialogOpen] = useState(false);
  return (
    <Popover
      isOpen={invitePlayerDialogOpen}
      onClose={() => setInvitePlayerDialogOpen(false)}
    >
      <PopoverTrigger>
        <Button {...buttonProps} onClick={() => setInvitePlayerDialogOpen(true)}>
          invite another player
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody>
          <InvitePlayerForm storyUuid={storyUuid} dismiss={() => setInvitePlayerDialogOpen(false)} />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

const Canvas = () => {
  const auth0 = useAuth0();

  const useStory = (story_uuid: string) =>
    useQuery<Story, Error>(
      story_uuid,
      async () => {
        if (auth0.isAuthenticated) {
          const token = await auth0.getAccessTokenSilently({
            audience: auth0config.audience,
          });
          const { data } = await axios({
            url: `${config.baseUrl}/story/${story_uuid}/multiPlayer`,
            method: "get",
            headers: { Authorization: `Bearer ${token}` },
          });
          return data;
        } else {
          const { data } = await axios.get(
            `${config.baseUrl}/story/${story_uuid}/singlePlayer`
          );
          return data;
        }
      },
      { refetchInterval: 1000 }
    );

  const addToStory = useMutation(
    async ({
      story_uuid,
      segment,
    }: {
      story_uuid: string;
      segment: string;
    }) => {
      if (auth0.isAuthenticated) {
        const token = await auth0.getAccessTokenSilently({
          audience: auth0config.audience,
        });
        await axios({
          url: `${config.baseUrl}/story/${story_uuid}/multiPlayer`,
          method: "post",
          headers: { Authorization: `Bearer ${token}` },
          data: { content: segment },
        });
      } else {
        await axios({
          url: `${config.baseUrl}/story/${story_uuid}/singlePlayer`,
          method: "post",
          data: { content: segment },
        });
      }
    }
  );

  const [content, setContent] = useState<string>("");

  const location = useLocation();
  const storyUuid = location.pathname.slice("/g/".length);

  const { isLoading, isError, data, error } = useStory(storyUuid);

  if (isLoading || auth0.isLoading) {
    return <CenterSpinner />;
  }
  if (isError) {
    return <div>Error: {error}</div>;
  }

  const isCurrentUserTurn =
    data!.whose_turn_is_it.single_player ||
    data!.whose_turn_is_it.name === auth0.user?.email;

  // reshape segments such that segments with multiple lines are rendered
  // as <br/>'s
  const elems: (Sentence | null)[] = [];
  data!.segments.forEach((segment) => {
    const [firstLine, ...remainingLines] = segment.content.split("\n");
    elems.push({ content: firstLine, author: segment.author } as Sentence);
    remainingLines.forEach((remainingLine) => {
      elems.push(null); // flag to render <br/> - can this be merged?
      elems.push({
        content: remainingLine,
        author: segment.author,
      } as Sentence);
    });
  });

  return (
    <Box>
      <Box bg="gray.50" borderRadius="5" shadow="inner" width="100%">
        <Box textAlign="center" fontSize="xl" p={10}>
          {elems.map((elem, idx) =>
            elem ? (
              <Text key={idx} as="span">
                {elem.content}{" "}
              </Text>
            ) : (
              <br key={idx} />
            )
          )}
          {isCurrentUserTurn ? (
            <WriteField content={content} setContent={setContent} />
          ) : (
            <BeatLoader size={7} />
          )}
        </Box>
      </Box>
      <VStack p={10} spacing={3}>
        <Button
          onClick={() => {
            setContent("");
            addToStory.mutate({
              story_uuid: storyUuid,
              segment: content,
            });
          }}
          disabled={!isCurrentUserTurn}
          w="250px"
          rightIcon={<VscDebugContinue />}
        >
          end turn
        </Button>
        {auth0.isAuthenticated && <InvitePlayerPopover
          w="250px"
          variant="outline"
          rightIcon={<FaUserPlus />}
          storyUuid={storyUuid}
        />}
        {/*
          <Button w="250px" variant="outline" rightIcon={<SettingsIcon />}>
            change ai settings
            </Button>
        */}
        <Button w="250px" variant="outline" rightIcon={<QuestionIcon />}>
          how do i play this game
        </Button>
      </VStack>
    </Box>
  );
};

export default Canvas;

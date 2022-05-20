import { useState } from "react";
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
  Button,
  ButtonProps,
  useToast,
} from "@chakra-ui/react";
import { Formik, Form, Field, FieldInputProps, FormikProps } from "formik";
import { useSendInvitationCallback } from "../lib/invitation";

interface InvitePlayerPopoverProps extends ButtonProps {
  storyUuid: string;
}

export const InviteButton: React.FC<InvitePlayerPopoverProps> = ({
  storyUuid,
  children,
  ...buttonProps
}) => {
  const [invitePlayerDialogOpen, setInvitePlayerDialogOpen] = useState(false);
  return (
    <Popover
      isOpen={invitePlayerDialogOpen}
      onClose={() => setInvitePlayerDialogOpen(false)}
    >
      <PopoverTrigger>
        <Button
          {...buttonProps}
          onClick={() => setInvitePlayerDialogOpen(true)}
        >
          {children}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody>
          <InvitePlayerForm
            storyUuid={storyUuid}
            dismiss={() => setInvitePlayerDialogOpen(false)}
          />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

const InvitePlayerForm: React.FC<{
  storyUuid: string;
  dismiss: () => void;
}> = ({ storyUuid, dismiss }) => {
  const toast = useToast();
  const sendInvitation = useSendInvitationCallback();

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
        try {
          sendInvitation(storyUuid, values.email);
        } catch (err) {
          toast({
            title: "failed to send invitation",
            description: `error: ${JSON.stringify(err)}`,
            status: "error",
            duration: 9000,
            isClosable: true,
          });
          actions.setSubmitting(false);
          return;
        }
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
                <FormLabel htmlFor="email">Email of other player</FormLabel>
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
            Send
          </Button>
        </Form>
      )}
    </Formik>
  );
};

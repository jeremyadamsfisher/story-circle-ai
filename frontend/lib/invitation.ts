import { useCallback } from "react";
import { useApiClient, schemas } from "./access";
import { useAuth0 } from "@auth0/auth0-react";

type InvitationNew = schemas["InvitationNew"];
type InvitationRead = schemas["InvitationRead"];

export const useSendInvitationCallback = () => {
  const apiClient = useApiClient();
  return useCallback(async (storyUuid: string, inviteeEmail: string) => {
    const payload: InvitationNew = {
      story_uuid: storyUuid,
      invitee_email: inviteeEmail,
    };
    const invitation: InvitationRead = await apiClient
      .post("invitations/send", { json: payload })
      .json();
    return invitation;
  }, []);
};

export const useRespondToInvitationCallback = () => {
  const apiClient = useApiClient();
  const { isAuthenticated } = useAuth0();
  return useCallback(
    async (invitationId: string): Promise<InvitationRead> => {
      return apiClient.get(`invitations/respond/${invitationId}`).json();
    },
    [isAuthenticated]
  );
};

export type { InvitationRead };

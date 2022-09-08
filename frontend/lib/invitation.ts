import { useCallback } from "react";
import { useApiClient, schemas } from "./access";

type InvitationNew = schemas["InvitationNew"];
type InvitationRead = schemas["InvitationRead"];

export const useSendInvitationCallback = () => {
  const apiClient = useApiClient();
  return useCallback(
    async (storyUuid: string, inviteeEmail: string) => {
      const payload: InvitationNew = {
        story_uuid: storyUuid,
        invitee_email: inviteeEmail,
      };
      const invitation: InvitationRead = await apiClient
        .post("invitations/send", { json: payload })
        .json();
      return invitation;
    },
    [apiClient]
  );
};

export const useRespondToInvitationCallback = () => {
  const apiClient = useApiClient();
  return useCallback(
    (invitationId: string): Promise<InvitationRead> =>
      apiClient.post(`invitations/respond/${invitationId}`).json(),
    [apiClient]
  );
};

export type { InvitationRead };

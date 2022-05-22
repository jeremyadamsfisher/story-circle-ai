import { useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import useSWR from "swr";
import { useApiClient, schemas } from "./access";
import { useRouter } from "next/router";

type StoryRead = schemas["StoryRead"];
type StorySegmentNew = schemas["StorySegmentNew"];

export const useStoryUuid = () => {
  const { query } = useRouter();
  if (!query.id) {
    return;
  }
  const storyUuid = query.id as string;
  return storyUuid;
};

export const useStory = () => {
  const storyUuid = useStoryUuid();
  const { isAuthenticated } = useAuth0();
  const key = `story/${storyUuid}/${
    isAuthenticated ? "multiPlayer" : "singlePlayer"
  }`;
  const client = useApiClient();
  const { data: story, mutate, error } = useSWR(
    key,
    (k): Promise<StoryRead> => client.get(k).json(),
    { refreshInterval: 1000 }
  );
  const addToStoryCallback = useCallback(
    (content: string) => {
      const payload: StorySegmentNew = { content: content };
      const promise = client.post(key, { json: payload }).json();
      // TODO: add optimistic update
      mutate();
      return promise;
    },
    [key, isAuthenticated]
  );
  return { key, story, addToStoryCallback, error };
};

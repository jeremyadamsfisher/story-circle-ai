import { useCallback } from "react";
import useSWR from "swr";
import { useApiClient, schemas } from "./access";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/auth";

type StoryRead = schemas["StoryRead"];
type WhoseTurnIsIt = StoryRead["whose_turn_is_it"];
type StorySegmentNew = schemas["StorySegmentNew"];

export interface StoryReadOptionalTurn
  extends Omit<StoryRead, "whose_turn_is_it"> {
  whose_turn_is_it?: WhoseTurnIsIt;
}

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
  const [user] = useAuthState(auth);
  const key = storyUuid
    ? `story/${storyUuid}/${user ? "multiPlayer" : "singlePlayer"}`
    : null;
  const client = useApiClient();
  const {
    data: story,
    mutate,
    error,
  } = useSWR(key, (k): Promise<StoryReadOptionalTurn> => client.get(k).json(), {
    refreshInterval: 1000,
  });
  const addToStoryCallback = useCallback(
    (content: string) => {
      if (!key || !story) throw new Error("story not intialized");
      const payload: StorySegmentNew = { content: content };
      const promise = client.post(key, { json: payload }).json();
      mutate({
        ...story,
        whose_turn_is_it: undefined,
        segments: [
          ...story.segments,
          {
            content,
            author: {
              name: user?.email || "singlePlayer",
              single_player: user ? true : false,
              ai_player: false,
            },
          },
        ],
      });
      return promise;
    },
    [key, story, user, client]
  );
  return { key, story, addToStoryCallback, error };
};

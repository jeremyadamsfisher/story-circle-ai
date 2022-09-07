import { useCallback } from "react";
import useSWR from "swr";
import { useApiClient, schemas } from "./access";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/auth";
import { User } from "firebase/auth";

type StoryRead = schemas["StoryRead"];
type WhoseTurnIsIt = StoryRead["whose_turn_is_it"];
type StorySegmentNew = schemas["StorySegmentNew"];

export interface StoryReadOptionalTurn
  extends Omit<StoryRead, "whose_turn_is_it"> {
  whose_turn_is_it?: WhoseTurnIsIt;
}

export const isUserTurn = (
  user?: User | null,
  story?: StoryReadOptionalTurn
): boolean => {
  if (!story) return false; // loading
  if (!story.whose_turn_is_it) return false; // updating game state
  return user
    ? story.whose_turn_is_it.name === user.email
    : story.whose_turn_is_it.single_player;
};

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
    refreshInterval: (data) => {
      const sec = 1000;
      if (!data) {
        // while the story is being created, check every short interval
        return sec;
      } else if (data.whose_turn_is_it === undefined) {
        // while adding to the database, do not refresh until the
        // database updates are complete, which should be done automatically
        return 0; // 0 implies disabled
      } else if (data.whose_turn_is_it?.single_player) {
        // similarly, if it is the player turn, no need to refresh
        return 0;
      } else if (data.whose_turn_is_it.ai_player) {
        // the AI player should finish relatively quickly
        return sec;
      }
      // if it is another players turn, check less often
      return 10 * sec;
    },
  });
  const addToStoryCallback = useCallback(
    (content: string) => {
      if (!key || !story) throw new Error("story not intialized");
      const payload: StorySegmentNew = { content: content };
      const promise = client.post(key, { json: payload }).json();
      mutate({
        ...story,
        whose_turn_is_it: undefined, // See StoryEditor.TurnIndicator()
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
      return promise; // this does nothing...
    },
    [key, story, user, client]
  );
  return { key, story, addToStoryCallback, error };
};

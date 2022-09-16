import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { useApiClient, schemas } from "./access";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/auth";

type StoryRead = schemas["StoryRead"];
type WhoseTurnIsIt = StoryRead["whose_turn_is_it"];
type StorySegmentNew = schemas["StorySegmentNew"];

// intermediary type for an optimistic update, during it has
// not been computed yet whose turn it is
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
  } = useSWR(
    key,
    async (k): Promise<StoryReadOptionalTurn> => {
      return await client.get(k).json();
    },
    {
      refreshInterval: (data) => {
        const one_sec = 1000;
        if (!data) {
          // while the story is being created, check every short interval
          return one_sec;
        } else if (data.whose_turn_is_it === undefined) {
          // while adding to the database (i.e., between turns) do not refresh until
          // the database updates are complete, which should cause the cache to
          // revalidate automatically
          return 0; // 0 implies disabled
        } else if (data.whose_turn_is_it?.single_player) {
          // if it is the player turn, no need to refresh
          return 0;
        } else if (data.whose_turn_is_it.ai_player) {
          // the AI player should finish relatively quickly, so refresh quickly
          return one_sec;
        }
        // if it is another players turn, check infrequently
        return 10 * one_sec;
      },
    }
  );
  const addToStoryCallback = useCallback(
    async (content: string) => {
      if (!key || !story) throw new Error("story not intialized");
      const payload: StorySegmentNew = { content: content };
      mutate(client.post(key, { json: payload }).json(), {
        optimisticData: {
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
        },
      });
    },
    [key, story, user, client]
  );
  return { key, story, addToStoryCallback, error };
};

export const useNotifyStoryChanges = () => {
  const [user] = useAuthState(auth);
  const [prevStory, setPrevStory] = useState<
    StoryReadOptionalTurn | undefined
  >();
  const { story } = useStory();
  useEffect(() => {
    // browser notifications not supported
    if (!("Notification" in window)) return;

    // loading game
    if (!story) return;

    // in single player mode, turn changes are quick and don't need notifications
    if (!user) return;

    if (prevStory != story) {
      // if there is no previous story, the web app has just started moments
      // ago and there is no need to notify the user yet
      if (prevStory) {
        // if the story state has evolved to the AI turn, this is not worth notifying
        // the user
        if (story?.whose_turn_is_it?.ai_player) return;

        if (story?.whose_turn_is_it?.name === user.email) {
          new Notification("Story Circle", {
            body: `Its your turn to contribute to the story circle!`,
          });
        } else {
          const prevTurnTaker = story.segments.at(-1)!.author.name;
          // don't notify user if they or AI just took a turn
          if (prevTurnTaker === user.email || prevTurnTaker === "ai-player")
            return;
          new Notification("Story Circle", {
            body: `${prevTurnTaker} just added to the story circle!`,
          });
        }
      }
      setPrevStory(story);
    }
  }, [story]);
};

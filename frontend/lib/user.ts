import { User } from "firebase/auth";
import { StoryReadOptionalTurn } from "./story";

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

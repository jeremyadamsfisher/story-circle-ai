import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Spinner } from "@chakra-ui/react";

interface Author {
  name: string;
}

interface NewStoryModel {
  story_uuid: string;
  original_author: Author;
  single_player_mode: boolean;
}

const NewStory = () => {
  const [newStory, setNewStory] = useState<NewStoryModel | undefined>();
  const fetchNewStory = async () => {
    const response = await fetch("http://localhost:8000/story", {
      method: "PUT",
    });
    const newStory = await response.json();
    setNewStory(newStory);
  };
  useEffect(() => {
    fetchNewStory();
  }, []);
  if (newStory) {
    return (
      <Navigate
        to={`/${newStory!.story_uuid}?user=${newStory!.original_author.name}`}
      />
    );
  }
  return <Spinner />;
};

export default NewStory;

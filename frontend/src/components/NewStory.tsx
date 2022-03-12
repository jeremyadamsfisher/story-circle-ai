import axios from "axios";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Spinner } from "@chakra-ui/react";

interface NewStoryModel {
  story_uuid: string;
}

const NewStory = () => {
  const [newStory, setNewStory] = useState<NewStoryModel | undefined>();
  const fetchNewStory = async () => {
    const { data }: { data: NewStoryModel } = await axios.put(
      "http://localhost:8000/story"
    );
    setNewStory(data);
  };
  useEffect(() => {
    fetchNewStory();
  }, []);
  return newStory ? <Navigate to={`/g/${newStory.story_uuid}`} /> : <Spinner />;
};

export default NewStory;

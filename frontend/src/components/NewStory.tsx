import axios from "axios";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import CenterSpinner from "./CenterSpinner";
import auth0config from "../auth0config.json";
import config from "../config";

interface NewStoryModel {
  story_uuid: string;
}

const NewStory = () => {
  const [newStory, setNewStory] = useState<NewStoryModel | undefined>();
  const { isLoading, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const fetchNewStory = async () => {
    if (isLoading) {
      // not authenticated while loading
      return;
    }
    if (isAuthenticated) {
      const token = await getAccessTokenSilently({
        audience: auth0config.audience,
      });
      const { data }: { data: NewStoryModel } = await axios({
        method: "put",
        url: `${config.baseUrl}/story/multiPlayer`,
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewStory(data);
    } else {
      const { data }: { data: NewStoryModel } = await axios.put(
        `${config.baseUrl}/story/singlePlayer`
      );
      setNewStory(data);
    }
  };
  useEffect(() => {
    fetchNewStory();
  }, [isLoading]);
  return newStory ? (
    <Navigate to={`/g/${newStory.story_uuid}`} />
  ) : (
    <CenterSpinner />
  );
};

export default NewStory;

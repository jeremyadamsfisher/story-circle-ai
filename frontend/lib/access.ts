import ky from "ky-universal";
import { components } from "./api";
import { useAuth0 } from "@auth0/auth0-react";
import auth0config from "../auth0config.json";

export const frontendUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://api.faboo.com";

export const useApiClient = () => {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  let apiClient = ky.create({
    prefixUrl: frontendUrl,
  });
  if (isAuthenticated) {
    const token = getAccessTokenSilently({
      audience: auth0config.audience,
    });
    apiClient = apiClient.extend({
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  return apiClient;
};

type schemas = components["schemas"];

export type { schemas };

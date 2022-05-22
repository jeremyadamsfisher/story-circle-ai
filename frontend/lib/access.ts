import ky from "ky-universal";
import { components } from "./api";
import { useAuth0 } from "@auth0/auth0-react";
import getConfig from "next/config";

const frontendUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://faboo.com";

const backendUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://api.faboo.com";

export const useApiClient = () => {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const { publicRuntimeConfig } = getConfig();

  let apiClient = ky.create({
    prefixUrl: backendUrl,
  });
  if (isAuthenticated) {
    apiClient = apiClient.extend({
      hooks: {
        beforeRequest: [
          async (request) => {
            const token = await getAccessTokenSilently({
              audience: publicRuntimeConfig.AUDIENCE,
            });
            request.headers.set("Authorization", `Bearer ${token}`);
          },
        ],
      },
    });
  }
  return apiClient;
};

type schemas = components["schemas"];

export type { schemas };

export { frontendUrl, backendUrl };

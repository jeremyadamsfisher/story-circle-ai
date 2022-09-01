import ky from "ky-universal";
import { components } from "./api";
import getConfig from "next/config";
import { auth } from "./auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { getIdToken } from "firebase/auth";

export const useApiClient = () => {
  const [user] = useAuthState(auth);
  const { publicRuntimeConfig } = getConfig();
  let apiClient = ky.create({
    prefixUrl: publicRuntimeConfig.BACKEND_URL,
  });
  if (user) {
    apiClient = apiClient.extend({
      hooks: {
        beforeRequest: [
          async (request) => {
            const token = await getIdToken(user);
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

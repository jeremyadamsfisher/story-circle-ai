import ky from "ky-universal";
import { components } from "./api";
import { auth } from "./auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { getIdToken } from "firebase/auth";
import { useMemo } from "react";

export const useApiClient = () => {
  const [user] = useAuthState(auth);
  return useMemo(() => {
    let apiClient = ky.create({
      prefixUrl: "/api",
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
  }, [user]);
};

type schemas = components["schemas"];

export type { schemas };

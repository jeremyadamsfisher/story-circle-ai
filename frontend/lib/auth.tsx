import { AppState, Auth0Provider } from "@auth0/auth0-react";
import { useRouter } from "next/router";
import getConfig from "next/config";

export const Auth0ProviderWithRedirects: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { publicRuntimeConfig } = getConfig();
  const router = useRouter();

  ["DOMAIN", "CLIENT_ID", "AUDIENCE", "FRONTEND_URL", "BACKEND_URL"].forEach((var_) => {
    if (!publicRuntimeConfig[var_]) {
      throw new Error(`missing auth0 config: ${var_}`);
    }
  });

  return (
    <Auth0Provider
      domain={publicRuntimeConfig.DOMAIN}
      clientId={publicRuntimeConfig.CLIENT_ID}
      redirectUri={publicRuntimeConfig.FRONTEND_URL + "/auth0redirect"}
      audience={publicRuntimeConfig.AUDIENCE}
      onRedirectCallback={(appState?: AppState) => {
        if (appState) {
          router.push({
            pathname: appState.returnTo,
            query: { id: appState.id },
          });
        } else {
          throw new Error("No app state to restore");
        }
      }}
    >
      {children}
    </Auth0Provider>
  );
};

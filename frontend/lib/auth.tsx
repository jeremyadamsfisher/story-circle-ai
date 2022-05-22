import { AppState, Auth0Provider } from "@auth0/auth0-react";
import { useRouter } from "next/router";
import auth0config from "../auth0config.json";
import { frontendUrl } from "../lib/access";

export const Auth0ProviderWithRedirects: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const router = useRouter();

  if (!auth0config.domain || !auth0config.clientId || !auth0config.audience) {
    throw Error("missing auth0 config");
  }

  return (
    <Auth0Provider
      domain={auth0config.domain}
      clientId={auth0config.clientId}
      redirectUri={frontendUrl + "/auth0redirect"}
      audience={auth0config.audience}
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

import { AppState, Auth0Provider } from "@auth0/auth0-react";
import { useRouter } from "next/router";
import { frontendUrl } from "../lib/access";

export const Auth0ProviderWithRedirects: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const router = useRouter();

  if (
    !process.env.REACT_APP_DOMAIN ||
    !process.env.REACT_APP_CLIENT_ID ||
    !process.env.REACT_APP_AUDIENCE
  ) {
    throw Error("missing auth0 config");
  }

  return (
    <Auth0Provider
      domain={process.env.REACT_APP_DOMAIN}
      clientId={process.env.REACT_APP_CLIENT_ID}
      redirectUri={frontendUrl + "/auth0redirect"}
      audience={process.env.REACT_APP_AUDIENCE}
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

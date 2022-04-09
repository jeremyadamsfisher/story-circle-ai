import { AppState, Auth0Provider } from "@auth0/auth0-react";
import { PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";
import auth0config from "./auth0config.json";

export const Auth0ProviderWithHistory = ({
  children,
}: PropsWithChildren<any>): JSX.Element | null => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState: AppState) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  if (!(auth0config.domain && auth0config.clientId && auth0config.audience)) {
    throw Error("missing auth0 config");
  }

  return (
    <Auth0Provider
      domain={auth0config.domain}
      clientId={auth0config.clientId}
      redirectUri={window.location.origin}
      audience={auth0config.audience}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};

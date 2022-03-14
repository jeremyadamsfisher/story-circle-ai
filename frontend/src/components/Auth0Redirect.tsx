import { Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const Auth0Redirect = () => {
  const location = useLocation();
  console.log(location);
  return <span>Got redirected!</span>;
};

export default Auth0Redirect;

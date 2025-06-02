// src/routes/authRoutes.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthRoute } from "./routePaths";
import { useAuth } from "../context/auth-context";

const AuthRoute = () => {
  const location = useLocation();
  const { user } = useAuth();
  const _isAuthRoute = isAuthRoute(location.pathname);

  console.log("AuthRoute", { user, pathname: location.pathname }); 

  if (!_isAuthRoute || !user) return <Outlet />;

  const workspaceId = user?.currentWorkspace || "default";
  return <Navigate to={`/workspace/${workspaceId}`} replace />;
};

export default AuthRoute;
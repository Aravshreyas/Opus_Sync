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

  const workspaceId = typeof user?.currentWorkspace === 'object' ? user?.currentWorkspace?._id : user?.currentWorkspace;
  return <Navigate to={`/workspace/${workspaceId || "default"}`} replace />;
};

export default AuthRoute;
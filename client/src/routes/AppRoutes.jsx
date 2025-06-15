import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./protectedRoutes";
import AuthRoute from "./authRoutes";
import {
  authenticationRoutePaths,
  baseRoutePaths,
  protectedRoutePaths,
  fullscreenRoutePaths,
} from "./routePaths";
import AppLayout from "../layouts/AppLayout";
import BaseLayout from "../layouts/BaseLayout";
import MeetLayout from "../layouts/MeetLayout"; 

function AppRoutes() {
  console.log("AppRoutes rendering", {
    baseRoutePaths,
    authenticationRoutePaths,
    protectedRoutePaths,
  });
  return (
    <Routes>
      {/* Base Routes (e.g., invite) */}
      <Route element={<BaseLayout />}>
        {baseRoutePaths.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={route.element} // Wrap to ensure rendering
          />
        ))}
      </Route>

      {/* Authentication Routes */}
      <Route element={<AuthRoute />}>
        {authenticationRoutePaths.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<BaseLayout>{route.element}</BaseLayout>}
          />
        ))}
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {protectedRoutePaths.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            />
          ))}
        </Route>
        <Route element={<MeetLayout />}>
          {fullscreenRoutePaths.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            />
          ))}
        </Route>

      </Route>

      {/* Catch-all route for debugging */}
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
}

export default AppRoutes;
import React from "react";
import { Outlet } from "react-router-dom"; // Import Outlet

const BaseLayout = ({ children }) => {
  // If children are passed (e.g., from authenticationRoutePaths), render them.
  // Otherwise, render the Outlet for nested routes (e.g., baseRoutePaths).
  return (
    <div className="min-h-screen">
      {children ? children : <Outlet />} {/* Render children OR Outlet */}
    </div>
  );
};

export default BaseLayout;
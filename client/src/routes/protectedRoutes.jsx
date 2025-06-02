import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useEffect, useState } from "react";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsChecked(true);
    }
  }, [loading]);

  console.log("ProtectedRoute state:", { user, loading }, "IsChecked:", isChecked);

  if (!isChecked) return <div>Loading...</div>;
  if (!user) {
    console.log("ProtectedRoute: No user, redirecting to /", "User:", user);
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
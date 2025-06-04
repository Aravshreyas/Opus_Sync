// AuthContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from "react"; // Added useRef
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { isPublicPath, AUTH_ROUTES } from "../routes/routePaths"; // Verify this path

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // For initial auth check
  const navigate = useNavigate();
  const location = useLocation();
  const ongoingCheck = useRef(false); // To prevent re-entrant checks within the same effect run

  useEffect(() => {
    const checkAuth = async () => {
      if (ongoingCheck.current) {
        // console.log("AuthContext: Auth check already in progress, skipping for path:", location.pathname);
        return;
      }
      ongoingCheck.current = true;
      
      // Only set global loading for the very first check or if user state is truly unknown
      // For subsequent path changes, we might not want to flash a global loader
      // However, the current logic implies re-validating session on each path change
      setLoading(true); 

      const baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000/api";
      const url = `${baseUrl}/user/current`; 
      console.log("AuthContext: Starting auth check for path:", location.pathname, "Current user state:", user ? user._id : null);

      try {
        const userResponse = await axios.get(url, {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        });
        
        const authUser = userResponse.data.user?.user || userResponse.data.user; 
        if (!authUser || !authUser._id) {
          throw new Error("Invalid user data from /user/current");
        }

        let workspaces = [];
        try {
            const workspacesResponse = await axios.get(
              `${baseUrl}/workspace/all`, 
              // { withCredentials: true }
            );
            workspaces = workspacesResponse.data.workspaces || [];
        } catch (wsError) {
            console.warn("AuthContext: Could not fetch workspaces during auth check", wsError.message);
        }
        
        const userWithWorkspaces = { ...authUser, workspaces };
        setUser(userWithWorkspaces);
        console.log("AuthContext: User authenticated successfully for path:", location.pathname, userWithWorkspaces._id);

      } catch (err) {
        console.warn(`AuthContext: Auth check failed for path: ${location.pathname}. Status: ${err.response?.status}, Message: ${err.message}`);
        setUser(null); // Clear user on any auth error

        if (err.response?.status === 401) {
          if (!isPublicPath(location.pathname)) {
            console.log(`AuthContext: Path ${location.pathname} is PROTECTED. User not authenticated (401). Redirecting to SIGN_IN (${AUTH_ROUTES.SIGN_IN}).`);
            // Prevent navigation if already on the target sign-in page to break potential micro-loops
            if (location.pathname !== AUTH_ROUTES.SIGN_IN) {
              navigate(AUTH_ROUTES.SIGN_IN, { replace: true, state: { from: location } }); 
            } else {
              console.log("AuthContext: Already on SIGN_IN page, not redirecting again.");
            }
          } else {
            console.log(`AuthContext: Path ${location.pathname} is PUBLIC. User not authenticated (401). No redirect needed by AuthContext.`);
          }
        } else {
          // Handle other errors if necessary, but typically don't navigate unless it's an auth failure on protected route
           console.error("AuthContext: Non-401 error during auth check:", err.message);
        }
      } finally {
        setLoading(false);
        ongoingCheck.current = false;
        console.log(`AuthContext: Auth check finished for path: ${location.pathname}. Loading: false.`);
      }
    };

    console.log("AuthContext: useEffect for location.pathname triggered:", location.pathname);
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // `Maps` removed, see below.

  // `Maps` from `useNavigate` is stable and doesn't need to be in deps if not used for memoization logic that depends on its identity.
  // The main trigger for re-running auth check is the path change.

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
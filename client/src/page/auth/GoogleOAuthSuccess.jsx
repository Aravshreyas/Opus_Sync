// src/pages/GoogleOAuthSuccess.jsx (or wherever your component is)
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/auth-context"; // Adjust path as necessary
import { AudioLines, Loader } from "lucide-react";
import Button from "../../components/ui/Button";

function GoogleOAuthSuccess() {
  const navigate = useNavigate();
  const { setUser } = useAuth(); // Get setUser from your auth context

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(
    "Authentication successful. Finalizing your session..."
  );

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const workspaceId = params.get('workspaceId');

    if (window.history.replaceState) {
      const cleanUrl = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', cleanUrl);
    }

    if (token && workspaceId) {
      sessionStorage.setItem('accessToken', token); // Store token as per your pattern

      // Fetch user details using the token and your specified endpoint
      const userFetchUrl = `${import.meta.env.VITE_BACKEND_URL}/user/current`;

      axios.get(userFetchUrl, {
        headers: {
          'Authorization': `Bearer ${token}`, // Use the token from the URL fragment
          'Content-Type': 'application/json' // As in your AuthContext
        }
    
      })
      .then(response => {
        // Use your existing logic to extract the user from the response
        const userData = response.data.user?.user || response.data.user;

        if (!userData || !userData._id) { // Assuming _id is a primary identifier
          throw new Error("Invalid or incomplete user data received from backend.");
        }
        setUser(userData); // Update your auth context
        setStatusMessage("Session initialized! Redirecting to your workspace...");
        setIsLoading(false);
        setTimeout(() => navigate(`/workspace/${workspaceId}`), 1500);
      })
      .catch(err => {
        const errorMessage = err.response?.data?.message || err.message || "Failed to fetch user details after Google login.";
        console.error("Error fetching user data:", err.response || err);
        setError(errorMessage);
        setStatusMessage("Login failed while fetching user details.");
        setIsLoading(false);
      });
    } else {
      const missingParamsError = "Authentication callback is missing required parameters.";
      console.error(missingParamsError);
      setError(missingParamsError);
      setStatusMessage("Login failed: Essential information missing.");
      setIsLoading(false);
    }
  }, [navigate, setUser]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link to={isLoading ? "#" : "/"} className={`flex items-center gap-2 self-center font-medium ${isLoading ? 'pointer-events-none' : ''}`}>
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <AudioLines className="size-4" />
          </div>
          Opus Sync.
        </Link>
        <div className="rounded-xl bg-white text-card-foreground shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_-4px_6px_-1px_rgba(0,0,0,0.1),4px_0_6px_-1px_rgba(0,0,0,0.1),-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="p-6 text-center">
            {isLoading && (
              <div className="mb-4 flex justify-center">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <h1 className="font-semibold leading-none tracking-tight text-xl mb-2">
              {error ? "Authentication Failed" : "Processing Login"}
            </h1>
            <p className={`text-sm mb-6 ${error ? 'text-destructive' : 'text-gray-500'}`}>
              {error || statusMessage}
            </p>
            {!isLoading && error && (
              <Button
                onClick={() => navigate("/")} // Navigate to SignIn page
                className="w-full bg-black text-white hover:bg-black/90"
              >
                Return to Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoogleOAuthSuccess;
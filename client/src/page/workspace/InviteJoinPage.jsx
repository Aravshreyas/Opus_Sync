import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { AudioLines } from "lucide-react";
import { useAuth } from "../../context/auth-context"; // Import useAuth

const InviteJoinPage = () => {
  const navigate = useNavigate();
  const { inviteCode } = useParams();
  const { user, setUser } = useAuth(); // Get user and setUser from auth context
  const isLoggedIn = !!user; // Check if user is logged in

//   useEffect(() => {
//     if (!inviteCode) {
//       console.error("No invite code provided");
//       alert("Invalid invite link. Please check the URL.");
//       navigate("/");
//     }
//   }, [inviteCode, navigate]);

  const handleJoin = async () => {
    if (!isLoggedIn) {
      alert("Please log in or sign up to join the workspace.");
      navigate(`/?returnUrl=/invite/workspace/${inviteCode}/join`);
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/member/workspace/${inviteCode}/join`,
        {},
        // { withCredentials: true }
      );
      console.log("Join response:", response.data);
      console.log(response.data)
      // Handle API response
      if (response.data) {
        const workspaceId = response.data.workspaceId ; // Adjust based on API
        setUser({ ...user, currentWorkspace: workspaceId }); // Update user context if needed
        navigate(`/workspace/${workspaceId}`);
      } else if (response.data.message === "User already in workspace") {
        // Handle case where user is already a member
        alert("You are already a member of this workspace.");
        navigate(`/workspace/${inviteCode}`); // Redirect to existing workspace
      } else {
        throw new Error(response.data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error joining workspace:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to join workspace.";
      alert(errorMessage);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-gray-100 p-6 md:p-10">
      <a
        className="flex items-center gap-2 self-center font-medium"
        href="/"
        data-discover="true"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md  bg-black text-white">
          <AudioLines className="size-4" />
        </div>
        Opus Sync
      </a>
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_-4px_6px_-1px_rgba(0,0,0,0.1),4px_0_6px_-1px_rgba(0,0,0,0.1),-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex flex-col space-y-1.5 p-6 text-center">
            <div className="font-semibold tracking-tight text-xl">
              {isLoggedIn
                ? "Hey there! You're invited to join an Opus Sync Workspace!"
                : "Hey there! You're invited to join an Opus Sync Workspace!"}
            </div>
            <div className="text-sm text-gray-500">
              {isLoggedIn
                ? "Click the button below to join this workspace."
                : "Looks like you need to be logged into your Opus Sync account to join this Workspace."}
            </div>
          </div>
          <div className="p-6 pt-0">
            <div>
              <div className="flex flex-col md:flex-row items-center gap-2">
                {isLoggedIn ? (
                  <button
                    onClick={handleJoin}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-50 bg-black text-white shadow hover:bg-black h-9 px-4 py-2 w-full"
                  >
                    Join
                  </button>
                ) : (
                  <>
                    <a
                      className="flex-1 w-full text-base"
                      href={`/sign-up?returnUrl=/invite/workspace/${inviteCode}/join`}
                      data-discover="true"
                    >
                      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:pointer-events-none disabled:opacity-50 bg-black text-white shadow hover:bg-black h-9 px-4 py-2 w-full">
                        Signup
                      </button>
                    </a>
                    <a
                      className="flex-1 w-full text-base"
                      href={`/?returnUrl=/invite/workspace/${inviteCode}/join`}
                      data-discover="true"
                    >
                      <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 disabled:pointer-events-none disabled:opacity-50 bg-gray-200 text-gray-900 shadow-sm hover:bg-gray-300 h-9 px-4 py-2 w-full border">
                        Login
                      </button>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteJoinPage;
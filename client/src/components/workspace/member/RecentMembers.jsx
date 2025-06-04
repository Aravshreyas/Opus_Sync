import { useState, useEffect } from "react";
// Removed: import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import useWorkspaceId from "../../../hooks/useWorkspaceId";
import axios from "axios";
// Removed: import { getAvatarColor, getAvatarFallbackText } from "../../../lib/helper";
import UserAvatar from "../../common/UserAvatar"; // Adjusted path for UserAvatar
import { format } from "date-fns";
import { Loader } from "lucide-react";

const RecentMembers = () => {
  const workspaceId = useWorkspaceId();
  const [members, setMembers] = useState([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!workspaceId) {
      // setError("Workspace ID is not available."); // Optional: Set error or return
      return;
    }

    const fetchMembers = async () => {
      setIsPending(true);
      setError(null);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/workspace/members/${workspaceId}`,
          // { withCredentials: true } // Include cookies for authentication
        );
        console.log("API Response:", response.data);
        // Assuming the API returns an object with a 'members' array,
        // and each member object has a 'userId' object with user details.
        setMembers(response.data.members || []);
      } catch (err) {
        console.error("Error fetching members:", err.message, err.response?.data);
        setError("Failed to load members. Check the console or ensure you're logged in.");
      } finally {
        setIsPending(false);
      }
    };

    fetchMembers();
  }, [workspaceId]);

  return (
    <div className="flex flex-col pt-2">
      {isPending ? (
        <Loader className="w-8 h-8 animate-spin place-self-center" />
      ) : error ? (
        <div className="font-semibold text-sm text-red-500 text-center py-5">{error}</div>
      ) : members.length === 0 ? (
        <div className="font-semibold text-sm text-muted-foreground text-center py-5">
          No Members yet
        </div>
      ) : (
        <ul role="list" className="space-y-3">
          {members.map((member) => {
            // The UserAvatar component expects a user object.
            // member.userId should contain _id, name, profilePicture.
            const userDetails = member.userId || {};

            return (
              <li
                key={member._id || userDetails._id} 
                role="listitem"
                className="flex items-center gap-4 p-3 rounded-lg border border-gray-200  hover:bg-gray-50  transition-colors"
              >
                <div className="flex-shrink-0">
                  {/* Use the UserAvatar component */}
                  <UserAvatar user={userDetails} size={9} />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-black ">
                    {userDetails.name || "Unknown Member"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {member.role?.name || "No Role"}
                  </p>
                </div>
                <div className="ml-auto text-sm text-right text-gray-500 dark:text-gray-400"> {/* Added text-right */}
                  <p>Joined</p>
                  <p>{member.joinedAt ? format(new Date(member.joinedAt), "PPP") : "No date"}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RecentMembers;
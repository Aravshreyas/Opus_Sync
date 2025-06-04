import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// Removed: import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import UserAvatar from "../../../components/common/UserAvatar"; // Assuming this is the path to your UserAvatar component
import useWorkspaceId from "../../../hooks/useWorkspaceId";
import axios from "axios";
import { Loader } from "lucide-react";
import { format } from "date-fns";

const RecentProjects = ({ onProjectCreated }) => {
  const workspaceId = useWorkspaceId();
  const [projects, setProjects] = useState([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = async () => {
    if (!workspaceId) {
      setError("No workspace ID available.");
      setIsPending(false);
      return;
    }
    setIsPending(true);
    setError(null);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/project/workspace/${workspaceId}/all`,
        // { withCredentials: true }
      );
      console.log("API Response:", response.data);
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("Error fetching projects:", err.message, err.response?.data);
      setError("Failed to load projects. Check the console for details or ensure you're logged in.");
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [workspaceId]); // Added fetchProjects to dependency array for correctness if its definition changes

  useEffect(() => {
    if (onProjectCreated) { // Ensure onProjectCreated exists before calling fetchProjects
        fetchProjects();
    }
  }, [onProjectCreated]); // Added fetchProjects to dependency array

  // Removed inline getAvatarFallbackText and getAvatarColor functions

  return (
    <div className="flex flex-col pt-2">
      {isPending ? (
        <Loader className="w-8 h-8 animate-spin place-self-center" />
      ) : error ? (
        <div className="font-semibold text-sm text-red-500 text-center py-5">{error}</div>
      ) : projects.length === 0 ? (
        <div className="font-semibold text-sm text-muted-foreground text-center py-5">
          No projects created yet
        </div>
      ) : (
        <ul role="list" className="space-y-2">
          {projects.map((project) => {
            // The UserAvatar component expects a user object with _id, name, and profilePicture.
            // project.createdBy should ideally fit this structure.
            // If project.createdBy is null or undefined, UserAvatar handles it gracefully.
            const creator = project.createdBy || {};

            return (
              <li
                key={project._id}
                role="listitem"
                className="cursor-pointer py-2 hover:bg-gray-50  transition-colors ease-in-out" // Added dark mode hover
              >
                <Link
                  to={`/workspace/${workspaceId}/project/${project._id}`}
                  className="flex items-start gap-4 p-0"
                >
                  <div className="text-xl leading-[1.4rem] pt-1">{project.emoji || "📝"}</div> {/* Added pt-1 for better alignment with avatar*/}
                  <div className="flex-1 grid gap-1">
                    <p className="text-sm font-medium leading-none">{project.name || "Unnamed Project"}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.createdAt ? format(new Date(project.createdAt), "PPP") : "No date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2"> {/* Reduced gap slightly */}
                    <span className="text-sm text-gray-500 dark:text-gray-400">Created by</span>
                    {/* Use the UserAvatar component */}
                    <UserAvatar user={creator} size={9} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RecentProjects;
import { useState, useEffect } from "react";
// Removed: import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { TaskPriorityEnum, TaskStatusEnum } from "../../../constant"; // Assuming TaskPriorityEnum is used or will be. If not, it can be removed.
import useWorkspaceId from "../../../hooks/useWorkspaceId";
import axios from "axios";
// Removed: import { getAvatarColor, getAvatarFallbackText, transformStatusEnum } from "../../../lib/helper";
import { transformStatusEnum } from "../../../lib/helper"; // Keep transformStatusEnum
import UserAvatar from "../../../components/common/UserAvatar"; // Import UserAvatar
import { format } from "date-fns";
import { Loader } from "lucide-react";

const RecentTasks = () => {
  const workspaceId = useWorkspaceId();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!workspaceId) {
      // setError("Workspace ID is not available."); // Optional: set error if needed
      return;
    }

    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/task/workspace/${workspaceId}/all`,
          // { withCredentials: true } // Include cookies for authentication
        );
        console.log("API Response:", response.data);
        setTasks(response.data.tasks || []);
      } catch (err) {
        console.error("Error fetching tasks:", err.message, err.response?.data);
        setError("Failed to load tasks. Check the console or ensure you're logged in.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [workspaceId]);

  return (
    <div className="flex flex-col space-y-6">
      {isLoading ? (
        <Loader className="w-8 h-8 animate-spin place-self-center" />
      ) : error ? (
        <div className="font-semibold text-sm text-red-500 text-center py-5">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="font-semibold text-sm text-muted-foreground text-center py-5">
          No Task created yet
        </div>
      ) : (
        <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
          {tasks.map((task) => {
            // User object for UserAvatar, defaults to empty object if task.assignedTo is null/undefined
            const assignee = task.assignedTo || {};

            // Determine priority string - assuming transformStatusEnum can also handle priority if it's a similar enum
            // Or you might have a specific transformPriorityEnum helper
            const priorityText = task.priority ? transformStatusEnum(task.priority) : 'N/A';
            // Determine variant for priority badge
            const priorityVariant = task.priority ? TaskPriorityEnum[task.priority] : "default";


            return (
              <li
                key={task._id}
                className="p-4 flex items-center justify-between hover:bg-gray-50  transition-colors"
              >
                <div className="flex flex-col space-y-1 flex-grow mr-4"> {/* Added mr-4 for spacing */}
                  <span className="text-sm capitalize text-gray-600  font-medium">
                    {task.taskCode}
                  </span>
                  <p className="text-md font-semibold text-black  truncate" title={task.title}>
                    {task.title}
                  </p>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Due: {task.dueDate ? format(new Date(task.dueDate), "PPP") : "No date"}
                  </span>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0"> {/* Grouped badges and avatar */}
                  <div className="text-sm font-medium">
                    <Badge
                      variant={TaskStatusEnum[task.status] || "default"} 
                      className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0"
                    >
                      <span>{transformStatusEnum(task.status)}</span>
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <Badge
                      variant={priorityVariant}
                      className="flex w-auto p-1 px-2 gap-1 font-medium shadow-sm uppercase border-0"
                    >
                      <span>{priorityText}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center"> {/* Removed space-x-2, UserAvatar handles its own layout */}
                    <UserAvatar user={assignee} size={8} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RecentTasks;
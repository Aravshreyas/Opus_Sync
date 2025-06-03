import React, { useEffect, useState } from "react";
import axios from "axios";
import TaskTable from "../../components/workspace/task/TaskTable";
import { Plus } from "lucide-react";
import CreateTaskDialog from "../../components/workspace/task/CreateTaskDialog";
import { useParams } from "react-router-dom";

export default function Tasks() {
  const [workspace, setWorkspace] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { workspaceId } = useParams();

  const fetchTasks = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/task/workspace/${workspaceId}/all`
      );
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/workspace/${workspaceId}`
        );
        setWorkspace(response.data);
      } catch (error) {
        console.error("Error fetching workspace:", error);
      }
    };
    fetchWorkspace();
  }, [workspaceId]);

  useEffect(() => {
    fetchTasks();
  }, [workspaceId]);

  const handleTaskProcessed = () => {
    fetchTasks(); // Refresh the task list after create or update
  };

  if (loading) {
    return <div className="w-full h-full flex-col space-y-8 pt-3 text-center">Loading...</div>;
  }

  return (
    <div className="w-full h-full flex-col space-y-8 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Tasks</h2>
          <p className="text-gray-600">
            Here's the list of tasks for this {workspace?.name || "workspace"}!
          </p>
        </div>
        <div>
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-black text-white shadow hover:bg-black/90 h-9 px-4 py-2"
            type="button"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>
      <div>
        <TaskTable tasks={tasks} workspaceId={workspaceId} projectId={null} onTaskProcessed={handleTaskProcessed} isDialogOpen={isDialogOpen}/>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <CreateTaskDialog 
            onClose={() => setIsDialogOpen(false)} 
            workspaceId={workspaceId} 
            onTaskProcessed={handleTaskProcessed}
          />
        </div>
      )}
    </div>
  );
}
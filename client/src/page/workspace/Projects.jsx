import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ProjectAnalytics from "../../components/workspace/project/ProjectAnalytics";
import TaskTable from "../../components/workspace/task/TaskTable";
import CreateTaskDialog from "../../components/workspace/task/CreateTaskDialog";
import CreateProjectDialog from "../../components/workspace/project/CreateProjectDialog";
import {
  Plus, X, Loader2, AlertTriangle, Info, CalendarDays, FileText,
  UserCircle, Clock, Briefcase, Edit,FolderKanban,ChartLine,
} from "lucide-react";

const Projects = () => {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();

  const [projectData, setProjectData] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [projectEmoji, setProjectEmoji] = useState("P");

  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTaskTableKey, setRefreshTaskTableKey] = useState(0);

  // State for project progress calculation
  const [progress, setProgress] = useState(0);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);

  // Fetch project details
  const fetchProjectDetails = useCallback(async () => {
    if (!projectId || !workspaceId) {
      setError("Project or Workspace ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/project/${projectId}/workspace/${workspaceId}`,
        // { withCredentials: true }
      );
      console.log("Project details response:", response.data);
      if (response.data && response.data.project) {
        const fetchedProject = response.data.project;
        setProjectData(fetchedProject);
        setProjectName(fetchedProject.name);
        setProjectEmoji(fetchedProject.emoji || "P");
      } else {
        throw new Error("Project not found or data is invalid.");
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError(`Failed to load project details: ${err.response?.data?.message || err.message}.`);
    } finally {
      setLoading(false);
    }
  }, [projectId, workspaceId,isEditProjectOpen,isCreateTaskDialogOpen]);

  // Fetch tasks to calculate progress
  const fetchTasksForProgress = useCallback(async () => {
    if (!workspaceId || !projectId) {
      setTasksError("Workspace or Project ID is missing.");
      setTasksLoading(false);
      return;
    }
    setTasksLoading(true);
    setTasksError(null);
    try {
      // Use a more specific endpoint to fetch tasks for the project
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/task/project/${projectId}/all`,
        // { withCredentials: true }
      );
      const tasks = response.data.tasks || [];
      console.log("Tasks response for progress:", tasks);

      // Since we're fetching tasks for the specific project, no additional filtering is needed
      const projectTasks = tasks;

      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(
        (task) => task.status?.toUpperCase() === "DONE"
      ).length;

      // Calculate progress
      const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      setProgress(calculatedProgress);
    } catch (err) {
      console.error("Error fetching tasks for progress:", err);
      // Fallback to the original endpoint if the project-specific endpoint fails
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/task/workspace/${workspaceId}/all`,
          // { withCredentials: true }
        );
        const tasks = response.data.tasks || [];
        console.log("Fallback tasks response for progress:", tasks);

        const projectTasks = tasks.filter((task) => {
          if (!task.project) {
            console.warn("Task missing project field:", task);
            return false;
          }
          return task.project._id === projectId || task.project === projectId;
        });

        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter(
          (task) => task.status?.toUpperCase() === "DONE"
        ).length;

        const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        setProgress(calculatedProgress);
      } catch (fallbackErr) {
        console.error("Error fetching tasks (fallback):", fallbackErr);
        setTasksError(`Failed to load tasks: ${fallbackErr.response?.data?.message || fallbackErr.message}.`);
        setProgress(0);
      }
    } finally {
      setTasksLoading(false);
    }
  }, [workspaceId, projectId]);

  useEffect(() => {
    fetchProjectDetails();
    fetchTasksForProgress();
  }, [fetchProjectDetails, fetchTasksForProgress]);

  // Refresh tasks when a task is processed (created/updated)
  useEffect(() => {
    fetchTasksForProgress();
  }, [refreshTaskTableKey, fetchTasksForProgress]);

  const handleEditProjectClick = () => {
    setIsEditProjectOpen(true);
  };

  const handleProjectUpdated = (updatedProject) => {
    setProjectData(updatedProject.project || updatedProject);
    setProjectName(updatedProject.name);
    setProjectEmoji(updatedProject.emoji || "P");
    setIsEditProjectOpen(false);
  };

  const handleTaskProcessed = () => {
    console.log("Task processed, refreshing...");
    setRefreshTaskTableKey((prevKey) => prevKey + 1);
  };

  const formatDate = (dateString, options = { year: 'numeric', month: 'long', day: 'numeric' }) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-10">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="text-xl text-gray-700 mt-4">Loading Project Hub...</p>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-10 text-center">
        <AlertTriangle className="w-20 h-20 text-red-400 mb-6" />
        <h2 className="text-3xl font-semibold text-red-700 mb-3">Project Unavailable</h2>
        <p className="text-red-600 max-w-lg mb-8">{error || "The project data could not be retrieved."}</p>
        <button
          onClick={() => navigate(`/workspace/${workspaceId}`)}
          className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-base font-medium shadow-lg"
        >
          Return to Workspace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 space-y-8">
      {/* Project Header */}
      <header className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 text-4xl md:text-5xl bg-slate-200 p-3 rounded-xl shadow-md">
              {projectEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900" title={projectName}>
                  {projectName}
                </h1>
                <button
                  onClick={handleEditProjectClick}
                  title="Edit project"
                  className="p-1 text-gray-600 hover:text-indigo-600 rounded-md  group-hover:opacity-100 focus:opacity-100 transition-all duration-300"
                >
                  <Edit size={18} />
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsCreateTaskDialogOpen(true)}
            className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-black text-white rounded-lg px-6 py-3 text-sm font-semibold hover:bg-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <Plus className="w-5 h-5" /> Add New Task
          </button>
        </div>
      </header>

      {/* Project Hub: Overview & Analytics */}
      <section className="space-y-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-200 pb-3">
            <FolderKanban size={22} className="text-indigo-500" /> Project Overview
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Details */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <FileText size={16} className="mr-2 text-gray-400" />Description
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed max-h-28 overflow-y-auto p-1 custom-scrollbar">
                  {projectData.description || "No description provided for this project."}
                </p>
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-medium text-gray-500 flex items-center">
                    <CalendarDays size={14} className="mr-1.5" />Created Date
                  </span>
                  <span className="text-sm text-gray-700 font-semibold">
                    {formatDate(projectData.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-medium text-gray-500 flex items-center">
                    <Clock size={14} className="mr-1.5" />Last Updated
                  </span>
                  <span className="text-sm text-gray-700 font-semibold">
                    {formatDate(projectData.updatedAt, {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                {projectData.createdBy && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-500 flex items-center">
                      {projectData.createdBy.profilePicture ? (
                        <img
                          src={projectData.createdBy.profilePicture}
                          alt={projectData.createdBy.name}
                          className="w-4 h-4 rounded-full mr-1.5"
                        />
                      ) : (
                        <UserCircle size={14} className="mr-1.5" />
                      )}
                      Created By
                    </span>
                    <span className="text-sm text-gray-700 font-semibold">
                      {projectData.createdBy.name}
                    </span>
                  </div>
                )}
              </div>
              {/* Task Completion Percentage */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Task Completion %</h4>
                {tasksLoading ? (
                  <div className="text-sm text-gray-500">Calculating task completion...</div>
                ) : tasksError ? (
                  <div className="text-sm text-red-500">{tasksError}</div>
                ) : (
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    >
                      {progress > 15 ? `${progress}%` : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Analytics Cards */}
            <div className="lg:col-span-2">
              <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <ChartLine size={18} className="text-teal-500" /> Key Metrics
              </h3>
              <ProjectAnalytics projectId={projectId} refreshKey={refreshTaskTableKey} />
            </div>
          </div>
        </div>
      </section>

      {/* Tasks Section */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Briefcase size={26} className="text-orange-500" /> Project Tasks
          </h2>
        </div>
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <TaskTable
            workspaceId={workspaceId}
            projectId={projectId}
            key={refreshTaskTableKey}
            onTaskTitleClick={(task) => {
              console.log("View task details for:", task);
            }}
            onTaskUpdated={handleTaskProcessed}
            isLoadingInitially={loading && !projectData}
          />
        </div>
      </section>

      {/* Edit Project Dialog */}
      {isEditProjectOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <CreateProjectDialog
            workspaceId={workspaceId}
            project={projectData}
            onSubmit={handleProjectUpdated}
            onClose={() => setIsEditProjectOpen(false)}
          />
        </div>
      )}

      {isCreateTaskDialogOpen && (
        <CreateTaskDialog
          onClose={() => setIsCreateTaskDialogOpen(false)}
          workspaceId={workspaceId}
          task={null}
          defaultProjectId={projectId}
          onTaskProcessed={handleTaskProcessed}
        />
      )}
    </div>
  );
};

export default Projects;
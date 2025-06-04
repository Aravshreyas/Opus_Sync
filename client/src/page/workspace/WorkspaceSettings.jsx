import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import { X, Plus } from "lucide-react";

const WorkspaceSettings = () => {
  const { user, setUser, loading: authLoading } = useAuth();
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId || workspaceId === "default") {
        setLoading(false);
        setErrorMessage("Invalid workspace ID");
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/workspace/${workspaceId}`,
          // { withCredentials: true }
        );
        const data = response.data.workspace;
        setWorkspace(data);
        setName(data.name || "");
        setDescription(data.description || "");
        setErrorMessage("");
      } catch (error) {
        console.error("Error fetching workspace:", error.response?.status, error.response?.data);
        setErrorMessage(`Failed to load workspace: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  const handleEditClick = () => {
    setIsEditing(true);
    setErrorMessage("");
  };

  const handleUpdateWorkspace = async (e) => {
    e.preventDefault();
    if (!isEditing || isSubmitting || (name === workspace.name && description === workspace.description)) {
      setErrorMessage("Please edit the name or description before saving.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/workspace/update/${workspaceId}`,
        { name, description },
        // { withCredentials: true }
      );
      setWorkspace(response.data.workspace);
      setIsEditing(false);
      console.log("Workspace updated:", response.data);
      if (user.currentWorkspace?._id === workspaceId) {
        setUser({ ...user, currentWorkspace: response.data.workspace });
      }
    } catch (err) {
      console.error("Error updating workspace:", err.response?.status, err.response?.data);
      setErrorMessage(`Update failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    // Rely on user.workspaces from AuthContext
    const workspaces = user.workspaces ;
    if (!Array.isArray(workspaces)) {
      setErrorMessage("Failed to load workspaces. Please try again later.");
      setIsDialogOpen(false);
      return;
    }

    if (workspaces.length <= 1) {
      setErrorMessage("Cannot delete the last remaining workspace.");
      setIsDialogOpen(false);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/workspace/delete/${workspaceId}`,
        // { withCredentials: true }
      );
      console.log("Workspace deleted successfully");

      // Fetch updated workspaces
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/workspace/all`,
        // { withCredentials: true }
      );
      const updatedWorkspaces = response.data.workspaces || [];

      if (updatedWorkspaces.length > 0) {
        const firstWorkspace = updatedWorkspaces[0];

        // Update the currentWorkspace on the backend
        const updateResponse = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/user/current-workspace`,
          { workspaceId: firstWorkspace._id },
          // { withCredentials: true }
        );
        console.log("Updated current workspace:", updateResponse.data);

        // Update local user state
        setUser({
          ...user,
          workspaces: updatedWorkspaces,
          currentWorkspace: firstWorkspace,
        });

        // Navigate to the first remaining workspace
        setIsDialogOpen(false); // Close dialog before navigation
        navigate(`/workspace/${firstWorkspace._id}`, { replace: true });
      } else {
        setUser({
          ...user,
          workspaces: [],
          currentWorkspace: null,
        });

        // Navigate to dashboard if no workspaces remain
        setIsDialogOpen(false); // Close dialog before navigation
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Error deleting workspace:", err.response?.status, err.response?.data);
      setErrorMessage(`Deletion failed: ${err.response?.data?.message || err.message}`);
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setName(workspace.name || "");
    setDescription(workspace.description || "");
    setErrorMessage("");
  };

  if (authLoading || !user || loading) {
    return <div className="px-3 lg:px-20 py-3 text-center">Loading...</div>;
  }

  if (!workspace) {
    return <div className="px-3 lg:px-20 py-3 text-center">{errorMessage || "Workspace not found"}</div>;
  }

  return (
    <div className="px-3 lg:px-20 py-3">
      <div className="w-full h-auto py-2">
        {/* Workspace Header */}
        <div className="w-full max-w-3xl mx-auto pb-2">
          <div className="flex items-center gap-4">
            <span className="relative flex shrink-0 overflow-hidden size-[60px] rounded-lg font-bold">
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-tl from-black to-black text-[35px] text-white rounded-lg">
                {workspace.name?.charAt(0) || "W"}
              </span>
            </span>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-semibold text-xl">{workspace.name || "Workspace"}</span>
              <span className="truncate text-sm text-gray-600">{workspace.plan || "Free"}</span>
            </div>
          </div>
        </div>
        <div className="shrink-0 bg-gray-200 h-[1px] w-full my-4" />

        {/* Main Content */}
        <main>
          <div className="w-full max-w-3xl mx-auto py-3">
            <h2 className="text-[20px] leading-[30px] font-semibold mb-3">Workspace settings</h2>
            {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
            <div className="flex flex-col pt-0.5 px-0">
              {/* Edit Workspace Section */}
              <div className="pt-2">
                <div className="w-full h-auto max-w-full">
                  <div className="h-full">
                    <div className="mb-5 border-b border-gray-200">
                      <h1 className="text-[17px] tracking-[-0.16px] font-semibold mb-1.5 text-center sm:text-left">
                        Edit Workspace
                      </h1>
                    </div>
                    <form onSubmit={handleUpdateWorkspace}>
                      <div className="mb-4">
                        <div className="space-y-2">
                          <label className="font-medium text-sm" htmlFor="workspace-name">
                            Workspace name
                          </label>
                          <input
                            className="flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed md:text-sm h-[48px] disabled:opacity-90 disabled:pointer-events-none"
                            placeholder="Taco's Co."
                            name="name"
                            id="workspace-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!isEditing}
                            required
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="space-y-2">
                          <label className="font-medium text-sm" htmlFor="workspace-description">
                            Workspace description
                            <span className="text-xs font-extralight ml-2">Optional</span>
                          </label>
                          <textarea
                            className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:cursor-not-allowed md:text-sm disabled:opacity-90 disabled:pointer-events-none"
                            rows="6"
                            placeholder="Our team organizes marketing projects and tasks here."
                            name="description"
                            id="workspace-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        {isEditing && (
                          <button
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors bg-gray-300 text-black shadow hover:bg-gray-400 px-4 py-2 h-[40px]"
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </button>
                        )}
                        {isEditing ? (
                          <button
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors bg-black text-white shadow hover:bg-black/90 px-4 py-2 h-[40px] ml-auto"
                            type="submit"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                          </button>
                        ) : (
                          <button
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors bg-black text-white shadow hover:bg-black/90 px-4 py-2 h-[40px] ml-auto"
                            type="button"
                            onClick={handleEditClick}
                          >
                            Update Workspace
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* Delete Workspace Section */}
              <div className="pt-2">
                <div className="w-full">
                  <div className="mb-5 border-b border-gray-200">
                    <h1 className="text-[17px] tracking-[-0.16px] font-semibold mb-1.5 text-center sm:text-left">
                      Delete Workspace
                    </h1>
                  </div>
                  <div className="flex flex-col justify-between py-0">
                    <div className="flex-1 mb-2">
                      <p className="text-gray-600">
                        Deleting a workspace is a permanent action and cannot be undone. Once you delete a workspace, all
                        its associated data, including projects, tasks, and member roles, will be permanently removed.
                        Please proceed with caution and ensure this action is intentional.
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-red-600 text-white shadow-sm hover:bg-red-600/90 px-4 py-2 h-[40px]"
                        onClick={() => setIsDialogOpen(true)}
                        disabled={isSubmitting || !Array.isArray(user.workspaces)}
                      >
                        {isSubmitting ? "Deleting..." : "Delete Workspace"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dialog for Delete Confirmation */}
          {isDialogOpen && (
            <div
              className="z-50 fixed inset-0 backdrop-blur-sm bg-transparent bg-opacity-2 flex items-center justify-center"
            >
              <div className="relative grid w-full max-w-lg gap-4 bg-white p-6 shadow-lg animate-in fade-in-0 zoom-in-95 sm:rounded-lg md:w-full sm:max-w-md">
                <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                  <h2 id="dialog-title" className="text-lg font-semibold leading-none tracking-tight">
                    Delete {workspace.name || "My Workspace"} Workspace
                  </h2>
                  <p id="dialog-description" className="text-sm text-gray-500">
                    Are you sure you want to delete? This action cannot be undone.
                  </p>
                </div>
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 border border-gray-300 bg-white shadow-sm hover:bg-gray-100 h-9 px-4 py-2"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 bg-red-600 text-white shadow hover:bg-red-700 h-9 px-4 py-2"
                    onClick={handleDeleteWorkspace}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Deleting..." : "Delete"}
                  </button>
                </div>
                <button
                  type="button"
                  className="absolute right-4 top-4 rounded-sm opacity-70 bg-transparent transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:pointer-events-none"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
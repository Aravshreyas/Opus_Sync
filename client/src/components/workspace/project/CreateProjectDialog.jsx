import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate

import { customEmojis } from "./custom-emojis";

const DEFAULT_EMOJI = "📊";

const CreateProjectDialog = ({ workspaceId, onSubmit, onClose, project = null }) => {
  const navigate = useNavigate(); // Initialize navigate
  const isEditMode = Boolean(project);
  const [formData, setFormData] = useState({
    emoji: DEFAULT_EMOJI,
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dropdownContentRef = useRef(null);

  useEffect(() => {
    if (isEditMode && project) {
      setFormData({
        emoji: project.emoji || DEFAULT_EMOJI,
        name: project.name || "",
        description: project.description || "",
      });
    } else if (!isEditMode) {
      setFormData({
        emoji: DEFAULT_EMOJI,
        name: "",
        description: "",
      });
    }
  }, [project, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmojiSelect = (selectedEmoji) => {
    setFormData((prev) => ({ ...prev, emoji: selectedEmoji }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!workspaceId || typeof workspaceId !== "string") {
        throw new Error("Invalid workspaceId");
      }

      let response;
      if (isEditMode) {
        response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/project/${project._id}/workspace/${workspaceId}/update`,
          { ...formData },
          // { withCredentials: true }
        );
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/project/workspace/${workspaceId}/create`,
          formData,
          // { withCredentials: true }
        );
      }

      if (onSubmit) onSubmit({ type: isEditMode ? 'update' : 'create', data: response.data });
      onClose();
    } catch (err) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} project:`, err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        `Failed to ${isEditMode ? "update" : "create"} project`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!isEditMode || !project || !project._id) {
      setError("Project data is missing for deletion.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/project/${project._id}/workspace/${workspaceId}/delete`,
        // { withCredentials: true }
      );
      
      // Notify the parent component about the deletion (optional, if parent needs to update state)
      if (onSubmit) onSubmit({ type: 'delete', id: project._id, workspaceId: workspaceId }); 
      
      onClose(); // Close the dialog first
      navigate(`/workspace/${workspaceId}`); // Then navigate to workspace dashboard

    } catch (err) {
      console.error("Error deleting project:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Failed to delete project";
      setError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      className="z-50 relative grid w-full max-w-lg gap-4 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg md:w-full sm:max-w-lg border-0"
    >
      <div className="w-full h-auto max-w-full">
        <div className="h-full">
          <div className="mb-5 pb-2 border-b border-gray-200">
            <h1 className="text-xl tracking-[-0.16px] font-semibold mb-1 text-center sm:text-left">
              {isEditMode ? "Edit Project" : "Create Project"}
            </h1>
            <p className="text-gray-600 text-sm leading-tight">
              {isEditMode
                ? "Update project details and settings"
                : "Organize and manage tasks, resources, and team collaboration"}
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Icon</label>
              <div className="relative mt-2">
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex justify-center items-center gap-2 whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-900 px-2 py-2 rounded-full w-[60px] h-[60px]"
                      disabled={loading || deleting}
                    >
                      <span className="text-4xl">{formData.emoji}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    ref={dropdownContentRef}
                    className="p-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-72 overflow-y-auto w-72 min-w-[280px]"
                    sideOffset={5}
                  >
                    {customEmojis.map((category) => (
                      <div key={category.id} className="mb-1 last:mb-0">
                        <div className="text-[10px] font-bold uppercase text-gray-400 px-2 pt-1.5 pb-0.5 sticky top-0 bg-white z-10 select-none">
                          {category.name}
                        </div>
                        <div className="grid grid-cols-6 gap-0.5 p-1">
                          {category.emojis.map((emoji) => (
                            <DropdownMenuItem
                              key={emoji.id}
                              className="text-2xl p-0 rounded hover:bg-gray-100 focus:outline-none focus:bg-gray-200 flex items-center justify-center w-10 h-10 cursor-pointer data-[disabled]:opacity-50"
                              onSelect={() => {
                                handleEmojiSelect(emoji.id);
                              }}
                              disabled={loading || deleting}
                              title={emoji.name}
                            >
                              {emoji.id}
                            </DropdownMenuItem>
                          ))}
                        </div>
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Project Title Input */}
            <div>
              <div className="space-y-2">
                <label className="font-medium text-sm text-gray-700">Project title</label>
                <input
                  className="flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-[48px]"
                  placeholder="Website Redesign"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading || deleting}
                />
              </div>
            </div>

            {/* Project Description Textarea */}
            <div>
              <div className="space-y-2">
                <label className="font-medium text-sm text-gray-700">
                  Project description
                </label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  rows="4"
                  placeholder="Projects description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  disabled={loading || deleting}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            
            <div className={`flex ${isEditMode ? "justify-between" : "justify-end"} items-center pt-2`}>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  disabled={loading || deleting}
                  className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 h-[40px] px-4 py-2 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              )}
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors bg-black text-white shadow hover:bg-black/90 px-4 py-2 h-[40px]"
                type="submit"
                disabled={loading || deleting}
              >
                {loading && !deleting ? "Saving..." : isEditMode ? "Update Project" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <button
        type="button"
        className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-600"
        onClick={onClose}
        disabled={loading || deleting}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
};

export default CreateProjectDialog;
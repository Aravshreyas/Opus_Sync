import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import axios from "axios";

const CreateProjectDialog = ({ workspaceId, onSubmit, onClose, project = null }) => {
  const isEditMode = Boolean(project);
  const [formData, setFormData] = useState({
    emoji: "📊", // Default emoji for create mode
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill form data if in edit mode
  useEffect(() => {
    if (isEditMode && project) {
      setFormData({
        emoji: project.emoji || "📊",
        name: project.name || "",
        description: project.description || "",
      });
    }
  }, [project, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmojiSelect = (emoji) => {
    setFormData((prev) => ({ ...prev, emoji }));
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
        // Edit mode: Update existing project
        response = await axios.put(
          `${import.meta.env.VITE_BACKEND_URL}/project/${project._id}/workspace/${workspaceId}/update`,
          { ...formData },
          { withCredentials: true }
        );
      } else {
        // Create mode: Create new project
        response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/project/workspace/${workspaceId}/create`,
          formData,
          { withCredentials: true }
        );
      }

      if (onSubmit) onSubmit(response.data);
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

  const emojiOptions = ["📊", "🚀", "📋", "🎯", "💡"];

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
              <label className="block text-sm font-medium text-gray-700">Select Emoji</label>
              <div className="relative mt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex justify-center items-center gap-2 whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-900 px-2 py-2 rounded-full w-[60px] h-[60px]"
                      disabled={loading}
                    >
                      <span className="text-4xl">{formData.emoji}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40 p-2 bg-white border border-gray-300 rounded-md shadow-lg grid grid-cols-5 gap-2 mt-2">
                    {emojiOptions.map((emoji) => (
                      <DropdownMenuItem
                        key={emoji}
                        className="text-2xl hover:bg-gray-100 rounded-full p-1 focus:bg-gray-100 focus:outline-none cursor-pointer"
                        onSelect={() => handleEmojiSelect(emoji)}
                        disabled={loading}
                      >
                        {emoji}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
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
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <div className="space-y-2">
                <label className="font-medium text-sm text-gray-700">
                  Project description
                  <span className="text-xs font-extralight ml-2">Optional</span>
                </label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  rows="4"
                  placeholder="Projects description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors bg-black text-white shadow hover:bg-black/90 px-4 py-2 place-self-end h-[40px]"
              type="submit"
              disabled={loading}
            >
              {loading ? "Saving..." : isEditMode ? "Update Project" : "Create"}
            </button>
          </form>
        </div>
      </div>
      <button
        type="button"
        className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-600"
        onClick={onClose}
        disabled={loading}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
};

export default CreateProjectDialog;
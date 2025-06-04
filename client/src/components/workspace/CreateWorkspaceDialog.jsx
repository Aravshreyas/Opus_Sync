import React, { useState } from "react";
import { X } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const CreateWorkspaceDialog = ({ onClose }) => {
   const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/workspace/create/new`,
        { name, description },
        // { withCredentials: true } // Include cookies for authentication
      );
      console.log("Workspace created:", response.data);
       const newWorkspaceId = response.data?.workspace?._id 
       
      onClose(); // Close dialog on successful submission
      navigate(`/workspace/${newWorkspaceId}`);
    } catch (err) {
      console.error("Error creating workspace:", err.message, err.response?.data);
      setError("Failed to create workspace. Check the console or ensure you're logged in.");
    } finally {
      setIsLoading(false);
    }
  };

  // Debug image path
  const imagePath = "/workspace.jpg";
  console.log("Image path:", new URL(imagePath, import.meta.url).href);

  return (
    <div
      role="dialog"
      className="z-50 relative grid w-full max-w-lg gap-4 bg-white p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg md:w-full sm:max-w-5xl overflow-hidden border-0"
      tabIndex="-1"
    >
      <div className="w-full flex flex-row min-h-[590px] h-auto max-w-full">
        <div className="h-full px-10 py-10 flex-1">
          <div className="mb-5">
            <h1 className="text-2xl tracking-[-0.16px] font-semibold mb-1.5 text-center sm:text-left">
              Let's build a Workspace
            </h1>
            <p className="text-gray-600 text-lg leading-tight">
              Boost your productivity by making it easier for everyone to access projects in one location.
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="space-y-2">
                <label className="font-medium text-sm">Workspace name</label>
                <input
                  className="flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-[48px]"
                  placeholder="Taco's Co."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  name="name"
                  required
                  disabled={isLoading}
                />
                <p className="text-[0.8rem] text-gray-600">
                  This is the name of your company, team or organization.
                </p>
              </div>
            </div>
            <div className="mb-4">
              <div className="space-y-2">
                <label className="font-medium text-sm">
                  Workspace description
                  <span className="text-xs font-extralight ml-2">Optional</span>
                </label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  rows="6"
                  placeholder="Our team organizes marketing projects and tasks here."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  name="description"
                  disabled={isLoading}
                />
                <p className="text-[0.8rem] text-gray-600">
                  Get your members on board with a few words about your Workspace.
                </p>
              </div>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors bg-black text-white shadow hover:bg-black/90 px-4 py-2 w-full h-[40px]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Workspace"}
            </button>
            {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
          </form>
        </div>
        <div
          className="relative flex-1 shrink-0 hidden bg-gray-100 md:block bg-cover bg-center h-full"
          style={{
            backgroundImage: `url(${imagePath})`,
            backgroundColor: "#e5e7eb", // Fallback gray background if image fails
          }}
        ></div>
      </div>
      <button
        type="button"
        className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-600"
        onClick={onClose}
        disabled={isLoading}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
};

export default CreateWorkspaceDialog;
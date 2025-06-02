import React from "react";
import { Link } from "react-router-dom";
import WorkspaceAvatar from "../common/WorkspaceAvatar";

const WorkspaceDropdown = ({ isOpen, onClose, workspaces, currentWorkspaceId, onWorkspaceSwitch }) => {
  if (!isOpen) return null;

  return (
    <div
      className="absolute left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 animate-slide-down"
      onClick={(e) => e.stopPropagation()} // Prevent clicks from closing the dropdown
    >
      <ul className="py-1">
        {workspaces.map((ws) => (
          <li key={ws._id}>
            <button
              onClick={() => {
                onWorkspaceSwitch(ws._id);
                onClose();
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                currentWorkspaceId === ws._id ? "bg-gray-100 font-medium" : ""
              }`}
            >
              <WorkspaceAvatar workspace={{ name: ws.name }} size="h-6 w-6" />
              <span>{ws.name || "Unnamed Workspace"}</span>
            </button>
          </li>
        ))}
        {workspaces.length === 0 && (
          <li className="px-4 py-2 text-sm text-gray-500">No workspaces available</li>
        )}
      </ul>
    </div>
  );
};

export default WorkspaceDropdown;
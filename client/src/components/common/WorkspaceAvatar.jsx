import React from "react";

const WorkspaceAvatar = ({ workspace, size = "h-12 w-12" }) => {
 
  const getInitial = () => {
    if (!workspace?.name || typeof workspace.name !== "string") return "W";
    return workspace.name.charAt(0).toUpperCase();
  };

  return (
    <span className={`relative flex shrink-0 overflow-hidden ${size} rounded-lg font-bold`}>
      <span className="flex h-full w-full items-center justify-center bg-gradient-to-tl from-black to-black text-xl text-white rounded-lg">
        {getInitial()}
      </span>
    </span>
  );
};

export default WorkspaceAvatar;
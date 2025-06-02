import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Copy, Users, Link2, Mail, ShieldCheck, Loader2, UserPlus, Info, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import WorkspaceAvatar from "../../components/common/WorkspaceAvatar";
import UserAvatar from "../../components/common/UserAvatar";

// Helper function to get badge classes based on role
const getRoleBadgeClasses = (roleName) => {
  const lowerRole = String(roleName).toLowerCase();
  switch (lowerRole) {
    case "owner":
      return "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200"; // Adjusted border
    case "admin":
      return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"; // Adjusted border
    case "member":
      return "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"; // Adjusted border
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"; // Adjusted border
  }
};

export default function Members() {
  const { user } = useAuth();
  const { id: paramWorkspaceId } = useParams();
  const workspaceId = paramWorkspaceId || user?.currentWorkspace?._id;

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  const fetchData = useCallback(async () => {
    if (!workspaceId || workspaceId === "default") { // Added check for "default"
      setError("Workspace ID is missing or invalid.");
      setLoading(false);
      setWorkspace(null); // Ensure workspace is cleared
      setMembers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [workspaceResponse, membersResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/workspace/${workspaceId}`, {
          withCredentials: true,
        }),
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/workspace/members/${workspaceId}`,
          { withCredentials: true }
        ),
      ]);

      setWorkspace(workspaceResponse.data.workspace);
      setMembers(membersResponse.data.members || []);
    } catch (err) {
      console.error("Error fetching workspace data:", err);
      setError(
        `Failed to load data: ${err.response?.data?.message || err.message}`
      );
      setWorkspace(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId && workspaceId !== "default") {
        fetchData();
    } else { // Handles !workspaceId or workspaceId === "default"
        setError("No valid workspace selected.");
        setLoading(false);
        setWorkspace(null);
        setMembers([]);
    }
  }, [workspaceId, fetchData]);

  const handleCopy = () => {
    if (workspace?.inviteCode) {
      const inviteUrl = `${window.location.origin}/invite/workspace/${workspace.inviteCode}/join`;
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setInviteLinkCopied(true);
        setTimeout(() => setInviteLinkCopied(false), 2500);
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(space.14))] px-3 lg:px-20 py-10">
        <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
        <p className="text-lg text-gray-600 mt-4">Loading Members...</p>
      </div>
    );
  }

  if (error && !workspace) { // Show error prominently if workspace data itself failed
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(space.14))] px-3 lg:px-20 py-10 text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-semibold text-red-700 mb-2">Error Loading Workspace</h2>
            <p className="text-red-600 max-w-md">{error}</p>
        </div>
    );
  }
  
  // This covers cases like workspaceId being "default" or explicitly not found after an attempt
  if (!workspace && !loading && (!workspaceId || workspaceId === "default")) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(space.14))] px-3 lg:px-20 py-10 text-center">
            <Info className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Workspace Information Unavailable</h2>
            <p className="text-gray-600 max-w-md">Please select a valid workspace or create a new one.</p>
        </div>
    );
  }


  return (

    <div className="px-3 lg:px-20 py-6 md:py-8">
      <div className="w-full h-auto pt-2">
    
        <div className="w-full max-w-3xl mx-auto bg-white  p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <WorkspaceAvatar workspace={workspace} size="h-16 w-16 text-2xl" />
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate" title={workspace?.name}>
                {workspace?.name || "Workspace"}
              </h1>
              {workspace?.plan && (
                  <span className="mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                      {workspace.plan} Plan
                  </span>
              )}
              {workspace?.description && (
                <p className="mt-2 text-sm text-gray-600 leading-relaxed max-w-2xl">
                  <FileText size={14} className="inline mr-1.5 opacity-70 relative -top-px" />
                  {workspace.description}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 bg-gray-200 h-[1px] w-full my-8" /> {/* Increased margin for divider */}

        {/* Main Content - NO shadow or distinct card wrapper here, as per your request */}
        <main>
          <div className="w-full max-w-3xl mx-auto"> 
            <section className="mb-8"> 
              <div className="flex items-center justify-between pb-1"> {/* Added padding-bottom */}
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Users size={22} className="mr-2.5 text-gray-500"/> Workspace Members
                </h2>
                {/* Show member count only if members array is populated, even if it's 0 after fetch */}
                {!loading && members && (
                    <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {members.length} member{members.length !== 1 ? 's' : ''}
                    </span>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mt-2">
                Members can view and join all workspace projects, tasks, and create new items within this workspace.
              </p>
            </section>
            {error && !members.length && ( // Display error related to fetching members if it occurred and no members are shown
                 <div className="my-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
                    Could not load member list: {error.includes("members") || error.includes("data") ? error : "Network error"}
                 </div>
            )}
            <div className="shrink-0 bg-gray-200 h-[1px] w-full my-8" />

            <section className="mb-8"> 
              <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                <UserPlus size={22} className="mr-2.5 text-gray-500"/>Invite Members
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Anyone with the invite link can join this workspace.
              </p>
              <div className="flex items-center py-1 gap-2">
                <input
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed"
                  id="invite-link"
                  disabled
                  readOnly
                  value={
                    workspace?.inviteCode
                      ? `${window.location.origin}/invite/workspace/${workspace.inviteCode}/join`
                      : "Invite link not available"
                  }
                />
                <button
                  type="button"
                  className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 shadow-sm h-10 w-10 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
                              ${inviteLinkCopied ? 'bg-green-500 hover:bg-green-600 text-white focus-visible:ring-green-400' : 'bg-black text-white hover:bg-gray-800 focus-visible:ring-gray-700'}
                              disabled:opacity-60 disabled:pointer-events-none`}
                  onClick={handleCopy}
                  disabled={!workspace?.inviteCode || inviteLinkCopied}
                  title={inviteLinkCopied ? "Link Copied!" : "Copy invite link"}
                >
                  {inviteLinkCopied ? <CheckCircle size={18} /> : <Copy size={16} />}
                  <span className="sr-only">{inviteLinkCopied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </section>
            <div className="shrink-0 bg-gray-200 h-[0.5px] w-full my-8" />

            <section> 
             {members.length > 0 ? (
                <div className="flow-root">
                  <ul role="list" className="-my-4 divide-y divide-gray-100">
                    {members.map((member) => {
                      const roleName = member.role?.name?.toLowerCase() || "member";
                      const badgeClasses = getRoleBadgeClasses(roleName);
                      const iconColorClass = badgeClasses.includes('text-') ? badgeClasses.match(/text-[\w-]+/)[0] : 'text-gray-600';


                      return (
                        <li key={member.userId?._id || member._id} className="py-4">
                          <div className="flex items-center justify-between space-x-4">
                            <div className="flex items-center space-x-3 sm:space-x-4"> {/* Adjusted spacing */}
                              <UserAvatar user={member.userId} size={10} /> 
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 leading-snug truncate">
                                  {member.userId?.name || "N/A"}
                                  {member.userId?._id === user?._id && <span className="ml-1.5 text-xs text-indigo-600 font-semibold">(You)</span>}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate flex items-center gap-1"> {/* Adjusted text size */}
                                  <Mail size={13} className="opacity-60 shrink-0"/> {member.userId?.email || "No email"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                               {workspace?.owner === member.userId?._id && (
                                <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-xs font-semibold h-7 px-2.5 capitalize ${getRoleBadgeClasses("owner")}`}>
                                    <ShieldCheck size={14} className={`opacity-90 ${getRoleBadgeClasses("owner").split(' ')[1]}`}/> Owner
                                </span>
                               )}
                               {workspace?.owner !== member.userId?._id && (
                                <span 
                                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-xs font-medium h-7 px-2.5 capitalize ${badgeClasses}`}
                                    title={`Role: ${member.role?.name || "member"}`}
                                >
                                <ShieldCheck size={14} className={`opacity-90 ${iconColorClass}`}/> {roleName}
                                </span>
                               )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg mt-4">
                    <Users size={40} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="text-md font-medium text-gray-700">No Other Members Yet</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Invite people to collaborate in this workspace using the link above.
                    </p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
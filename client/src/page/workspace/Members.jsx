import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { 
    Copy, Users, Mail, ShieldCheck, Loader2, UserPlus, 
    Info, AlertTriangle, CheckCircle, FileText, Edit3, Check, X as IconX 
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import WorkspaceAvatar from "../../components/common/WorkspaceAvatar";
import UserAvatar from "../../components/common/UserAvatar";

const getRoleBadgeClasses = (roleName) => {
  const lowerRole = String(roleName || "").toLowerCase();
  switch (lowerRole) {
    case "owner":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "admin":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "member":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getIconColorClassForBadge = (roleName) => {
    const lowerRole = String(roleName || "").toLowerCase();
    switch (lowerRole) {
      case "owner": return "text-purple-700";
      case "admin": return "text-blue-700";
      case "member": return "text-green-700";
      default: return "text-gray-700";
    }
};

export default function Members() {
  const { user } = useAuth();
  const { id: paramWorkspaceId } = useParams();
  const workspaceId = paramWorkspaceId || user?.currentWorkspace?._id;

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [allSystemRoles, setAllSystemRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  
  const [roleChangeState, setRoleChangeState] = useState({ 
    memberId: null, 
    loading: false, 
    error: null,
    success: false 
  });

  const [isRolesEditMode, setIsRolesEditMode] = useState(false);
  const [editingRoleForMemberId, setEditingRoleForMemberId] = useState(null);

  const activeDropdownRef = useRef(null); 
  const activeTriggerRefs = useRef({}); 

  const assignableRoles = useMemo(() => {
    return allSystemRoles.filter(role => role.name && role.name.toUpperCase() !== 'OWNER');
  }, [allSystemRoles]);

  const fetchData = useCallback(async () => {
    if (!workspaceId || workspaceId === "default") {
      setError("Workspace ID is missing or invalid.");
      setLoading(false);
      setWorkspace(null);
      setMembers([]);
      setAllSystemRoles([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [workspaceResponse, membersAndRolesResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/workspace/${workspaceId}`, {
          withCredentials: true,
        }),
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/workspace/members/${workspaceId}`,
          // { withCredentials: true }
        ),
      ]);

      setWorkspace(workspaceResponse.data.workspace);
      setMembers(membersAndRolesResponse.data.members || []);
      setAllSystemRoles(membersAndRolesResponse.data.roles || []);

    } catch (err) {
      console.error("Error fetching workspace data and roles:", err);
      setError(`Failed to load data: ${err.response?.data?.message || err.message}`);
      setWorkspace(null);
      setMembers([]);
      setAllSystemRoles([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId && workspaceId !== "default") {
        fetchData();
    } else {
      setError("No valid workspace selected.");
      setLoading(false);
      setWorkspace(null);
      setMembers([]);
      setAllSystemRoles([]);
    }
  }, [workspaceId, fetchData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!editingRoleForMemberId) return;
      const triggerElement = activeTriggerRefs.current[editingRoleForMemberId];
      if (
        activeDropdownRef.current && !activeDropdownRef.current.contains(event.target) &&
        triggerElement && !triggerElement.contains(event.target)
      ) {
        setEditingRoleForMemberId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingRoleForMemberId]);

  const handleCopy = () => {
    if (workspace?.inviteCode) {
      const inviteUrl = `${window.location.origin}/invite/workspace/${workspace.inviteCode}/join`;
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setInviteLinkCopied(true);
        setTimeout(() => setInviteLinkCopied(false), 2500);
      });
    }
  };

  const handleAttemptRoleChange = async (memberIdToChange, newRoleId, newRoleName) => {
    setEditingRoleForMemberId(null); 
    if (!workspaceId || !memberIdToChange || !newRoleId) {
      setRoleChangeState({ memberId: memberIdToChange, loading: false, error: "Internal error: Missing data.", success: false });
      return;
    }
    const memberToUpdate = members.find(m => m.userId?._id === memberIdToChange);
    if (!memberToUpdate) {
      setRoleChangeState({ memberId: memberIdToChange, loading: false, error: "Internal error: Member not found.", success: false });
      return;
    }
    const confirmMsg = `Are you sure you want to change ${memberToUpdate.userId?.name || 'this member'}'s role to ${newRoleName}?`;
    if (!window.confirm(confirmMsg)) return;

    setRoleChangeState({ memberId: memberIdToChange, loading: true, error: null, success: false });
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/workspace/change/member/role/${workspaceId}`,
        { memberId: memberIdToChange, roleId: newRoleId },
        // { withCredentials: true }
      );
      setMembers(prevMembers =>
        prevMembers.map(m =>
          m.userId?._id === memberIdToChange ? { ...m, role: response.data.member.role } : m
        )
      );
      setRoleChangeState({ memberId: memberIdToChange, loading: false, error: null, success: true });
      setTimeout(() => setRoleChangeState(prev => ({...prev, memberId: null, success: false})), 2000);
    } catch (err) {
      console.error("Error changing member role:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to change role.";
      setRoleChangeState({ memberId: memberIdToChange, loading: false, error: errorMessage, success: false });
    }
  };
  
  const toggleRoleDropdown = (memberId) => {
    setEditingRoleForMemberId(prev => (prev === memberId ? null : memberId));
  };
  
  const isCurrentUserOwner = user?._id === workspace?.owner;

  if (loading && !workspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(space.14))] px-3 lg:px-20 py-10">
        <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
        <p className="text-lg text-gray-600 mt-4">Loading Workspace Members...</p>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(space.14))] px-3 lg:px-20 py-10 text-center">
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-semibold text-red-700 mb-2">Error Loading Workspace</h2>
        <p className="text-red-600 max-w-md">{error}</p>
      </div>
    );
  }
  
  if (!workspace && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(space.14))] px-3 lg:px-20 py-10 text-center">
        <Info className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Workspace Information Unavailable</h2>
        <p className="text-gray-600 max-w-md">{error || "Please select a valid workspace or create a new one."}</p>
      </div>
    );
  }

  return (
    <div className="px-3 lg:px-20 py-6 md:py-8">
      <div className="w-full h-auto pt-2">
        <div className="w-full max-w-3xl mx-auto bg-white p-6 md:p-8">
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
        <div className="shrink-0 bg-gray-200 h-[1px] w-full my-8" />

        <main>
          <div className="w-full max-w-3xl mx-auto"> 
            <section className="mb-8"> 
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Users size={22} className="mr-2.5 text-gray-500"/> Workspace Members
                </h2>
                {!loading && members && (
                    <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {members.length} member{members.length !== 1 ? 's' : ''}
                    </span>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mt-2">
                Manage member roles and invite new people to collaborate.
              </p>
              {isCurrentUserOwner && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setIsRolesEditMode(!isRolesEditMode);
                      if (isRolesEditMode) setEditingRoleForMemberId(null); // Close any open dropdown when exiting edit mode
                    }}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 
                               bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400"
                  >
                    {isRolesEditMode ? <><IconX size={16} className="mr-1"/> Done Editing Roles</> : <><Edit3 size={16} className="mr-1"/> Edit Member Roles</>}
                  </button>
                </div>
              )}
            </section>

            {(error && !members.length && !loading) && (
                <div className="my-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
                  Could not load member list: {error.includes("members") ? error : "An error occurred."}
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
                  <ul role="list" className="-my-4 divide-y divide-gray-200">
                    {members.map((member) => {
                      const memberUserId = member.userId?._id;
                      const currentMemberRole = member.role; 
                      const roleName = currentMemberRole?.name || "Member";
                      const currentRoleNameCap = roleName.charAt(0).toUpperCase() + roleName.slice(1);
                      const badgeClasses = getRoleBadgeClasses(roleName);
                      const iconColorClass = getIconColorClassForBadge(roleName);
                      
                      const isCurrentMemberTheUser = memberUserId === user?._id;
                      const isMemberTheOwner = workspace?.owner === memberUserId;
                      const canThisMemberRoleBeEditedByOwner = isCurrentUserOwner && !isMemberTheOwner && !isCurrentMemberTheUser;
                      
                      const isThisSpecificDropdownOpen = editingRoleForMemberId === memberUserId;

                      return (
                        <li key={memberUserId || member._id} className="py-4">
                          <div className="flex items-center justify-between space-x-4">
                            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                              <UserAvatar user={member.userId} size={10} /> 
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 leading-snug truncate">
                                  {member.userId?.name || "N/A"}
                                  {isCurrentMemberTheUser && <span className="ml-1.5 text-xs text-indigo-600 font-semibold">(You)</span>}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate flex items-center gap-1">
                                  <Mail size={13} className="opacity-60 shrink-0"/> {member.userId?.email || "No email"}
                                </p>
                              </div>
                            </div>

                            <div className="relative flex items-center gap-2 shrink-0"> {/* Parent needs to be relative for dropdown */}
                              {roleChangeState.loading && roleChangeState.memberId === memberUserId && (
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                              )}
                              {roleChangeState.success && roleChangeState.memberId === memberUserId && (
                                <CheckCircle size={18} className="text-green-500" />
                              )}
                               {roleChangeState.error && roleChangeState.memberId === memberUserId && (
                                <AlertTriangle size={18} className="text-red-500" title={roleChangeState.error}/>
                              )}
                              
                              {/* Logic to show either static badge or editable badge with dropdown */}
                              {!(roleChangeState.loading && roleChangeState.memberId === memberUserId) && 
                               !(roleChangeState.success && roleChangeState.memberId === memberUserId) && 
                                (isRolesEditMode && canThisMemberRoleBeEditedByOwner ? (
                                  <>
                                    <button
                                      type="button"
                                      ref={el => (activeTriggerRefs.current[memberUserId] = el)}
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent global click listener from closing it immediately
                                        toggleRoleDropdown(memberUserId);
                                      }}
                                      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-xs font-medium h-7 px-2.5 capitalize transition-opacity hover:opacity-80 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500 ${badgeClasses}`}
                                      title={`Edit ${member.userId?.name}'s role`}
                                    >
                                      <ShieldCheck size={14} className={`opacity-90 ${iconColorClass}`}/> 
                                      {currentRoleNameCap}
                                      <Edit3 size={12} className={`ml-1 opacity-70 ${iconColorClass}`}/>
                                    </button>

                                    {isThisSpecificDropdownOpen && (
                                      <div
                                        ref={activeDropdownRef}
                                        className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1"
                                        onClick={(e) => e.stopPropagation()} // Clicks inside dropdown don't close it
                                      >
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-700 border-b border-gray-100">
                                          Change role:
                                        </div>
                                        {assignableRoles.length > 0 ? assignableRoles.map((roleToAssign) => (
                                          <button
                                            key={roleToAssign._id}
                                            disabled={roleToAssign._id === currentMemberRole?._id}
                                            onClick={() => handleAttemptRoleChange(memberUserId, roleToAssign._id, roleToAssign.name)}
                                            className="flex items-center justify-between w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                          >
                                            <span>{roleToAssign.name}</span>
                                            {roleToAssign._id === currentMemberRole?._id && <Check size={16} className="text-indigo-600"/>}
                                          </button>
                                        )) : (
                                          <div className="px-3 py-2 text-sm text-gray-400 italic">No other roles defined</div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                ) : ( // Static badge if not in edit mode or not editable
                                  <span 
                                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-xs font-medium h-7 px-2.5 capitalize ${badgeClasses}`}
                                    title={`Role: ${currentRoleNameCap}`}
                                  >
                                    <ShieldCheck size={14} className={`opacity-90 ${iconColorClass}`}/> {currentRoleNameCap}
                                  </span>
                                ))
                              }
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                !loading && (
                  <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg mt-4">
                      <Users size={40} className="mx-auto text-gray-300 mb-3" />
                      <h3 className="text-md font-medium text-gray-700">No Other Members Yet</h3>
                      <p className="text-sm text-gray-500 mt-1">
                          Invite people to collaborate in this workspace using the link above.
                      </p>
                  </div>
                )
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
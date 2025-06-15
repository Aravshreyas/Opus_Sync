import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import axios from "axios";
import {
  AudioLines, Plus, ChevronDown, LayoutDashboard, CircleCheckBig, Users, Settings,
  Ellipsis, LogOut as LogoutIcon, Loader2, Folder, UserCircle, AlertTriangle, X as IconX,MessageSquare,Calendar,Video,
} from "lucide-react";
import CreateWorkspaceDialog from "../workspace/CreateWorkspaceDialog";
import CreateProjectDialog from "../workspace/project/CreateProjectDialog";
import WorkspaceAvatar from "../common/WorkspaceAvatar";
import UserAvatar from "../common/UserAvatar";
import WorkspaceDropdown from "../workspace/WorkspaceDropdown";

const Sidebar = ({ isDesktopCollapsed, isMobileOpen, closeMobileSidebar }) => {
  const { user, setUser, loading: authLoading, logout: authContextLogout } = useAuth();
  const { id: paramWorkspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [workspaceId, setWorkspaceId] = useState(() => paramWorkspaceId || user?.currentWorkspace?._id || "default");
  
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isWorkspaceDialogOpen, setIsWorkspaceDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const [workspaceData, setWorkspaceData] = useState({ name: "Loading...", emoji: "🏢" });
  const [projects, setProjects] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  
  const [currentWsDataLoading, setCurrentWsDataLoading] = useState(true);
  const [allWsLoading, setAllWsLoading] = useState(true);
  const [error, setError] = useState(null);

  const userMenuRef = useRef(null);
  const workspaceDropdownButtonRef = useRef(null);

  // Fetch current workspace (name, emoji) AND its projects
  const fetchCurrentWorkspaceDetailsAndProjects = useCallback(async (idToFetch) => {
    if (!user || idToFetch === "default" || !idToFetch) {
      setWorkspaceData({ name: "No Workspace", emoji: "🚫" });
      setProjects([]);
      setCurrentWsDataLoading(false);
      return;
    }
    setCurrentWsDataLoading(true);
    setError(null);
    try {
      const [wsResponse, pjResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/workspace/${idToFetch}`, 
          // { withCredentials: true }
        ),
        axios.get(`${import.meta.env.VITE_BACKEND_URL}/project/workspace/${idToFetch}/all`, 
          // { withCredentials: true }
        )
      ]);
      const fetchedWs = wsResponse.data.workspace;
      setWorkspaceData({ name: fetchedWs?.name || "Workspace", emoji: fetchedWs?.emoji || "🏢" });
      setProjects(pjResponse.data.projects || []);
    } catch (err) {
      console.error(`Error fetching data for workspace ${idToFetch}:`, err);
      setError(`Failed to load workspace data.`);
      setWorkspaceData({ name: "Error", emoji: "⚠️" });
      setProjects([]);
    } finally {
      setCurrentWsDataLoading(false);
    }
  }, [user]);

  // Fetches all workspaces for the user (for dropdown and initial setup)
  const fetchAllWorkspacesAndInitialize = useCallback(async () => {
    if (!user) {
      setAllWsLoading(false);
      return;
    }
    setAllWsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/workspace/all`,
        //  { withCredentials: true }
        );
      const validWorkspaces = (response.data.workspaces || []).filter(ws => ws && ws._id);
      setWorkspaces(validWorkspaces);

      let determinedId = "default";
      if (paramWorkspaceId && validWorkspaces.some(ws => ws._id === paramWorkspaceId)) {
        determinedId = paramWorkspaceId;
      } else if (user.currentWorkspace?._id && validWorkspaces.some(ws => ws._id === user.currentWorkspace._id)) {
        determinedId = user.currentWorkspace._id;
      } else if (validWorkspaces.length > 0) {
        determinedId = validWorkspaces[0]._id;
      }

      // Only switch workspace if necessary
      if (determinedId !== "default" && determinedId !== workspaceId) {
        await handleWorkspaceSwitch(determinedId, true);
      } else if (determinedId === "default") {
        setWorkspaceId("default");
        if (!location.pathname.startsWith('/get-started') && !location.pathname.startsWith('/settings')) {
          navigate('/get-started');
        }
      }
    } catch (err) {
      console.error("Error fetching all workspaces:", err);
      setError("Failed to load workspaces list.");
      setWorkspaces([]);
    } finally {
      setAllWsLoading(false);
    }
  }, [user, paramWorkspaceId, navigate, location.pathname, workspaceId]);

  // Initial setup for auth and workspace
  useEffect(() => {
    if (authLoading) {
      setCurrentWsDataLoading(true);
      setAllWsLoading(true);
      return;
    }
    if (!user) {
      setCurrentWsDataLoading(false);
      setAllWsLoading(false);
      setWorkspaceId("default");
      setWorkspaceData({ name: "No Workspace", emoji: "🚫" });
      setProjects([]);
      setWorkspaces([]);
      return;
    }
    fetchAllWorkspacesAndInitialize();
  }, [user, authLoading, fetchAllWorkspacesAndInitialize]);

  // Sync workspaceId with URL params
  useEffect(() => {
    if (paramWorkspaceId && paramWorkspaceId !== "default" && paramWorkspaceId !== workspaceId) {
      setWorkspaceId(paramWorkspaceId);
    } else if (!paramWorkspaceId && workspaceId !== "default" && user?.currentWorkspace?._id && workspaceId !== user.currentWorkspace._id) {
      navigate(`/workspace/${user.currentWorkspace._id}`, { replace: true });
      setWorkspaceId(user.currentWorkspace._id);
    }
  }, [paramWorkspaceId, user, workspaceId, navigate]);

  // Fetch workspace details when workspaceId changes
  useEffect(() => {
    if (workspaceId && workspaceId !== "default" && user && !authLoading) {
      fetchCurrentWorkspaceDetailsAndProjects(workspaceId);
    } else if (workspaceId === "default" && !authLoading && !user?.currentWorkspace?._id) {
      setWorkspaceData({ name: "No Workspace", emoji: "🚫" });
      setProjects([]);
      setCurrentWsDataLoading(false);
    }
  }, [workspaceId, user, authLoading, fetchCurrentWorkspaceDetailsAndProjects]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (isWorkspaceDropdownOpen && workspaceDropdownButtonRef.current && !workspaceDropdownButtonRef.current.contains(event.target)) {
        const dropdownContent = document.getElementById('workspace-dropdown-content');
        if (dropdownContent && !dropdownContent.contains(event.target)) setIsWorkspaceDropdownOpen(false);
        else if (!dropdownContent) setIsWorkspaceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen, isWorkspaceDropdownOpen]);

  const handleWorkspaceSwitch = useCallback(async (newWorkspaceId, isInitialSetup = false) => {
    if (!newWorkspaceId || (newWorkspaceId === workspaceId && !isInitialSetup)) {
      setIsWorkspaceDropdownOpen(false);
      if (isMobileOpen) closeMobileSidebar();
      return;
    }
    
    const targetWs = workspaces.find(ws => ws._id === newWorkspaceId) || 
                     (user?.currentWorkspace?._id === newWorkspaceId ? user.currentWorkspace : { _id: newWorkspaceId, name: "Loading...", emoji: "⏳"});
  
    setWorkspaceData(prev => ({ ...prev, name: targetWs?.name || "Loading...", emoji: targetWs?.emoji || "⏳" }));
    setCurrentWsDataLoading(true);
  
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/user/current-workspace`,
        { workspaceId: newWorkspaceId },
        // { withCredentials: true }
      );
      
      // Update the user state with the response data
      const updatedUser = response.data.user?.user || response.data.user;
      setUser(updatedUser);
      
      setWorkspaceId(newWorkspaceId);
  
      // Always navigate to the Dashboard of the new workspace
      const newPath = `/workspace/${newWorkspaceId}`;
      if (location.pathname !== newPath) {
        navigate(newPath, { replace: true });
      }
      
      // Fetch updated workspace details after switching
      await fetchCurrentWorkspaceDetailsAndProjects(newWorkspaceId);
    } catch (error) {
      console.error("Failed to switch workspace:", error);
      setError("Failed to switch workspace.");
      const originalWs = workspaces.find(ws => ws._id === workspaceId) || user?.currentWorkspace;
      if (originalWs) {
        setWorkspaceData({ name: originalWs.name, emoji: originalWs.emoji || "🏢" });
      } else {
        setWorkspaceData({ name: "Error", emoji: "⚠️" });
      }
    } finally {
      setIsWorkspaceDropdownOpen(false);
      if (isMobileOpen) closeMobileSidebar();
    }
  }, [user, workspaceId, workspaces, navigate, setUser, isMobileOpen, closeMobileSidebar, fetchCurrentWorkspaceDetailsAndProjects]);

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, {},
        //  { withCredentials: true }
        );
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      sessionStorage.removeItem("accessToken");
      if (authContextLogout) authContextLogout();
      else setUser(null);
      setIsLogoutConfirmOpen(false);
      navigate("/");
    }
  };
  
  const handleLinkClick = () => {
    if (isMobileOpen) closeMobileSidebar();
  };

  const isActiveTab = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };
  
  const isBasePathActive = (basePath) => location.pathname.startsWith(basePath);

  if (authLoading && !user) { 
    return (
      <div className={`fixed inset-y-0 left-0 z-40 hidden md:flex border-r bg-white transition-all duration-300 ${isDesktopCollapsed ? "w-20" : "w-64"}`}>
        <div className="flex items-center justify-center w-full h-full">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }
  if (!user && !authLoading) return null;

  const displayCollapsed = isDesktopCollapsed && !isMobileOpen;

  const navLinkBaseClasses = "flex items-center rounded-md text-sm transition-colors duration-150";
  const activeNavLinkClasses = "bg-gray-100 font-semibold text-gray-900";
  const inactiveNavLinkClasses = "text-gray-600 hover:bg-gray-100 hover:text-gray-800";
  const iconClasses = "h-4 w-4 text-gray-500 shrink-0";
  const activeIconClasses = "text-indigo-600";
  const navItemHeight = "h-8";
  const collapsedNavItemHeight = "h-10";

  const NavItem = ({ to, label, icon: Icon, exact = false }) => {
    const isActive = exact ? isActiveTab(to, true) : isBasePathActive(to);
    return (
      <li title={displayCollapsed ? label : undefined}>
        <Link
          to={to}
          onClick={handleLinkClick}
          className={`${navLinkBaseClasses} ${isActive ? activeNavLinkClasses : inactiveNavLinkClasses} ${displayCollapsed ? `justify-center !p-0 ${collapsedNavItemHeight}` : `${navItemHeight} gap-2 p-2`}`}
        >
          <Icon className={`${iconClasses} ${isActive ? activeIconClasses : ''}`} />
          {displayCollapsed ? null : <span>{label}</span>}
        </Link>
      </li>
    );
  };

  return (
    <>
      <div
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white 
          transform transition-transform duration-300 ease-in-out 
          md:relative md:inset-auto md:z-auto md:translate-x-0 
          ${isMobileOpen ? "translate-x-0 shadow-xl w-64" : `-translate-x-full ${isDesktopCollapsed ? "20" : "64"}`} 
          md:w-${isDesktopCollapsed ? "20" : "64"} 
          md:transition-width md:duration-300 md:ease-in-out
        `}
      >
        <div className={`flex flex-col gap-0 p-2 shrink-0 ${displayCollapsed ? 'items-center' : ''}`}>
          <div className={`flex items-center justify-between w-full ${displayCollapsed ? 'h-[50px] justify-center' : 'h-[50px] justify-start px-1'}`}>
            <Link to={workspaceId && workspaceId !== "default" ? `/workspace/${workspaceId}` : "/get-started"} className="flex items-center" onClick={handleLinkClick} title="Opus Sync Home">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-black text-white shrink-0">
                <AudioLines className="h-4 w-4" />
              </div>
              {displayCollapsed ? null : (
                <span className="ml-2 font-medium text-black">Opus Sync.</span>
              )}
            </Link>
            {isMobileOpen && (
              <button onClick={closeMobileSidebar} className="p-1 -mr-1 text-gray-500 hover:text-gray-700 md:hidden">
                <IconX size={22} />
                <span className="sr-only">Close sidebar</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto p-2">
          <div className="flex flex-col w-full">
            {displayCollapsed ? null : (
              <div className="flex items-center justify-between h-8 px-2 text-xs font-medium text-gray-500">
                <span>Workspaces ({workspaces.length})</span>
                <button
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                  onClick={() => { setIsWorkspaceDialogOpen(true); if (isMobileOpen) closeMobileSidebar(); }}
                  disabled={allWsLoading}
                  title="Create new workspace"
                >
                  <Plus className="h-3.5 w-3.5 text-gray-600" />
                </button>
              </div>
            )}
            <ul className="flex flex-col gap-1 w-full">
              <li className="relative group" ref={workspaceDropdownButtonRef}>
                <button
                  className={`flex w-full items-center gap-2 p-2 rounded-md text-sm hover:bg-gray-100 transition-colors
                    ${displayCollapsed ? `justify-center ${collapsedNavItemHeight}` : `h-12`}
                    ${isActiveTab(`/workspace/${workspaceId}`, true) && displayCollapsed && workspaceId !== "default" ? activeNavLinkClasses : ''}`}
                  onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                  disabled={allWsLoading || (workspaces.length === 0 && !currentWsDataLoading && workspaceId !== "default")}
                  title={workspaceData.name}
                >
                  <WorkspaceAvatar workspace={workspaceData} size={displayCollapsed ? "h-7 w-7" : "h-8 w-8"} />
                  {displayCollapsed ? null : (
                    <div className="flex-1 text-left overflow-hidden">
                      <span className="truncate block font-semibold text-sm text-black">
                        {(allWsLoading || currentWsDataLoading) && workspaceId !== "default" && workspaceData.name === "Loading..." ? "Loading..." : workspaceData.name}
                      </span>
                      <span className="truncate text-xs text-gray-600 block">
                        {workspaces.length === 0 && !allWsLoading ? "Create one" : "Free"}
                      </span>
                    </div>
                  )}
                  {displayCollapsed ? null : workspaces.length > 0 && (
                    <ChevronDown className={`h-4 w-4 ml-auto text-gray-600 transition-transform ${isWorkspaceDropdownOpen ? "rotate-180" : ""}`} />
                  )}
                </button>
                {workspaces.length > 0 && (
                  <WorkspaceDropdown
                    isOpen={isWorkspaceDropdownOpen}
                    onClose={() => setIsWorkspaceDropdownOpen(false)}
                    workspaces={workspaces}
                    currentWorkspaceId={workspaceId}
                    onWorkspaceSwitch={(id) => handleWorkspaceSwitch(id)}
                    onAddWorkspace={() => { setIsWorkspaceDropdownOpen(false); setIsWorkspaceDialogOpen(true); if (isMobileOpen) closeMobileSidebar(); }}
                    anchorRef={workspaceDropdownButtonRef}
                    isSidebarCollapsed={displayCollapsed}
                  />
                )}
              </li>
              {displayCollapsed && workspaces.length === 0 && !allWsLoading && (
                <button
                  onClick={() => { setIsWorkspaceDialogOpen(true); if (isMobileOpen) closeMobileSidebar(); }}
                  className={`w-full mt-1 ${navLinkBaseClasses} ${inactiveNavLinkClasses} justify-center !p-0 ${collapsedNavItemHeight} group relative`}
                  title="Create New Workspace"
                >
                  <Plus className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
                </button>
              )}
            </ul>
          </div>

          {workspaceId && workspaceId !== "default" && (
            <>
              <div className="h-px bg-gray-200 w-full my-2" />
              <ul className="flex flex-col gap-1 w-full">
                <NavItem to={`/workspace/${workspaceId}`} label="Dashboard" icon={LayoutDashboard} exact={true} />
                <NavItem to={`/workspace/${workspaceId}/tasks`} label="Tasks" icon={CircleCheckBig} exact={false} />
                <NavItem to={`/workspace/${workspaceId}/members`} label="Members" icon={Users} exact={true} />
                <NavItem to={`/workspace/${workspaceId}/settings`} label="Settings" icon={Settings} exact={false} />
                <NavItem to={`/chat`} label="Chat" icon={MessageSquare} exact={false} />
                <NavItem to={`/calendar`} label="Calendar" icon={Calendar} exact={false} />
                <NavItem to={`/meet`} label="Meet" icon={Video} exact={false} />
              </ul>
              <div className="h-px bg-gray-200 w-full my-2" />
              <div className="flex flex-col w-full">
                <div className={`flex items-center justify-between h-8 px-2 text-xs font-medium text-gray-500 ${displayCollapsed ? "justify-center" : ""}`}>
                  {displayCollapsed ? null : <span>Projects</span>}
                  <button
                    className={`flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 ${displayCollapsed ? "h-6 w-6" : "h-5 w-5"}`}
                    onClick={() => { setIsProjectDialogOpen(true); if (isMobileOpen) closeMobileSidebar(); }}
                    disabled={currentWsDataLoading}
                    title="Create new project"
                  >
                    <Plus className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                </div>
                <ul className={`flex flex-col gap-1 w-full ${!displayCollapsed ? "max-h-[calc(100vh-510px)] min-h-[60px] overflow-y-auto" : "overflow-y-auto"}`}>
                  {currentWsDataLoading ? (
                    <li className={`p-2 text-sm text-gray-500 ${displayCollapsed ? "text-center" : ""}`}>
                      {displayCollapsed ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Loading projects..."}
                    </li>
                  ) : error && projects.length === 0 ? (
                    <li className={`p-2 text-sm text-red-500 ${displayCollapsed ? "text-center" : ""}`}>
                      {displayCollapsed ? <AlertTriangle size={16} className="mx-auto" /> : "Error loading projects."}
                    </li>
                  ) : projects.length > 0 ? (
                    projects.map((project) => (
                      <li key={project._id} title={displayCollapsed ? (project.name || "Unnamed Project") : undefined}>
                        <Link
                          to={`/workspace/${workspaceId}/project/${project._id}`}
                          onClick={handleLinkClick}
                          className={`${navLinkBaseClasses} ${navItemHeight} ${isActiveTab(`/workspace/${workspaceId}/project/${project._id}`) ? activeNavLinkClasses : inactiveNavLinkClasses} ${displayCollapsed ? `justify-center !p-0 ${collapsedNavItemHeight}` : "gap-2"} group relative`}
                        >
                          <span className={`flex-shrink-0 ${displayCollapsed ? "text-base" : "text-sm"}`}>{project.emoji || "📝"}</span>
                          {displayCollapsed ? null : (
                            <span className="truncate flex-1">{project.name || "Unnamed Project"}</span>
                          )}
                          {displayCollapsed ? null : (
                            <button className="absolute right-1 top-1/2 -translate-y-1/2 p-1 flex w-5 h-5 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800 opacity-0 group-hover:opacity-100 focus:opacity-100">
                              <Ellipsis className="h-4 w-4" />
                            </button>
                          )}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className={`px-2.5 py-3 text-xs text-gray-500 ${displayCollapsed ? "text-center" : "text-left"}`}>
                      {displayCollapsed ? <Folder className="h-5 w-5 mx-auto opacity-70" title="No projects yet" /> : (
                        <div>
                          <p>There are no projects in this Workspace yet.</p>
                          <p className="mt-1">Projects you create will show up here.</p>
                          <button
                            onClick={() => { setIsProjectDialogOpen(true); if (isMobileOpen) closeMobileSidebar(); }}
                            className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium text-xs inline-flex items-center gap-1"
                          >
                            <Plus size={14} /> Create a project
                          </button>
                        </div>
                      )}
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div> 

        {/* User Profile Section - At the bottom of the sidebar flex container */}
        <div ref={userMenuRef} className={`p-2 border-t border-gray-200 mt-auto relative shrink-0 ${displayCollapsed ? "py-1.5" : ""}`}>
          <button
            className={`flex w-full items-center gap-2 p-2 rounded-md text-sm hover:bg-gray-100 relative transition-colors ${displayCollapsed ? "justify-center !p-0 h-10 w-10 mx-auto" : "h-12"}`}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            title="User Menu"
          >
            <UserAvatar user={user} size={displayCollapsed ? 8 : undefined} />
            {displayCollapsed ? null : (
              <>
                <div className="flex-1 text-left overflow-hidden">
                  <span className="truncate font-semibold text-black block">
                    {(user && (user.name || user.user?.name)) || "User"}
                  </span>
                  <span className="truncate text-xs text-gray-600 block">
                    {(user && (user.email || user.user?.email)) || "No email"}
                  </span>
                </div>
                <Ellipsis className="h-4 w-4 ml-auto text-gray-600" />
              </>
            )}
          </button>

          {isUserMenuOpen && (
            <div className={`absolute left-2 right-2 bottom-full mb-1.5 min-w-[calc(100%-1rem)] bg-white border border-gray-200 rounded-md shadow-xl py-1 transition-all duration-150 ease-out origin-bottom z-10 ${displayCollapsed ? "!left-auto right-0 transform translate-x-[calc(100%+0.5rem)] bottom-auto top-1/2 -translate-y-1/2 mb-0 origin-left w-48" : "w-[calc(100%-1rem)]"}`}>
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800 truncate" title={(user && (user.name || user.user?.name)) || "User"}>{(user && (user.name || user.user?.name)) || "User"}</p>
                <p className="text-xs text-gray-500 truncate" title={(user && (user.email || user.user?.email)) || "No email"}>{(user && (user.email || user.user?.email)) || "No email"}</p>
              </div>
              <Link
                to="/settings/account"
                onClick={() => { setIsUserMenuOpen(false); handleLinkClick(); }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100"
              >
                <Settings className="h-4 w-4 text-gray-500" /> Account Settings
              </Link>
              <div className="h-px bg-gray-100 my-0.5"></div>
              <button
                onClick={() => { setIsUserMenuOpen(false); setIsLogoutConfirmOpen(true); }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 focus:bg-red-50"
              >
                <LogoutIcon className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div> 

      {/* Dialogs */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[101] p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to log out?</p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                onClick={() => setIsLogoutConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
      {isWorkspaceDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <CreateWorkspaceDialog
            onClose={() => setIsWorkspaceDialogOpen(false)}
            onWorkspaceCreated={(newWorkspace) => {
              fetchAllWorkspacesAndInitialize();
              if (newWorkspace && newWorkspace._id) {
                handleWorkspaceSwitch(newWorkspace._id);
              }
              setIsWorkspaceDialogOpen(false);
            }}
          />
        </div>
      )}
      {isProjectDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <CreateProjectDialog
            workspaceId={workspaceId}
            onSubmit={() => {
              if (workspaceId !== "default") fetchCurrentWorkspaceDetailsAndProjects(workspaceId);
              setIsProjectDialogOpen(false);
            }}
            onClose={() => setIsProjectDialogOpen(false)}
          />
        </div>
      )}
    </>
  );
};

export default Sidebar;
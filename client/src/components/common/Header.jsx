// src/components/common/Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { PanelLeft, PanelRight, ChevronRight, X as IconX } from "lucide-react";

const Header = ({ toggleDesktopSidebar, toggleMobileSidebar, isDesktopSidebarCollapsed, isMobileSidebarOpen }) => {
  const location = useLocation();
  const { workspaceId: paramWorkspaceId } = useParams();
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getBreadcrumbs = () => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const crumbs = [];
    const currentWorkspaceId = paramWorkspaceId || (pathParts[0] === 'workspace' && pathParts[1]);

    if (currentWorkspaceId && currentWorkspaceId !== "default") {
      crumbs.push({ label: "Dashboard", path: `/workspace/${currentWorkspaceId}` });
      if (pathParts[2] === "project" && pathParts[3]) {
        crumbs.push({ label: "Project" }); // Simplified, ideally fetch project name
        if (pathParts[4] === "tasks" && pathParts[5]) {
          crumbs.push({ label: "Task" }); 
        }
      } else if (pathParts[2]) {
         const pageName = pathParts[2].charAt(0).toUpperCase() + pathParts[2].slice(1);
         if(!["Project", "Dashboard"].includes(pageName)) crumbs.push({ label: pageName });
      }
    } else if (pathParts[0] === "settings") {
        crumbs.push({label: "Settings"});
        if(pathParts[1]) crumbs.push({label: pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1)})
    } else if (pathParts[0] === 'get-started') {
        crumbs.push({label: "Get Started"});
    } else if (pathParts.length === 0 || (pathParts[0] === "workspace" && !pathParts[1])) {
        crumbs.push({ label: "Dashboard" });
    } else {
      crumbs.push({ label: "Home", path: "/" }); 
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  
  const handleToggle = () => {
    if (isMobileView) {
      toggleMobileSidebar();
    } else {
      toggleDesktopSidebar();
    }
  };

  let ToggleIcon = PanelLeft;
  if (isMobileView) {
    ToggleIcon = isMobileSidebarOpen ? IconX : PanelLeft;
  } else {
    ToggleIcon = isDesktopSidebarCollapsed ? PanelRight : PanelLeft;
  }

  return (
    <header className="flex sticky top-0 z-20 bg-white h-14 shrink-0 items-center border-b border-gray-200 px-4">
      <button
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 h-9 w-9 mr-3"
        onClick={handleToggle}
        aria-label="Toggle sidebar"
      >
        <ToggleIcon className="h-5 w-5" />
      </button>

      <div className="flex-1 flex items-center gap-2">
        <nav aria-label="breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="inline-flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                {crumb.path && index < breadcrumbs.length -1 ? (
                  <Link to={crumb.path} className="transition-colors hover:text-gray-700">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={`font-medium ${index === breadcrumbs.length -1 ? 'text-gray-800' : ''} line-clamp-1`}>
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </header>
  );
};

export default Header;
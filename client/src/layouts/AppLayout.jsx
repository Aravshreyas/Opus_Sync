// src/layouts/AppLayout.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import Header from "../components/common/Header";
import { Outlet, useLocation } from "react-router-dom";


const AppLayout = () => {
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();


  
  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed((prev) => !prev);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  
  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        isDesktopCollapsed={isDesktopSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out md:ml-${
          isDesktopSidebarCollapsed ? "20" : "64" // Adjusts margin for w-20 or w-64
        }`}
      >
        <Header
          toggleDesktopSidebar={toggleDesktopSidebar}
          toggleMobileSidebar={toggleMobileSidebar}
          isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      {/* Backdrop for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}
     
    </div>
  );
};

export default AppLayout;
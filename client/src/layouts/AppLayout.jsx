// src/layouts/AppLayout.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import Header from "../components/common/Header";
import { Outlet, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext"; // Import useSocket
import IncomingCallToast from "../components/chat/IncomingCallToast"; // Import new components
import VideoCallModal from "../components/chat/VideoCallModal";

const AppLayout = () => {
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
const { socket } = useSocket();

const [incomingCall, setIncomingCall] = useState(null); // For the pop-up toast
  const [activeCall, setActiveCall] = useState(null);     // For the full-screen video modal

  // This single listener handles incoming calls for the entire app
  useEffect(() => {
      if (!socket) return;

      const handleCallMade = (data) => {
          console.log("Global listener: Incoming call received", data);
          setIncomingCall({ ...data, isReceivingCall: true });
      };

      // Also listen for when the other user ends the call abruptly
      const handleCallEnded = () => {
          setIncomingCall(null);
          setActiveCall(null);
      }

      socket.on('call-made', handleCallMade);
      socket.on('call-ended', handleCallEnded);

      return () => {
          socket.off('call-made', handleCallMade);
          socket.off('call-ended', handleCallEnded);
      };
  }, [socket]);

  // --- NEW HANDLERS FOR MANAGING CALLS ---

  const handleAcceptCall = () => {
      if (incomingCall) {
          setActiveCall(incomingCall); // Promote the incoming call to an active call
          setIncomingCall(null); // Hide the toast
      }
  };

  const handleDeclineCall = () => {
      // Optional: you can emit a 'call-declined' event to the caller here
      if (incomingCall?.from) {
        socket.emit('end-call', { to: incomingCall.from._id });
      }
      setIncomingCall(null);
  };

  const handleStartCall = (otherUser) => {
      // This function will be called from ChatPage to start a call
      setActiveCall({ to: otherUser, from: null, isReceivingCall: false });
  };
  
  const handleEndCall = () => {
      setActiveCall(null);
  };
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
          <Outlet context={{ handleStartCall }}/>
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
      <IncomingCallToast 
          callDetails={incomingCall}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
      />
      {activeCall && (
          <VideoCallModal 
              callDetails={activeCall}
              onClose={handleEndCall}
          />
      )}
    </div>
  );
};

export default AppLayout;
import React from 'react';
import { Outlet } from 'react-router-dom';

const MeetLayout = () => {
  // This component simply renders the child route, allowing it to take up the full screen.
  return (
    <div className="w-full h-screen">
      <Outlet />
    </div>
  );
};

export default MeetLayout;
import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Topbar from "../Topbar/Topbar";
import "./AppLayout.css";

export const AppLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="mrdc-app-layout">
      {/* Dynamic Collapsible Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area with Royal Blue Bubbles Atmosphere */}
      <div className="mrdc-main-wrapper">
        <div className="app-bg-decor" aria-hidden="true" />
        <div className="app-bg-bubble-1" aria-hidden="true" />
        <div className="app-bg-bubble-2" aria-hidden="true" />
        <div className="app-bg-bubble-3" aria-hidden="true" />
        <div className="app-bg-bubble-4" aria-hidden="true" />
        <div className="app-bg-bubble-5" aria-hidden="true" />

        <Topbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        <main className="mrdc-content-area" id="main-content" role="main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

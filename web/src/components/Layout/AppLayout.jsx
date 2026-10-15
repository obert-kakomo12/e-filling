import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import { Menu } from "lucide-react";
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

        {/* Mobile menu toggle button for small screens */}
        <button
          type="button"
          className="mrdc-mobile-nav-toggle"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <main className="mrdc-content-area" id="main-content" role="main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

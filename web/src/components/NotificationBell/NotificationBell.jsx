import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Bell,
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  Layers,
  Archive,
  Check,
} from "lucide-react";
import "./NotificationBell.css";

// Initial demo notifications tailored to council operations
const DEFAULT_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Document Awaiting HOD Approval",
    description: "Ref: MRDC/CET/2026/0014 — Road Rehabilitation Progress Log submitted by Engineering.",
    time: "10 mins ago",
    category: "approval",
    unread: true,
    targetUrl: "/vault",
    targetRole: ["hod", "sysadmin", "ceo"],
  },
  {
    id: "notif-2",
    title: "Cross-Functional Action Flagged",
    description: "IT Asset Depreciation Report routed to Finance & Procurement for hardware renewal.",
    time: "45 mins ago",
    category: "routing",
    unread: true,
    targetUrl: "/vault",
    targetRole: ["specialized_officer", "hod", "ceo", "sysadmin"],
  },
  {
    id: "notif-3",
    title: "Council Resolution Published",
    description: "MRDC/ADM/2026/0002 — Annual Rural Water Sanitation Policy officially published.",
    time: "2 hours ago",
    category: "approved",
    unread: false,
    targetUrl: "/vault",
    targetRole: ["councilor", "clerk", "hod", "ceo", "auditor", "sysadmin"],
  },
  {
    id: "notif-4",
    title: "Fiscal Year Archive Notice",
    description: "SysAdmin initiated scheduled archive indexation for FY2025 records.",
    time: "1 day ago",
    category: "system",
    unread: false,
    targetUrl: "/archive",
    targetRole: ["sysadmin", "auditor"],
  },
];

export const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const containerRef = useRef(null);

  // Filter notifications for the current user's role
  useEffect(() => {
    if (!user) return;
    const userRole = user.role || "clerk";
    const relevant = DEFAULT_NOTIFICATIONS.filter(
      (n) => !n.targetRole || n.targetRole.includes(userRole)
    );
    setNotifications(relevant);
  }, [user]);

  // Click outside listener to dismiss popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleItemClick = (item) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    );
    setIsOpen(false);
    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "approval":
        return <Clock size={16} />;
      case "routing":
        return <Layers size={16} />;
      case "approved":
        return <CheckCircle size={16} />;
      case "system":
        return <Archive size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <div className="notif-bell-container" ref={containerRef}>
      <button
        type="button"
        className={`notif-bell-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Council Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notif-unread-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notif-popover" role="dialog" aria-label="Notifications Panel">
          <div className="notif-header">
            <div className="notif-title-wrap">
              <span className="notif-title">In-App Alerts</span>
              {unreadCount > 0 && (
                <span className="notif-count-tag">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-mark-read-btn"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <Bell size={24} style={{ opacity: 0.3 }} />
                <span>No alerts for your department</span>
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`notif-item ${item.unread ? "unread" : ""}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className={`notif-icon-wrap notif-icon-${item.category}`}>
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="notif-content">
                    <span className="notif-item-title">{item.title}</span>
                    <span className="notif-item-desc">{item.description}</span>
                    <span className="notif-item-time">{item.time}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="notif-footer">
            <span>In-App alerts only • Internal MRDC workflow engine</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OptigainDumbell from "../assets/react3.svg";
import {
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/clerk-react";
import "../styles/ActionBar.css";

const ResponsiveActionBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation items - abbreviated labels for mobile
  const navItems = [
    { 
      path: "/", 
      label: "Home",
      mobileLabel: "Home",
      icon: "🏠"
    },
    { 
      path: "/workout-plan", 
      label: "Workout Plans",
      mobileLabel: "Plans",
      icon: "📋"
    },
    { 
      path: "/library-page", 
      label: "Exercise Library",
      mobileLabel: "Library",
      icon: "📚"
    },
    { 
      path: "/freestyle-lift", 
      label: "Quick Lift",
      mobileLabel: "Quick",
      icon: "⚡"
    },
  ];

  return (
    <div className="action-bar">
      <div className="action-bar-container">
        {/* Logo and Brand */}
        <div className="brand-section" onClick={() => navigate("/")}>
          <img
            src={OptigainDumbell}
            alt="Optigains Logo"
            className="brand-logo"
          />
          <h1 className="brand-name">{isMobile ? "OG" : "Optigains"}</h1>
        </div>

        {/* Navigation */}
        <nav className="nav-section">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              title={item.label}
            >
              {isMobile && <span className="nav-icon">{item.icon}</span>}
              <span className="nav-label">
                {isMobile ? item.mobileLabel : item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="user-section">
          {!isMobile && (
            <button
              onClick={() => navigate("/settings")}
              className="settings-button"
              title="Settings"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m3.22-10.22l4.24-4.24m-4.24 13.68l4.24 4.24M1 12h6m6 0h6m-10.22 3.22l-4.24 4.24m13.68-4.24l4.24 4.24"></path>
              </svg>
            </button>
          )}
          
          <SignedIn>
            <UserButton />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="sign-in-button">
                {isMobile ? "Sign In" : "Sign In"}
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveActionBar;
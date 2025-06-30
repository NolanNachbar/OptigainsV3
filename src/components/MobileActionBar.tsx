import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import OptigainDumbell from "../assets/react3.svg";
import {
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/clerk-react";

const MobileActionBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Navigation items with icons
  const navItems = [
    { 
      path: "/", 
      label: "Home",
      icon: "🏠"
    },
    { 
      path: "/workout-plan", 
      label: "Plans",
      icon: "📋"
    },
    { 
      path: "/library-page", 
      label: "Library",
      icon: "📚"
    },
    { 
      path: "/freestyle-lift", 
      label: "Quick",
      icon: "⚡"
    },
  ];

  const currentPage = navItems.find(item => item.path === location.pathname) || navItems[0];

  return (
    <>
      {/* Top Bar */}
      <div className="mobile-action-bar">
        <div className="mobile-action-bar-container">
          {/* Logo */}
          <div className="mobile-brand" onClick={() => navigate("/")}>
            <img
              src={OptigainDumbell}
              alt="Optigains"
              className="mobile-brand-logo"
            />
          </div>

          {/* Current Page */}
          <div className="mobile-current-page">
            <span className="mobile-page-icon">{currentPage.icon}</span>
            <span className="mobile-page-label">{currentPage.label}</span>
          </div>

          {/* Menu Button */}
          <button
            className="mobile-menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="mobile-menu-content" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-menu-header">
              <h2>Menu</h2>
              <button
                className="mobile-menu-close"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="mobile-menu-nav">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMenuOpen(false);
                  }}
                  className={`mobile-menu-item ${
                    location.pathname === item.path ? "active" : ""
                  }`}
                >
                  <span className="mobile-menu-icon">{item.icon}</span>
                  <span className="mobile-menu-label">{item.label}</span>
                  {location.pathname === item.path && (
                    <span className="mobile-menu-check">✓</span>
                  )}
                </button>
              ))}
            </nav>

            <div className="mobile-menu-divider"></div>

            {/* User Section */}
            <div className="mobile-menu-user">
              <button
                onClick={() => {
                  navigate("/settings");
                  setIsMenuOpen(false);
                }}
                className="mobile-menu-item"
              >
                <span className="mobile-menu-icon">⚙️</span>
                <span className="mobile-menu-label">Settings</span>
              </button>

              <div className="mobile-menu-auth">
                <SignedIn>
                  <div className="mobile-user-button">
                    <UserButton />
                  </div>
                </SignedIn>

                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="mobile-sign-in-button">Sign In</button>
                  </SignInButton>
                </SignedOut>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar (Alternative Option) */}
      <div className="mobile-tab-bar">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`mobile-tab-item ${
              location.pathname === item.path ? "active" : ""
            }`}
          >
            <span className="mobile-tab-icon">{item.icon}</span>
            <span className="mobile-tab-label">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default MobileActionBar;
import React from "react";
import { useNavigate } from "react-router-dom";
import OptigainDumbell from "../assets/react3.svg";
import {
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/clerk-react"; // Import Clerk components

const ActionBar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.5rem 1.5rem", // Adjust padding for a smaller bar
        backgroundColor: "#333",
        color: "#fff",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000, // Keeps it on top
      }}
    >
      {/* SVG Icon with onClick to navigate to home */}
      <img
        src={OptigainDumbell}
        alt="Optigain Dumbell Logo"
        style={{
          width: "30px", // Scale down the icon
          height: "30px", // Scale down the icon
          marginRight: "1rem", // Space between icon and app name
          cursor: "pointer", // Make it look clickable
        }}
        onClick={() => navigate("/")} // Navigate to home on click
      />

      {/* App Name */}
      <h1
        style={{
          margin: 0,
          fontSize: "1.25rem", // Reduce font size of app name
          fontWeight: "normal", // Optional: makes it less bold if needed
        }}
      >
        Optigains
      </h1>

      {/* Clerk Authentication and Settings */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Settings Button */}
        <button
          onClick={() => navigate("/settings")}
          style={{
            background: "transparent",
            border: "1px solid #666",
            borderRadius: "6px",
            padding: "0.4rem 0.8rem",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#444";
            e.currentTarget.style.borderColor = "#888";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#666";
          }}
        >
          Settings
        </button>
        
        {/* Show UserButton if signed in */}
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>

        {/* Show SignInButton if signed out */}
        <SignedOut>
          <SignInButton mode="modal" />
        </SignedOut>
      </div>
    </div>
  );
};

export default ActionBar;

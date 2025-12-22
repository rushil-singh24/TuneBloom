import { NavLink } from "react-router-dom";
import { Home, Heart, User, Flame, Rss } from "lucide-react";

export default function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        backgroundColor: "#0f172a",
        borderTop: "1px solid #1e293b",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 50,
      }}
    >
      <NavLink to="/" style={linkStyle}>
        <Home size={22} />
        <span style={labelStyle}>Discover</span>
      </NavLink>

      <NavLink to="/favorites" style={linkStyle}>
        <Heart size={22} />
        <span style={labelStyle}>Likes</span>
      </NavLink>

      <NavLink to="/trending" style={linkStyle}>
        <Flame size={22} />
        <span style={labelStyle}>Trending</span>
      </NavLink>

      <NavLink to="/feed" style={linkStyle}>
        <Rss size={22} />
        <span style={labelStyle}>Feed</span>
      </NavLink>

      <NavLink to="/profile" style={linkStyle}>
        <User size={22} />
        <span style={labelStyle}>Profile</span>
      </NavLink>
    </nav>
  );
}

const linkStyle = {
  color: "#cbd5f5",
  textDecoration: "none",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  fontSize: "12px",
  gap: "4px",
};

const labelStyle = {
  fontSize: "11px",
};

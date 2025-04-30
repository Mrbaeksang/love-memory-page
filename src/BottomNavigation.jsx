import React from "react";
import { FaHome, FaRegImage, FaHeart, FaMapMarkedAlt, FaBookReader } from "react-icons/fa";
import "./BottomNavigation.css";

const BottomNavigation = ({ onHome, onMemories, onLoveType, onTravelMap, onGuestbook }) => {
  return (
    <nav className="bottom-nav">
      <button className="bottom-nav-btn" onClick={onHome} aria-label="Home">
        <FaHome size={22} />
        <span>Home</span>
      </button>
      <button className="bottom-nav-btn" onClick={onMemories} aria-label="Memories">
        <FaRegImage size={22} />
        <span>Memories</span>
      </button>
      <button className="bottom-nav-btn" onClick={onLoveType} aria-label="LoveType">
        <FaHeart size={22} />
        <span>LoveType</span>
      </button>
      <button className="bottom-nav-btn" onClick={onTravelMap} aria-label="Travel map">
        <FaMapMarkedAlt size={22} />
        <span>Travel map</span>
      </button>
      <button className="bottom-nav-btn" onClick={onGuestbook} aria-label="Guestbook">
        <FaBookReader size={22} />
        <span>Guestbook</span>
      </button>
    </nav>
  );
};

export default BottomNavigation;

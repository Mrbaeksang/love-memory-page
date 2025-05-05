import React from "react";
import {
  FaHome,
  FaRegImage,
  FaHeart,
  FaMapMarkedAlt,
  FaBookReader,
} from "react-icons/fa";
import "./BottomNavigation.css";

const BottomNavigation = ({
  currentPage,
  onHome,
  onMemories,
  onLoveType,
  onTravelMap,
  onGuestbook,
}) => {
  return (
    <nav className="bottom-nav">
      <button
        className={`bottom-nav-btn${currentPage === "home" ? " active" : ""}`}
        onClick={onHome}
        aria-label="Home"
      >
        <FaHome size={22} />
        <span>Home</span>
      </button>

      <button
        className={`bottom-nav-btn${currentPage === "memories" ? " active" : ""}`}
        onClick={onMemories}
        aria-label="Memories"
      >
        <FaRegImage size={22} />
        <span>Memories</span>
      </button>

      <button
        className={`bottom-nav-btn${currentPage === "lovetype" ? " active" : ""}`}
        onClick={onLoveType}
        aria-label="LoveType"
      >
        <FaHeart size={22} />
        <span>LoveType</span>
      </button>

      <button
        className={`bottom-nav-btn${currentPage === "travelmap" ? " active" : ""}`}
        onClick={onTravelMap}
        aria-label="Travel map"
      >
        <FaMapMarkedAlt size={22} />
        <span>Travel map</span>
      </button>

      <button
        className={`bottom-nav-btn${currentPage === "guestbook" ? " active" : ""}`}
        onClick={onGuestbook}
        aria-label="Guestbook"
      >
        <FaBookReader size={22} />
        <span>Guestbook</span>
      </button>
    </nav>
  );
};

export default BottomNavigation;

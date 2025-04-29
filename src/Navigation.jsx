import React from "react";
import { FaHome, FaImages, FaHeart, FaCommentDots } from "react-icons/fa";
import "./Navigation.css";

const Navigation = ({ onHome, onMemories, onLoveType, onComment }) => {
  return (
    <nav className="navigation-bar">
      <button className="nav-btn" onClick={onHome}><FaHome className="nav-ico" /><span>Home</span></button>
      <button className="nav-btn" onClick={onMemories}><FaImages className="nav-ico" /><span>Memories</span></button>
      <button className="nav-btn" onClick={onLoveType}><FaHeart className="nav-ico" /><span>LoveType</span></button>
      <button className="nav-btn" onClick={onComment}><FaCommentDots className="nav-ico" /><span>Comment</span></button>
    </nav>
  );
};

export default Navigation;

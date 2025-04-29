import React from "react";
import { FaHeart } from "react-icons/fa";
import "./HomeHero.css";

const HomeHero = () => {
  return (
    <div className="home-hero-modern fadein-up">
      <div className="hero-title-row">
        <span className="hero-title">혜은&nbsp;<FaHeart className="hero-heart"/>&nbsp;상현</span>
      </div>
      <div className="hero-date">2025.01.01 ing</div>
    </div>
  );
};

export default HomeHero;

import React from "react";
import { FaHeart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import RandomImage from "../RandomImage";
import GalleryPreview from "../components/GalleryPreview";

// 📆 D-Day 계산
function getDDay() {
  const startDate = new Date(2025, 0, 1);
  const today = new Date();
  const diff = today.setHours(0, 0, 0, 0) - startDate.setHours(0, 0, 0, 0);
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

// 🎉 기념일 계산
function getAnniversaries() {
  const startDate = new Date(2025, 0, 1);
  const items = [
    { label: "100일", addDays: 99 },
    { label: "200일", addDays: 199 },
    { label: "300일", addDays: 299 },
    { label: "1주년", addDays: 365 },
  ];
  const week = ["일", "월", "화", "수", "목", "금", "토"];
  return items.map(({ label, addDays }) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + addDays);
    return {
      label,
      dateStr: `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`,
      dayOfWeek: `(${week[d.getDay()]})`,
    };
  });
}

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-bg-section">
      <div className="home-card">
        {/* 📸 메인 이미지 */}
        <div className="hero-photo-wrap">
          <img src="/1.jpg" alt="커플 메인" className="hero-photo" />
        </div>

        {/* 🌈 랜덤 이미지 */}
        <RandomImage />

        {/* 🕰️ D-Day 정보 */}
        <div className="home-d-day-info">
          <span className="home-d-date">2025년 1월 1일 ~</span>
          <span className="home-d-count">
            함께한 지 <b>D+{getDDay()}</b>
          </span>
        </div>

        {/* 🎉 기념일 목록 */}
        <div className="home-anniversary-list-plain">
          {getAnniversaries().map(({ label, dateStr, dayOfWeek }) => (
            <div className="home-anniv-row-plain" key={label}>
              <span className="home-anniv-label">{label}</span>
              <span className="home-anniv-date">{dateStr}</span>
              <span className="home-anniv-day">{dayOfWeek}</span>
            </div>
          ))}
        </div>

        {/* 💕 타이틀 */}
        <div className="hero-title-row">
          <span className="hero-title">
            혜은&nbsp;<FaHeart className="hero-heart" />&nbsp;상현
          </span>
        </div>

        <div className="home-calligraphy">우리, 사랑이 쌓이는 시간</div>
        <div className="home-date-caption">2025년 1월 1일, 우리의 시작</div>
      </div>

      {/* 📷 썸네일 미리보기 */}
      <GalleryPreview />

      {/* 📂 전체 갤러리 버튼 */}
      <div className="gallery-button-wrap" style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <button
          onClick={() => navigate("/gallery")}
          className="full-gallery-button"
          style={{
            padding: "0.7rem 1.4rem",
            fontSize: "1rem",
            background: "#ffe4ec",
            color: "#444",
            border: "1px solid #ffafcc",
            borderRadius: "12px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          📂 전체 갤러리 보기
        </button>
      </div>
    </div>
  );
};

export default Home;

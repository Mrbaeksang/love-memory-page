import React from "react";
import { FaHeart } from "react-icons/fa";
import "./Home.css";

// D-Day 계산 함수
function getDDay() {
  const startDate = new Date(2025, 0, 1); // 2025-01-01, 월은 0부터 시작
  const today = new Date();
  const diff = today.setHours(0,0,0,0) - startDate.setHours(0,0,0,0);
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

// 기념일 계산 함수
function getAnniversaries() {
  const startDate = new Date(2025, 0, 1); // 2025-01-01
  const items = [
    { label: "100일", addDays: 99 },
    { label: "200일", addDays: 199 },
    { label: "300일", addDays: 299 },
    { label: "1주년", addDays: 365 }, // 정확히 1년 후
  ];
  const week = ["일", "월", "화", "수", "목", "금", "토"];
  return items.map(({ label, addDays }) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + addDays);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const dayOfWeek = week[d.getDay()];
    return {
      label,
      dateStr: `${year}년 ${month}월 ${date}일`,
      dayOfWeek,
    };
  });
}

const Home = () => {
  return (
    <div className="home-bg-section">
      <div className="home-card">
        <div className="hero-photo-wrap">
          {/* 사진 파일은 public/1.jpg 또는 public/images/1.jpg로 넣어주세요 */}
          <img src="/1.jpg" alt="커플 메인" className="hero-photo" />
        </div>
        <div className="home-d-day-info">
          <span className="home-d-date">2025년 1월 1일 ~</span>
          <span className="home-d-count">함께한 지 <b>D+{getDDay()}</b></span>
        </div>
        <div className="home-anniversary-list-plain">
          {getAnniversaries().map(item => (
            <div className="home-anniv-row-plain" key={item.label}>
              <span className="home-anniv-label">{item.label}</span>
              <span className="home-anniv-date">{item.dateStr}</span>
              <span className="home-anniv-day">({item.dayOfWeek})</span>
            </div>
          ))}
        </div>
        <div className="hero-title-row">
          <span className="hero-title">혜은&nbsp;<FaHeart className="hero-heart"/>&nbsp;상현</span>
        </div>
        <div className="home-calligraphy">우리, 사랑이 쌓이는 시간</div>
        <div className="home-date-caption">2025년 1월 1일, 우리의 시작</div>
      </div>
    </div>
  );
};

export default Home;

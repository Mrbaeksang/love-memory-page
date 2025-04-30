import React from "react";
import "./Memories.css";
import { galleryFileMap } from "./galleryFileMap";
import { useNavigate } from "react-router-dom";
import RandomImage from "../RandomImage";

// 연/월 데이터 동적 생성
const years = Object.keys(galleryFileMap).sort((a, b) => b - a);

const Memories = () => {
  const navigate = useNavigate();

  return (
    <div className="memories-container">
      <button className="back-home-btn" onClick={() => navigate("/")}>← 홈으로</button>
      <RandomImage />
      <div className="memories-thumbnail-grid">
        {years.map(year =>
          Object.keys(galleryFileMap[year] || {})
            .filter(month => galleryFileMap[year][month].length > 0)
            .sort()
            .map(month => (
              <div
                key={`${year}-${month}`}
                className="memories-thumb-card"
                onClick={() => navigate(`/gallery/${year}/${month}`)}
              >
                <img
                  src={`/gallery/${galleryFileMap[year][month][0]}`}
                  alt={`${year}년 ${month}월 썸네일`}
                  className="memories-thumb-img"
                  loading="lazy"
                />
                <span className="memories-thumb-label">{year}.{month}</span>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Memories;

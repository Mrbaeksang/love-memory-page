// src/components/RandomCommentedImageButton.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import "./RandomCommentedImageButton.css"; // 버튼 스타일 유지

const RandomCommentedImageButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/comment"); // ✅ 댓글 이미지 모아놓은 페이지로 이동
  };

  return (
    <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
      <button
        onClick={handleClick}
        className="gallery-random-comment-btn"
      >
        💬 댓글 달린 사진 보기
      </button>
    </div>
  );
};

export default RandomCommentedImageButton;

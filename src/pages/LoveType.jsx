import React from "react";
import { useNavigate } from "react-router-dom";
import "./LoveType.css";
import RandomImage from "../RandomImage";
import usePageLogger from "../hooks/usePageLogger"; // ✅ 추가



// 예시 설문 결과 데이터
const myType = {
  name: "상현",
  type: "ENTP",
  description: "열정적이고 창의적인 아이디어 뱅크! 언제나 긍정적이고 새로운 시도를 즐깁니다.",
  loveStyle: "재미와 대화를 중시하며, 자유롭고 유쾌한 연애를 선호해요.",
};

const gfType = {
  name: "혜은",
  type: "ENFJ",
  description: "따뜻하고 리더십이 있는 타입! 상대방을 잘 배려하고 이끌어 줍니다.",
  loveStyle: "함께하는 시간을 소중히 여기고, 애정 표현을 아끼지 않아요.",
};

const LoveType = () => {
  usePageLogger();
  
  const navigate = useNavigate();

  return (
    <div className="lovetype-container">
      <button className="back-home-btn" onClick={() => navigate("/")}>← 홈으로</button>
      <h2>우리의 연애 타입</h2>
      <RandomImage />
      <div className="type-cards-horizontal">
        <div className="type-card type-card-flex">
          <h3>{myType.name}</h3>
          <p><b>성향:</b> {myType.type}</p>
          <p>{myType.description}</p>
          <p><b>연애스타일:</b> {myType.loveStyle}</p>
          <button className="lovetype-detail-btn" onClick={() => navigate("/lovetype/sanghyun")}>자세히 알아보기</button>
        </div>
        <div className="type-card type-card-flex">
          <h3>{gfType.name}</h3>
          <p><b>성향:</b> {gfType.type}</p>
          <p>{gfType.description}</p>
          <p><b>연애스타일:</b> {gfType.loveStyle}</p>
          <button className="lovetype-detail-btn" onClick={() => navigate("/lovetype/hyeeun")}>자세히 알아보기</button>
        </div>
      </div>
    </div>
  );
};

export default LoveType;

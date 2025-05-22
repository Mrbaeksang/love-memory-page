import React from "react"; // React 라이브러리 임포트
import { useNavigate } from "react-router-dom"; // 페이지 이동을 위한 useNavigate 훅 임포트
import "./LoveType.css"; // 컴포넌트 스타일시트 임포트
import RandomImage from "../RandomImage"; // 랜덤 이미지 컴포넌트 임포트
import usePageLogger from "../hooks/usePageLogger"; // 페이지 로거 훅 임포트 (로그인 여부 확인용)

// 예시 설문 결과 데이터 - 상현의 연애 타입 정보
const myType = {
  name: "상현", // 이름
  type: "ENTP", // MBTI 타입
  description: "열정적이고 창의적인 아이디어 뱅크! 언제나 긍정적이고 새로운 시도를 즐깁니다.", // 성향 설명
  loveStyle: "재미와 대화를 중시하며, 자유롭고 유쾌한 연애를 선호해요.", // 연애 스타일
};

// 예시 설문 결과 데이터 - 혜은의 연애 타입 정보
const gfType = {
  name: "혜은", // 이름
  type: "ENFJ", // MBTI 타입
  description: "따뜻하고 리더십이 있는 타입! 상대방을 잘 배려하고 이끌어 줍니다.", // 성향 설명
  loveStyle: "함께하는 시간을 소중히 여기고, 애정 표현을 아끼지 않아요.", // 연애 스타일
};

// LoveType 컴포넌트 정의
const LoveType = () => {
  usePageLogger(); // 페이지 접근 시 로그인 상태를 기록하는 훅 사용

  const navigate = useNavigate(); // 페이지 이동을 위한 navigate 함수 초기화

  return (
    <div className="lovetype-container"> {/* 전체 연애 타입 페이지 컨테이너 */}
      
      <h2>우리의 연애 타입</h2> {/* 페이지 제목 */}
      <RandomImage /> {/* 랜덤 이미지 컴포넌트 표시 */}
      
      {/* 두 개의 연애 타입 카드 가로 정렬을 위한 컨테이너 */}
      <div className="type-cards-horizontal">
        {/* 상현의 연애 타입 카드 */}
        <div className="type-card type-card-flex">
          <h3>{myType.name}</h3> {/* 이름 */}
          <p><b>성향:</b> {myType.type}</p> {/* 성향 (MBTI) */}
          <p>{myType.description}</p> {/* 성향 설명 */}
          <p><b>연애스타일:</b> {myType.loveStyle}</p> {/* 연애 스타일 */}
          {/* '자세히 알아보기' 버튼 - 클릭 시 상현의 상세 연애 타입 페이지로 이동 */}
          <button className="lovetype-detail-btn" onClick={() => navigate("/lovetype/sanghyun")}>자세히 알아보기</button>
        </div>
        
        {/* 혜은의 연애 타입 카드 */}
        <div className="type-card type-card-flex">
          <h3>{gfType.name}</h3> {/* 이름 */}
          <p><b>성향:</b> {gfType.type}</p> {/* 성향 (MBTI) */}
          <p>{gfType.description}</p> {/* 성향 설명 */}
          <p><b>연애스타일:</b> {gfType.loveStyle}</p> {/* 연애 스타일 */}
          {/* '자세히 알아보기' 버튼 - 클릭 시 혜은의 상세 연애 타입 페이지로 이동 */}
          <button className="lovetype-detail-btn" onClick={() => navigate("/lovetype/hyeeun")}>자세히 알아보기</button>
        </div>
      </div>
    </div>
  );
};

export default LoveType; // LoveType 컴포넌트 내보내기
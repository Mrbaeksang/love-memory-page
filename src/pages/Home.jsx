import React from "react"; // React 라이브러리 임포트
import { FaHeart } from "react-icons/fa"; // react-icons 라이브러리에서 하트 아이콘 임포트
import { useNavigate } from "react-router-dom"; // 페이지 이동을 위한 useNavigate 훅 임포트
import { FaDice } from "react-icons/fa"; // react-icons 라이브러리에서 주사위 아이콘 임포트 (현재 코드에서는 사용되지 않음)

import "./Home.css"; // 컴포넌트 스타일시트 임포트
import RandomImage from "../RandomImage"; // 랜덤 이미지 컴포넌트 임포트
import GalleryPreview from "../components/GalleryPreview"; // 갤러리 미리보기 컴포넌트 임포트

// 📆 D-Day 계산 함수
function getDDay() {
  const startDate = new Date(2025, 0, 1); // 시작 날짜 (2025년 1월 1일) 설정
  const today = new Date(); // 오늘 날짜 설정
  // 시작 날짜와 오늘 날짜의 자정 기준 차이 계산 (밀리초 단위)
  const diff = today.setHours(0, 0, 0, 0) - startDate.setHours(0, 0, 0, 0);
  // 밀리초를 일(day)로 변환 후, 올림하여 함께한 날짜 계산 (시작일을 1일로 포함)
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

// 🎉 기념일 리스트 가져오는 함수
function getAnniversaries() {
  const startDate = new Date(2025, 0, 1); // 시작 날짜 (2025년 1월 1일) 설정
  // 기념일 목록 정의: 각 기념일의 이름과 시작일로부터 더할 일수
  const items = [
    { label: "100일", addDays: 99 }, // 100일째 되는 날은 99일이 지난 후
    { label: "200일", addDays: 199 },
    { label: "300일", addDays: 299 },
    { label: "1주년", addDays: 365 }, // 1주년은 365일이 지난 후
  ];
  const week = ["일", "월", "화", "수", "목", "금", "토"]; // 요일 배열 정의

  // 각 기념일에 대해 날짜를 계산하고 포맷하여 반환
  return items.map(({ label, addDays }) => {
    const d = new Date(startDate); // 시작 날짜를 기준으로 새로운 Date 객체 생성
    d.setDate(d.getDate() + addDays); // 기념일에 해당하는 일수 추가
    return {
      label, // 기념일 이름
      dateStr: `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`, // 'YYYY년 MM월 DD일' 형식의 날짜 문자열
      dayOfWeek: `(${week[d.getDay()]})`, // '요일' 문자열
    };
  });
}

// Home 컴포넌트 정의
const Home = () => {
  const navigate = useNavigate(); // 페이지 이동을 위한 navigate 함수 초기화

  return (
    <div className="home-bg-section"> {/* 홈 페이지 전체 배경 섹션 */}
      <div className="home-card"> {/* 홈 카드 컨테이너 (주요 내용 포함) */}
        
        {/* 📸 커플 메인 이미지 - 클릭 시 '/random' 페이지로 이동 */}
        <div
          className="hero-photo-wrap" // 이미지 래퍼 스타일 클래스
          onClick={() => navigate("/random")} // 클릭 시 '/random' 경로로 이동
          style={{ cursor: "pointer" }} // 마우스 커서를 포인터로 변경하여 클릭 가능함을 나타냄
        >
          <img
            src="/1.jpg" // 이미지 소스 경로
            alt="커플 메인" // 이미지 대체 텍스트
            className="hero-photo" // 이미지 스타일 클래스
          />
        </div>

        {/* 🌈 랜덤 이미지 컴포넌트 */}
        <RandomImage />

        {/* 🕰️ 함께한 날짜 정보 */}
        <div className="home-d-day-info">
          <span className="home-d-date">2025년 1월 1일 ~</span> {/* 시작 날짜 표시 */}
          <span className="home-d-count">
            함께한 지 <b>D+{getDDay()}</b> {/* D-Day 계산 결과 표시 */}
          </span>
        </div>

        {/* 🎊 기념일 목록 */}
        <div className="home-anniversary-list-plain">
          {/* getAnniversaries 함수를 호출하여 기념일 목록을 매핑 */}
          {getAnniversaries().map(({ label, dateStr, dayOfWeek }) => (
            <div className="home-anniv-row-plain" key={label}> {/* 각 기념일 행 */}
              <span className="home-anniv-label">{label}</span> {/* 기념일 이름 */}
              <span className="home-anniv-date">{dateStr}</span> {/* 기념일 날짜 */}
              <span className="home-anniv-day">{dayOfWeek}</span> {/* 기념일 요일 */}
            </div>
          ))}
        </div>

        {/* 💖 커플 타이틀 */}
        <div className="hero-title-row">
          <span className="hero-title">
            혜은&nbsp;<FaHeart className="hero-heart" />&nbsp;상현 {/* 하트 아이콘 포함 커플 이름 */}
          </span>
        </div>

        {/* ✍️ 캘리그라피 문구 */}
        <div className="home-calligraphy">우리, 사랑이 쌓이는 시간</div>
        {/* 날짜 캡션 */}
        <div className="home-date-caption">2025년 1월 1일, 우리의 시작</div>
      </div>

      {/* 🖼️ 썸네일 갤러리 미리보기 컴포넌트 */}
      <GalleryPreview />

      {/* ⬇️ 하단 간격 확보 (음악 플레이어와 겹치지 않게) */}
      <div style={{ height: "16px" }} />

      {/* 아래 코드는 현재 false로 설정되어 렌더링되지 않음 */}
      {false && ( 
        <>
          {/* 📂 전체 갤러리 이동 버튼 (현재 비활성화) */}
          <div
            className="gallery-button-wrap"
            style={{
              textAlign: "center", // 텍스트 가운데 정렬
              marginTop: "1.5rem", // 위쪽 외부 여백
              marginBottom: "100px", // 아래쪽 외부 여백 (음악 플레이어와의 겹침 방지)
            }}
          >
            <button
              onClick={() => navigate("/gallery")} // 클릭 시 '/gallery' 경로로 이동
              className="full-gallery-button" // 버튼 스타일 클래스
              style={{
                padding: "0.7rem 1.4rem", // 내부 여백
                fontSize: "1rem", // 글자 크기
                background: "#ffe4ec", // 배경색
                color: "#444", // 글자색
                border: "1px solid #ffafcc", // 테두리
                borderRadius: "12px", // 테두리 모서리 둥글게
                fontWeight: "600", // 글자 굵기
                cursor: "pointer", // 마우스 오버 시 커서 모양 변경
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)", // 그림자 효과
              }}
            >
              📂 전체 갤러리 보기
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Home; // Home 컴포넌트 내보내기
import React from "react";
// react-icons 라이브러리에서 필요한 아이콘들을 임포트합니다.
import {
  FaHome, // 홈 아이콘
  FaRegImage, // 이미지 아이콘 (Memories)
  FaHeart, // 하트 아이콘 (LoveType)
  FaMapMarkedAlt, // 지도 마커 아이콘 (Travel Map)
  FaBookReader, // 책 읽는 사람 아이콘 (Guestbook)
} from "react-icons/fa";
import "./BottomNavigation.css"; // 컴포넌트의 스타일을 정의하는 CSS 파일을 임포트합니다.

/**
 * 하단 내비게이션 바 컴포넌트입니다.
 * 현재 활성화된 페이지를 `currentPage` prop으로 받아 해당 버튼을 강조하고,
 * 각 버튼 클릭 시 호출될 콜백 함수들을 prop으로 받습니다.
 *
 * @param {Object} props - 컴포넌트에 전달되는 props
 * @param {string} props.currentPage - 현재 활성화된 페이지를 나타내는 문자열 ("home", "memories", "lovetype", "travelmap", "guestbook")
 * @param {function} props.onHome - 홈 버튼 클릭 시 호출될 함수
 * @param {function} props.onMemories - Memories 버튼 클릭 시 호출될 함수
 * @param {function} props.onLoveType - LoveType 버튼 클릭 시 호출될 함수
 * @param {function} props.onTravelMap - Travel Map 버튼 클릭 시 호출될 함수
 * @param {function} props.onGuestbook - Guestbook 버튼 클릭 시 호출될 함수
 */
const BottomNavigation = ({
  currentPage, // 현재 활성화된 페이지
  onHome, // 홈 버튼 클릭 핸들러
  onMemories, // Memories 버튼 클릭 핸들러
  onLoveType, // LoveType 버튼 클릭 핸들러
  onTravelMap, // Travel Map 버튼 클릭 핸들러
  onGuestbook, // Guestbook 버튼 클릭 핸들러
}) => {
  return (
    // 최하단에 고정될 내비게이션 바 컨테이너
    <nav className="bottom-nav">
      {/* 홈 버튼 */}
      <button
        // currentPage prop에 따라 'active' 클래스를 동적으로 추가하여 스타일을 적용합니다.
        className={`bottom-nav-btn${currentPage === "home" ? " active" : ""}`}
        onClick={onHome} // 클릭 시 onHome 함수 호출
        aria-label="Home" // 스크린 리더를 위한 접근성 레이블
      >
        <FaHome size={22} /> {/* 홈 아이콘, 크기 22px */}
        <span>Home</span> {/* 버튼 텍스트 */}
      </button>

      {/* Memories 버튼 */}
      <button
        className={`bottom-nav-btn${currentPage === "memories" ? " active" : ""}`}
        onClick={onMemories} // 클릭 시 onMemories 함수 호출
        aria-label="Memories"
      >
        <FaRegImage size={22} /> {/* 이미지 아이콘 */}
        <span>Memories</span>
      </button>

      {/* LoveType 버튼 */}
      <button
        className={`bottom-nav-btn${currentPage === "lovetype" ? " active" : ""}`}
        onClick={onLoveType} // 클릭 시 onLoveType 함수 호출
        aria-label="LoveType"
      >
        <FaHeart size={22} /> {/* 하트 아이콘 */}
        <span>LoveType</span>
      </button>

      {/* Travel Map 버튼 */}
      <button
        className={`bottom-nav-btn${currentPage === "travelmap" ? " active" : ""}`}
        onClick={onTravelMap} // 클릭 시 onTravelMap 함수 호출
        aria-label="Travel map"
      >
        <FaMapMarkedAlt size={22} /> {/* 지도 마커 아이콘 */}
        <span>Travel map</span>
      </button>

      {/* Guestbook 버튼 */}
      <button
        className={`bottom-nav-btn${currentPage === "guestbook" ? " active" : ""}`}
        onClick={onGuestbook} // 클릭 시 onGuestbook 함수 호출
        aria-label="Guestbook"
      >
        <FaBookReader size={22} /> {/* 책 읽는 사람 아이콘 */}
        <span>Guestbook</span>
      </button>
    </nav>
  );
};

export default BottomNavigation; // BottomNavigation 컴포넌트를 내보냅니다.
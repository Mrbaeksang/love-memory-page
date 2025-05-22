import React, { useRef, useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import usePushNotifications from "./hooks/usePushNotifications"; // 푸시 알림 관련 커스텀 훅
import { supabase } from "./lib/supabaseClient"; // Supabase 클라이언트 인스턴스
import { getAnonId } from "./utils/getAnonId"; // 익명 사용자 ID를 가져오는 유틸리티 함수

// 📄 페이지 컴포넌트들을 임포트합니다.
import Home from "./pages/Home";
import Memories from "./pages/Memories";
import LoveType from "./pages/LoveType";
import TravelMap from "./pages/TravelMap";
import Guestbook from "./components/Guestbook";
import GalleryMonth from "./pages/GalleryMonth";
import FullGallery from "./pages/FullGallery";
import GalleryUpload from "./components/GalleryUpload";
import LoveTypeDetail from "./pages/LoveTypeDetail";
import CommentGalleryPage from "./pages/CommentGalleryPage";
import CommentDetailPage from "./pages/CommentDetailPage";
import AdminThumbnailFill from "./pages/AdminThumbnailFill";
import RandomSelectorPage from "./pages/RandomSelectorPage";
import TravelMapPhotoGalleryPage from "./pages/TravelMapPhotoGalleryPage";
import AccessRequestPage from "./pages/AccessRequestPage"; // 접근 요청 페이지
import AdminAccessPage from "./pages/AdminAccessPage"; // 관리자 접근 페이지

// 📦 공통 UI 컴포넌트들을 임포트합니다.
import BottomNavigation from "./BottomNavigation"; // 하단 내비게이션 바
import ScrollToTop from "./components/ScrollToTop"; // 페이지 상단으로 스크롤하는 컴포넌트
import MusicPlayer from "./components/MusicPlayer"; // 음악 플레이어

// 🎨 글로벌 스타일 및 컴포넌트별 스타일을 임포트합니다.
import "./App.css";
import "./fadein.css";
import "./components/Guestbook.css";

// ✅ 관리자 user_id 목록을 정의합니다. (접근 제어에 사용)
const adminIds = [
  "user_e8qi23kz90",
  "user_urwlrjw5gf",
  "user_4js94343ce",
];

// ✅ 페이지 뷰를 로깅하는 커스텀 훅입니다.
function useLogPageView() {
  const location = useLocation(); // React Router의 useLocation 훅을 사용하여 현재 경로 정보를 가져옵니다.
  useEffect(() => {
    // 현재 페이지 경로, 이전 페이지 URL(Referer), 익명 사용자 ID를 가져옵니다.
    const page = location.pathname;
    const referer = document.referrer || ""; // Referer가 없을 경우 빈 문자열로 설정
    const userId = getAnonId();

    // '/api/log-visit' 엔드포인트로 방문 기록을 전송합니다.
    fetch("/api/log-visit", {
      method: "POST", // POST 요청
      headers: { "Content-Type": "application/json" }, // JSON 형식으로 데이터 전송
      body: JSON.stringify({ page, referer, anon_user_id: userId }), // 전송할 데이터
    }).catch((err) => console.error("방문자 기록 실패:", err)); // 에러 발생 시 콘솔에 출력
  }, [location.pathname]); // location.pathname이 변경될 때마다 이 효과를 다시 실행합니다.
}

// ✅ 앱 접근을 제어하는 커스텀 훅입니다.
function useAccessControl() {
  const navigate = useNavigate(); // React Router의 useNavigate 훅을 사용하여 페이지 이동을 제어합니다.
  // 상태 훅: 현재 사용자가 접근이 허용되었는지 여부를 저장합니다. 초기값은 null (확인 중)입니다.
  const [isAllowed, setIsAllowed] = useState(null);

  useEffect(() => {
    /**
     * 사용자 접근 권한을 확인하는 비동기 함수입니다.
     */
    const checkAccess = async () => {
      const userId = getAnonId(); // 현재 기기의 익명 사용자 ID를 가져옵니다.
      console.log("🧾 현재 기기의 user_id:", userId); // 콘솔에 사용자 ID를 로깅합니다.

      // 'allowed_users' 테이블에서 현재 user_id와 일치하는 레코드를 조회합니다.
      const { data } = await supabase
        .from("allowed_users")
        .select("user_id")
        .eq("user_id", userId)
        .single(); // 단일 결과만 기대합니다.

      // 데이터가 존재하면 접근을 허용하고, 그렇지 않으면 접근 요청 페이지로 리디렉션합니다.
      if (data) {
        setIsAllowed(true); // 접근 허용 상태로 설정
      } else {
        setIsAllowed(false); // 접근 불허 상태로 설정
        navigate("/access-request"); // 접근 요청 페이지로 이동
      }
    };

    checkAccess(); // 컴포넌트 마운트 시 접근 권한 확인을 시작합니다.
  }, [navigate]); // navigate 함수가 변경될 때마다 이 효과를 다시 실행합니다.

  return isAllowed; // 접근 허용 여부 상태를 반환합니다.
}

function App() {
  const userId = getAnonId(); // 현재 기기의 익명 사용자 ID를 가져옵니다.
  const isAllowed = useAccessControl(); // 접근 제어 훅을 사용하여 접근 권한을 확인합니다.
  usePushNotifications(userId); // 푸시 알림 훅을 초기화합니다.
  useLogPageView(); // 페이지 뷰 로깅 훅을 초기화합니다.

  // useRef 훅: 각 섹션에 대한 참조를 생성하여 스크롤 이동에 사용합니다.
  const homeRef = useRef(null);
  const memoriesRef = useRef(null);
  const loveTypeRef = useRef(null);
  const travelMapRef = useRef(null);
  const guestbookRef = useRef(null);

  /**
   * 특정 섹션으로 부드럽게 스크롤하는 함수입니다.
   * @param {Object} ref 스크롤할 섹션의 ref 객체
   */
  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" }); // 해당 요소로 부드럽게 스크롤
    }
  };

  // isAllowed 상태가 null인 경우 (접근 확인 중) 로딩 메시지를 표시합니다.
  if (isAllowed === null) return <div>접근 확인 중...</div>;

  return (
    <div className="app-root">
      <ScrollToTop /> {/* 페이지 상단으로 스크롤하는 버튼을 제공하는 컴포넌트 */}
      <div className="app-bg">
        <div className="app-main-container">
          {/* React Router의 Routes 컴포넌트를 사용하여 경로에 따라 다른 컴포넌트를 렌더링합니다. */}
          <Routes>
            {/* 메인 페이지 경로 ('/') */}
            <Route
              path="/"
              element={
                <>
                  {/* Home 섹션 */}
                  <section ref={homeRef} className="section-fullvh section-home">
                    {/* Home 컴포넌트에 Memories 섹션으로 스크롤하는 함수를 prop으로 전달 */}
                    <Home onMemories={() => scrollToSection(memoriesRef)} />
                  </section>
                  {/* Memories 섹션 */}
                  <section ref={memoriesRef} className="section-fullvh section-memories">
                    <Memories />
                  </section>
                  {/* LoveType 섹션 */}
                  <section ref={loveTypeRef} className="section-fullvh section-lovetype">
                    <LoveType />
                  </section>
                  {/* TravelMap 섹션 */}
                  <section ref={travelMapRef} className="section-fullvh section-travelmap">
                    <TravelMap />
                  </section>
                  {/* Guestbook 섹션 */}
                  <section ref={guestbookRef} className="section-fullvh section-guestbook">
                    <Guestbook />
                  </section>
                  {/* 하단 내비게이션 바 */}
                  <BottomNavigation
                    onHome={() => scrollToSection(homeRef)}
                    onMemories={() => scrollToSection(memoriesRef)}
                    onLoveType={() => scrollToSection(loveTypeRef)}
                    onTravelMap={() => scrollToSection(travelMapRef)}
                    onGuestbook={() => scrollToSection(guestbookRef)}
                  />
                </>
              }
            />
            {/* 갤러리 월별 보기 경로 */}
            <Route path="/gallery/:year/:month" element={<GalleryMonth />} />
            {/* 전체 갤러리 보기 경로 */}
            <Route path="/gallery" element={<FullGallery />} />
            {/* 갤러리 업로드 경로 */}
            <Route path="/upload" element={<GalleryUpload />} />
            {/* 댓글 갤러리 페이지 경로 */}
            <Route path="/comment" element={<CommentGalleryPage />} />
            {/* 댓글 상세 페이지 경로 */}
            <Route path="/comment-detail" element={<CommentDetailPage />} />
            {/* 방명록 페이지 경로 */}
            <Route path="/guestbook" element={<Guestbook />} />
            {/* 관리자 썸네일 채우기 페이지 경로 */}
            <Route path="/admin-thumbnail-fill" element={<AdminThumbnailFill />} />
            {/* 러브 타입 상세 페이지 (상현) 경로 */}
            <Route path="/lovetype/sanghyun" element={<LoveTypeDetail who="sanghyun" />} />
            {/* 러브 타입 상세 페이지 (혜은) 경로 */}
            <Route path="/lovetype/hyeeun" element={<LoveTypeDetail who="hyeeun" />} />
            {/* 여행 지도 사진 갤러리 페이지 경로 */}
            <Route path="/travel-map/photos/:markerId" element={<TravelMapPhotoGalleryPage />} />
            {/* 랜덤 선택기 페이지 경로 */}
            <Route path="/random" element={<RandomSelectorPage />} />
            {/* 접근 요청 페이지 경로 */}
            <Route path="/access-request" element={<AccessRequestPage />} />
            {/* 관리자 접근 페이지 경로: adminIds에 userId가 포함되어 있을 때만 AdminAccessPage를 렌더링합니다. */}
            <Route
              path="/admin-access"
              element={
                adminIds.includes(userId) ? ( // 현재 userId가 adminIds 목록에 포함되어 있는지 확인
                  <AdminAccessPage /> // 관리자 ID라면 AdminAccessPage 렌더링
                ) : (
                  // 관리자 ID가 아니라면 접근 권한 없음 메시지 표시
                  <div style={{ padding: "2rem", textAlign: "center" }}>
                    ⛔ 접근 권한이 없습니다.
                  </div>
                )
              }
            />
          </Routes>
        </div>
      </div>
      <MusicPlayer /> {/* 앱 전체에 음악 플레이어를 렌더링합니다. */}
    </div>
  );
}

export default App;
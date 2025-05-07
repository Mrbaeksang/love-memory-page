import React, { useRef, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import usePushNotifications from "./hooks/usePushNotifications";


// 🧭 페이지 컴포넌트
import Home from "./pages/Home";
import Memories from "./pages/Memories";
import LoveType from "./pages/LoveType";
import TravelMap from "./pages/TravelMap";
import Guestbook from "./components/Guestbook";

// 🖼 갤러리 관련
import GalleryMonth from "./pages/GalleryMonth";
import FullGallery from "./pages/FullGallery";
import GalleryUpload from "./components/GalleryUpload";

// 💕 러브타입 상세
import LoveTypeDetail from "./pages/LoveTypeDetail";

// 💬 댓글 이미지
import CommentGalleryPage from "./pages/CommentGalleryPage";
import CommentDetailPage from "./pages/CommentDetailPage";

// 🔧 관리자 페이지
import AdminThumbnailFill from "./pages/AdminThumbnailFill";

// 🧭 공통 컴포넌트
import BottomNavigation from "./BottomNavigation";
import ScrollToTop from "./components/ScrollToTop";
import MusicPlayer from "./components/MusicPlayer"; // 🎵 음악 플레이어

// 🎨 스타일
import "./App.css";
import "./fadein.css";
import "./components/Guestbook.css";

function App() {
  // 섹션 참조
  const homeRef = useRef(null);
  const memoriesRef = useRef(null);
  const loveTypeRef = useRef(null);
  const travelMapRef = useRef(null);
  const guestbookRef = useRef(null);

  // 방문자 기록
  useEffect(() => {
    fetch("/api/log-visit").catch((err) =>
      console.error("방문자 기록 실패:", err)
    );
  }, []);

  usePushNotifications("hyeeun"); // or "sanghyun" 등
  // 푸시 알림 수신


  // 스크롤 이동
  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="app-root">
      <ScrollToTop />
      <div className="app-bg">
        <div className="app-main-container">
          <Routes>
            {/* 🏠 메인 스크롤 구조 */}
            <Route
              path="/"
              element={
                <>
                  <section
                    ref={homeRef}
                    id="home"
                    className="section-fullvh section-home"
                  >
                    <Home onMemories={() => scrollToSection(memoriesRef)} />
                  </section>

                  <section
                    ref={memoriesRef}
                    id="memories"
                    className="section-fullvh section-memories"
                  >
                    <Memories />
                  </section>

                  <section
                    ref={loveTypeRef}
                    id="lovetype"
                    className="section-fullvh section-lovetype"
                  >
                    <LoveType />
                  </section>

                  <section
                    ref={travelMapRef}
                    id="travelmap"
                    className="section-fullvh section-travelmap"
                  >
                    <TravelMap />
                  </section>

                  <section
                    ref={guestbookRef}
                    id="guestbook"
                    className="section-fullvh section-guestbook"
                  >
                    <Guestbook />
                  </section>

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

            {/* 📂 개별 라우트들 */}
            <Route path="/gallery/:year/:month" element={<GalleryMonth />} />
            <Route path="/gallery" element={<FullGallery />} />
            <Route path="/upload" element={<GalleryUpload />} />
            <Route path="/comment" element={<CommentGalleryPage />} />
            <Route path="/comment-detail" element={<CommentDetailPage />} />
            <Route path="/guestbook" element={<Guestbook />} />
            <Route path="/admin-thumbnail-fill" element={<AdminThumbnailFill />} />
            <Route path="/lovetype/sanghyun" element={<LoveTypeDetail who="sanghyun" />} />
            <Route path="/lovetype/hyeeun" element={<LoveTypeDetail who="hyeeun" />} />
          </Routes>
        </div>
      </div>

      {/* 🎵 음악 플레이어는 항상 하단 고정 */}
      <MusicPlayer />
    </div>
  );
}

export default App;

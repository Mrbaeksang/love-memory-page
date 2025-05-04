import React, { useRef, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Memories from "./pages/Memories";
import LoveType from "./pages/LoveType";
import GalleryMonth from "./pages/GalleryMonth";
import LoveTypeDetail from "./pages/LoveTypeDetail";
import TravelMap from "./pages/TravelMap";
import BottomNavigation from "./BottomNavigation";
import Guestbook from "./components/Guestbook";
import GalleryUpload from "./components/GalleryUpload";
import ScrollToTop from "./components/ScrollToTop";

import CommentGalleryPage from "./pages/CommentGalleryPage";
import CommentDetailPage from "./pages/CommentDetailPage";
import AdminThumbnailFill from "./pages/AdminThumbnailFill";

// ✅ 전체 썸네일 보기 페이지 추가
import FullGallery from "./pages/FullGallery";

import "./App.css";
import "./fadein.css";
import "./components/Guestbook.css";

function App() {
  const homeRef = useRef(null);
  const memoriesRef = useRef(null);
  const loveTypeRef = useRef(null);
  const travelMapRef = useRef(null);
  const guestbookRef = useRef(null);

  useEffect(() => {
    fetch("/api/log-visit").catch((err) =>
      console.error("방문자 기록 실패:", err)
    );
  }, []);

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleGuestbook = () => {
    scrollToSection(guestbookRef);
  };

  return (
    <div className="app-bg">
      <div className="app-main-container">
        <ScrollToTop />

        <Routes>
          {/* 🏠 메인 풀페이지 */}
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
                  onGuestbook={handleGuestbook}
                />
              </>
            }
          />

          {/* 📂 월별 갤러리 진입 */}
          <Route path="/gallery/:year/:month" element={<GalleryMonth />} />

          {/* ✅ 전체 썸네일 보기 경로 */}
          <Route path="/gallery" element={<FullGallery />} />

          {/* 📤 사진 업로드 */}
          <Route path="/upload" element={<GalleryUpload />} />

          {/* 💕 러브타입 상세 */}
          <Route path="/lovetype/sanghyun" element={<LoveTypeDetail who="sanghyun" />} />
          <Route path="/lovetype/hyeeun" element={<LoveTypeDetail who="hyeeun" />} />

          {/* 💬 댓글 이미지 */}
          <Route path="/comment" element={<CommentGalleryPage />} />
          <Route path="/comment-detail" element={<CommentDetailPage />} />

          {/* 📝 방명록 별도 진입 */}
          <Route path="/guestbook" element={<Guestbook />} />

          {/* 🔧 관리자용 썸네일 생성 */}
          <Route path="/admin-thumbnail-fill" element={<AdminThumbnailFill />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

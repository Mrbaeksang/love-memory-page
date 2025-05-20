import React, { useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import usePushNotifications from "./hooks/usePushNotifications";

// 🧭 페이지 컴포넌트
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

import TravelMapPhotoGalleryPage from "./pages/TravelMapPhotoGalleryPage"; 

// 🧭 공통 컴포넌트
import BottomNavigation from "./BottomNavigation";
import ScrollToTop from "./components/ScrollToTop";
import MusicPlayer from "./components/MusicPlayer";

// 🎨 스타일
import "./App.css";
import "./fadein.css";
import "./components/Guestbook.css";

// ✅ 고유 유저 ID 생성 함수
function getOrCreateUserId() {
  let userId = localStorage.getItem("local_user_id");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substring(2, 12);
    localStorage.setItem("local_user_id", userId);
  }
  return userId;
}

// ✅ 방문자 추적 훅
function useLogPageView() {
  const location = useLocation();

  React.useEffect(() => {
    const page = location.pathname;
    const referer = document.referrer || "";
    const userId = getOrCreateUserId();

    fetch("/api/log-visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page,
        referer,
        anon_user_id: userId,
      }),
    }).catch((err) => console.error("방문자 기록 실패:", err));
  }, [location.pathname]);
}

function App() {
  const userId = getOrCreateUserId(); // 푸시 알림용
  usePushNotifications(userId);
  useLogPageView(); // ✅ 라우트 방문 기록

  const homeRef = useRef(null);
  const memoriesRef = useRef(null);
  const loveTypeRef = useRef(null);
  const travelMapRef = useRef(null);
  const guestbookRef = useRef(null);

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
            <Route
              path="/"
              element={
                <>
                  <section ref={homeRef} className="section-fullvh section-home">
                    <Home onMemories={() => scrollToSection(memoriesRef)} />
                  </section>
                  <section ref={memoriesRef} className="section-fullvh section-memories">
                    <Memories />
                  </section>
                  <section ref={loveTypeRef} className="section-fullvh section-lovetype">
                    <LoveType />
                  </section>
                  <section ref={travelMapRef} className="section-fullvh section-travelmap">
                    <TravelMap />
                  </section>
                  <section ref={guestbookRef} className="section-fullvh section-guestbook">
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
            <Route path="/gallery/:year/:month" element={<GalleryMonth />} />
            <Route path="/gallery" element={<FullGallery />} />
            <Route path="/upload" element={<GalleryUpload />} />
            <Route path="/comment" element={<CommentGalleryPage />} />
            <Route path="/comment-detail" element={<CommentDetailPage />} />
            <Route path="/guestbook" element={<Guestbook />} />
            <Route path="/admin-thumbnail-fill" element={<AdminThumbnailFill />} />
            <Route path="/lovetype/sanghyun" element={<LoveTypeDetail who="sanghyun" />} />
            <Route path="/lovetype/hyeeun" element={<LoveTypeDetail who="hyeeun" />} />
            <Route path="/travel-map/photos/:markerId" element={<TravelMapPhotoGalleryPage />} />
          </Routes>
        </div>
      </div>
      <MusicPlayer />
    </div>
  );
}

export default App;

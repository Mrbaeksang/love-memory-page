import React, { useRef, useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import usePushNotifications from "./hooks/usePushNotifications";
import { supabase } from "./lib/supabaseClient";
import { getAnonId } from "./utils/getAnonId";

// 📄 페이지 컴포넌트
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
import AccessRequestPage from "./pages/AccessRequestPage";
import AdminAccessPage from "./pages/AdminAccessPage";

// 📦 공통 UI
import BottomNavigation from "./BottomNavigation";
import ScrollToTop from "./components/ScrollToTop";
import MusicPlayer from "./components/MusicPlayer";

// 🎨 스타일
import "./App.css";
import "./fadein.css";
import "./components/Guestbook.css";

// ✅ 관리자 user_id 목록
const adminIds = [
  "user_e8qi23kz90",
  "user_urwlrjw5gf",
  "user_4js94343ce",
];

// ✅ 방문자 추적 훅
function useLogPageView() {
  const location = useLocation();
  useEffect(() => {
    const page = location.pathname;
    const referer = document.referrer || "";
    const userId = getAnonId();

    fetch("/api/log-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, referer, anon_user_id: userId }),
    }).catch((err) => console.error("방문자 기록 실패:", err));
  }, [location.pathname]);
}

// ✅ 접근 제어 훅
function useAccessControl() {
  const navigate = useNavigate();
  const [isAllowed, setIsAllowed] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      const userId = getAnonId();
      console.log("🧾 현재 기기의 user_id:", userId);

      const { data } = await supabase
        .from("allowed_users")
        .select("user_id")
        .eq("user_id", userId)
        .single();

      if (data) {
        setIsAllowed(true);
      } else {
        setIsAllowed(false);
        navigate("/access-request");
      }
    };

    checkAccess();
  }, [navigate]);

  return isAllowed;
}

function App() {
  const userId = getAnonId();
  const isAllowed = useAccessControl();
  usePushNotifications(userId);
  useLogPageView();

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

  if (isAllowed === null) return <div>접근 확인 중...</div>;

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
            <Route path="/random" element={<RandomSelectorPage />} />
            <Route path="/access-request" element={<AccessRequestPage />} />
            <Route
              path="/admin-access"
              element={
                adminIds.includes(userId) ? (
                  <AdminAccessPage />
                ) : (
                  <div style={{ padding: "2rem", textAlign: "center" }}>
                    ⛔ 접근 권한이 없습니다.
                  </div>
                )
              }
            />
          </Routes>
        </div>
      </div>
      <MusicPlayer />
    </div>
  );
}

export default App;

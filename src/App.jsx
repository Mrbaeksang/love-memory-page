import React, { useRef } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Memories from "./pages/Memories";
import LoveType from "./pages/LoveType";
import GalleryMonth from "./pages/GalleryMonth";
import LoveTypeDetail from "./pages/LoveTypeDetail";
import TravelMap from "./pages/TravelMap";
import BottomNavigation from "./BottomNavigation";
import "./App.css";
import "./fadein.css";

function App() {
  const homeRef = useRef(null);
  const memoriesRef = useRef(null);
  const loveTypeRef = useRef(null);
  const travelMapRef = useRef(null);

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="app-bg">
      <div className="app-main-container">
        <Routes>
          <Route path="/" element={
            <>
              <section ref={homeRef} id="home" className="section-fullvh section-home"><Home onMemories={() => scrollToSection(memoriesRef)} /*onComment={() => scrollToSection(commentRef)}*/ /></section>
              <section ref={memoriesRef} id="memories" className="section-fullvh section-memories"><Memories /></section>
              <section ref={loveTypeRef} id="lovetype" className="section-fullvh section-lovetype"><LoveType /></section>
              <section ref={travelMapRef} id="travelmap" className="section-fullvh section-travelmap"><TravelMap /></section>
              {/* <section ref={commentRef} id="comment" className="section-fullvh section-comment"><Comment /></section> */}
              <BottomNavigation
                onHome={() => scrollToSection(homeRef)}
                onMemories={() => scrollToSection(memoriesRef)}
                onLoveType={() => scrollToSection(loveTypeRef)}
                onTravelMap={() => scrollToSection(travelMapRef)}
              />
            </>
          } />
          <Route path="/gallery/:year/:month" element={<GalleryMonth />} />
          <Route path="/lovetype/sanghyun" element={<LoveTypeDetail who="sanghyun" />} />
          <Route path="/lovetype/hyeeun" element={<LoveTypeDetail who="hyeeun" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

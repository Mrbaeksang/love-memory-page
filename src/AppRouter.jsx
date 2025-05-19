import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import LoveType from "./pages/LoveType";
import GalleryMonth from "./pages/GalleryMonth";
import Memories from "./pages/Memories";
import Comment from "./pages/Comment";
import TravelMapPhotoGalleryPage from "./pages/TravelMapPhotoGalleryPage";

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/memories" element={<Memories />} />
    <Route path="/gallery/:year/:month" element={<GalleryMonth />} />
    <Route path="/lovetype" element={<LoveType />} />
    <Route path="/comment" element={<Comment />} />
    <Route path="/travel-map/photos/:markerId" element={<TravelMapPhotoGalleryPage />} />
  </Routes>
);

export default AppRouter;

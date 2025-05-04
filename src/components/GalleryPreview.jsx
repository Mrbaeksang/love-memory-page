import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "./GalleryPreview.css";

const GalleryPreview = () => {
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllImages = async () => {
      const randomImages = [];

      const { data: folders } = await supabase.storage.from("gallery").list("", { limit: 100 });
      if (!folders) return;

      for (const yearFolder of folders) {
        if (!yearFolder.name.match(/^\d{4}$/)) continue;

        const { data: months } = await supabase.storage
          .from("gallery")
          .list(yearFolder.name, { limit: 100 });

        for (const monthFolder of months || []) {
          if (!monthFolder.name.match(/^\d{2}$/)) continue;

          const { data: files } = await supabase.storage
            .from("gallery")
            .list(`${yearFolder.name}/${monthFolder.name}`, { limit: 100 });

          (files || []).forEach((file) => {
            const url = supabase.storage
              .from("gallery")
              .getPublicUrl(`${yearFolder.name}/${monthFolder.name}/${file.name}`).data.publicUrl;

            randomImages.push(url);
          });
        }
      }

      const shuffled = randomImages.sort(() => 0.5 - Math.random());
      setImages(shuffled.slice(0, 6));
    };

    fetchAllImages();
  }, []);

  const handleClick = (url) => {
    navigate(`/comment-detail?img=${encodeURIComponent(url)}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="gallery-preview-section">
      <h2 className="preview-title">📸 우리의 추억</h2>
      <div className="gallery-preview-grid">
        {images.map((url, idx) => (
          <div
            key={idx}
            className="preview-img-card"
            onClick={() => handleClick(url)} // ✅ 클릭 시 이동 추가
            style={{ cursor: "pointer" }}
          >
            <img src={url} alt={`preview-${idx}`} className="preview-img" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryPreview;

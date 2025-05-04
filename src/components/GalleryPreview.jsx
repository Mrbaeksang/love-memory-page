import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "./GalleryPreview.css";

const GalleryPreview = () => {
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllImages = async () => {
      const allImages = [];

      const { data: years } = await supabase.storage.from("gallery").list("", { limit: 100 });
      for (const year of years || []) {
        if (!year.name.match(/^\d{4}$/)) continue;

        const { data: months } = await supabase.storage
          .from("gallery")
          .list(year.name, { limit: 100 });

        for (const month of months || []) {
          if (!month.name.match(/^\d{2}$/)) continue;

          const { data: files } = await supabase.storage
            .from("gallery")
            .list(`${year.name}/${month.name}`, { limit: 100 });

          for (const file of files || []) {
            const thumbPath = `thumb/${year.name}/${month.name}/${file.name}`;
            const originPath = `${year.name}/${month.name}/${file.name}`;

            const thumbUrl = supabase.storage.from("gallery").getPublicUrl(thumbPath).data.publicUrl;
            const originalUrl = supabase.storage.from("gallery").getPublicUrl(originPath).data.publicUrl;

            allImages.push({
              thumb: thumbUrl,
              original: originalUrl,
            });
          }
        }
      }

      const shuffled = allImages.sort(() => 0.5 - Math.random());
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
        {images.map((img, idx) => (
          <div
            key={idx}
            className="preview-img-card"
            onClick={() => handleClick(img.original)}
            style={{ cursor: "pointer" }}
          >
            <img
              src={img.thumb}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = img.original;
              }}
              alt={`preview-${idx}`}
              className="preview-img"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryPreview;

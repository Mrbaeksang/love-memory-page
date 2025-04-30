import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./GalleryPreview.css";

const GalleryPreview = () => {
  const [images, setImages] = useState([]);

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

  return (
    <div className="gallery-preview-section">
      <h2 className="preview-title">📸 우리의 추억</h2>
      <div className="gallery-preview-grid">
        {images.map((url, idx) => (
          <div key={idx} className="preview-img-card">
            <img src={url} alt={`preview-${idx}`} className="preview-img" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryPreview;

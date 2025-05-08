// src/components/MarkerImageModal.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "./MarkerImageModal.css";

export default function MarkerImageModal({ markerId, onClose }) {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!markerId) return;
    (async () => {
      const { data, error } = await supabase
        .from("travel_marker_images")
        .select("image_url")
        .eq("marker_id", markerId)
        .order("created_at", { ascending: false });
      if (!error) setImages(data || []);
      setLoading(false);
    })();
  }, [markerId]);

  if (!markerId) return null;

  return (
    <div className="image-modal-overlay">
      <div className="image-modal-content">
        <div className="image-modal-header">
          <h3>📸 관련 이미지</h3>
          <button className="close-btn" onClick={onClose}>닫기</button>
        </div>
        {loading ? (
          <p className="loading">불러오는 중...</p>
        ) : images.length === 0 ? (
          <p className="empty">해당 마커에 연결된 이미지가 없습니다.</p>
        ) : (
          <div className="image-grid">
            {images.map((img, i) => (
              <img
                key={i}
                src={img.image_url}
                alt="marker-related"
                onClick={() => navigate(`/comment-detail?img=${encodeURIComponent(img.image_url)}&marker=${markerId}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

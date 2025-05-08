// src/components/MarkerImageUploadModal.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./MarkerImageUploadModal.css";

export default function MarkerImageUploadModal({ markerId, onClose }) {
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!imageFile || !markerId) return;
    setUploading(true);

    const filename = `${markerId}_${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("travel-images")
      .upload(filename, imageFile);

    if (uploadError) {
      alert("업로드 실패");
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("travel-images")
      .getPublicUrl(filename);

    const publicUrl = publicUrlData.publicUrl;

    await supabase.from("travel_marker_images").insert({
      marker_id: markerId,
      image_url: publicUrl,
    });

    alert("이미지 업로드 완료!");
    setUploading(false);
    onClose();
  };

  return (
    <div className="image-upload-modal-overlay">
      <div className="image-upload-modal-content">
        <h3>📤 이미지 업로드</h3>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
        />
        <div className="upload-actions">
          <button disabled={!imageFile || uploading} onClick={handleUpload}>
            {uploading ? "업로드 중..." : "업로드"}
          </button>
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
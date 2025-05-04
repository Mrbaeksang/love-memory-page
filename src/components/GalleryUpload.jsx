import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import EXIF from "exif-js";
import { useNavigate } from "react-router-dom";

const GalleryUpload = () => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFiles = [...e.target.files];
    setFiles(selectedFiles);
    setStatus("");

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const getDateFromExif = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          EXIF.getData({ src: e.target.result }, function () {
            const date = EXIF.getTag(this, "DateTimeOriginal");
            resolve(date);
          });
        } catch (err) {
          resolve(null);
        }
      };
      reader.readAsArrayBuffer(file);
    });

  const getUploadInfo = async (file) => {
    const exifDate = await getDateFromExif(file);
    let year, month;

    if (exifDate) {
      const [datePart] = exifDate.split(" ");
      [year, month] = datePart.split(":");
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = String(now.getMonth() + 1).padStart(2, "0");
    }

    const timestamp = Date.now();
    const nameWithoutExt = file.name.split(".")[0].replace(/[^a-z0-9_-]/gi, "").toLowerCase();
    const ext = file.name.split(".").pop().toLowerCase();
    const safeName = `${nameWithoutExt || "photo"}.${ext}`;

    return {
      originalPath: `${year}/${month}/${timestamp}_${safeName}`,
      thumbPath: `thumb/${year}/${month}/${timestamp}_${safeName}`,
    };
  };

  const createThumbnailBlob = (file) =>
    new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
  
      reader.onload = (e) => {
        img.src = e.target.result;
      };
  
      // 🛡️ 이미지 로딩 실패 시 대비 (모바일 대응)
      img.onerror = () => {
        console.error("❌ 이미지 로딩 실패:", file.name);
        resolve(null); // 실패 시 null 반환
      };
  
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
  
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
  
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
      };
  
      reader.readAsDataURL(file);
    });
  

    const uploadFiles = async () => {
      if (files.length === 0) return alert("📂 업로드할 파일을 선택하세요.");
    
      setUploading(true);
      setStatus("📤 업로드 중...");
    
      for (const file of files) {
        try {
          const { originalPath, thumbPath } = await getUploadInfo(file);
          const thumbBlob = await createThumbnailBlob(file);
    
          if (!thumbBlob) {
            console.warn("⚠️ 썸네일 생성 실패 (blob null):", file.name);
            continue; // 업로드 스킵하고 다음으로
          }
    
          const { error: error1 } = await supabase.storage
            .from("gallery")
            .upload(originalPath, file, { upsert: true });
    
          const { error: error2 } = await supabase.storage
            .from("gallery")
            .upload(thumbPath, thumbBlob, { upsert: true });
    
          if (error1 || error2) {
            console.error("❌ 업로드 실패:", error1 || error2);
            setStatus(`❌ ${file.name} 업로드 실패`);
            continue; // 실패한 파일만 넘기고 다음으로
          }
        } catch (err) {
          console.error("⚠️ 예외 발생:", err);
          setStatus(`❌ ${file.name} 처리 중 오류`);
          continue;
        }
      }
    
      setStatus("✅ 모든 파일 업로드 완료!");
      setUploading(false);
      setFiles([]);
      setPreviews([]);
    };
    

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <button
        onClick={() => navigate("/")}
        style={{
          background: "none",
          border: "none",
          color: "#ff8fa3",
          fontSize: "1.1rem",
          cursor: "pointer",
          marginBottom: "1rem",
        }}
      >
        ← 홈으로
      </button>

      <h2 style={{ marginBottom: "1rem" }}>📸 갤러리 사진 업로드</h2>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
        style={{ marginBottom: "1rem" }}
      />

      {previews.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          {previews.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`preview-${idx}`}
              style={{
                width: "90px",
                height: "90px",
                objectFit: "cover",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            />
          ))}
        </div>
      )}

      <button
        onClick={uploadFiles}
        disabled={uploading || files.length === 0}
        style={{
          padding: "0.6em 1.2em",
          background: "#ff9966",
          border: "none",
          borderRadius: "6px",
          color: "#fff",
          fontWeight: "bold",
          cursor: uploading ? "not-allowed" : "pointer",
        }}
      >
        {uploading ? "업로드 중..." : "✨ 업로드"}
      </button>

      {status && <p style={{ marginTop: "1rem", color: "#333" }}>{status}</p>}
    </div>
  );
};

export default GalleryUpload;

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

  const getUploadPath = async (file) => {
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

    return `${year}/${month}/${timestamp}_${safeName}`;
  };

  const uploadFiles = async () => {
    if (files.length === 0) return alert("📂 업로드할 파일을 선택하세요.");

    setUploading(true);
    setStatus("📤 업로드 중...");

    for (const file of files) {
      try {
        const path = await getUploadPath(file);
        const { error } = await supabase.storage.from("gallery").upload(path, file, {
          upsert: true,
        });

        if (error) {
          console.error("❌ 업로드 실패:", error);
          setStatus(`❌ ${file.name} 업로드 실패`);
          setUploading(false);
          return;
        }
      } catch (err) {
        console.error("⚠️ 예외 발생:", err);
        setStatus("❌ 예기치 못한 오류 발생");
        setUploading(false);
        return;
      }
    }

    setStatus("✅ 모든 파일 업로드 완료!");
    setUploading(false);
    setFiles([]);
    setPreviews([]);
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      {/* ← 홈으로 버튼 추가 */}
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

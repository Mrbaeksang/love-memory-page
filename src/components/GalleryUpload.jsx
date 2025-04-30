import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import EXIF from "exif-js";

const GalleryUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const getDateFromExif = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const buffer = e.target.result;
        EXIF.getData({ src: buffer }, function () {
          const date = EXIF.getTag(this, "DateTimeOriginal");
          resolve(date);
        });
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
    const safeName = file.name.replace(/\s+/g, "_").toLowerCase();

    return `gallery/${year}/${month}/${timestamp}_${safeName}`;
  };

  const uploadFiles = async () => {
    if (files.length === 0) return alert("업로드할 파일을 선택하세요.");

    setUploading(true);
    setStatus("📤 업로드 중...");

    for (const file of files) {
      const path = await getUploadPath(file);
      const { error } = await supabase.storage.from("gallery").upload(path, file);

      if (error) {
        console.error("업로드 실패:", error);
        setStatus(`❌ ${file.name} 업로드 실패`);
        setUploading(false);
        return;
      }
    }

    setStatus("✅ 모든 파일 업로드 완료!");
    setUploading(false);
    setFiles([]);
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>📸 갤러리 사진 업로드</h2>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
        style={{ marginBottom: "1rem" }}
      />
      <br />
      <button onClick={uploadFiles} disabled={uploading || files.length === 0}>
        {uploading ? "업로드 중..." : "✨ 업로드"}
      </button>
      <p>{status}</p>
    </div>
  );
};

export default GalleryUpload;

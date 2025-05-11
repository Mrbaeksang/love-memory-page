import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "./FullGallery.css"; // ✨ 스타일은 따로 관리
import usePageLogger from "../hooks/usePageLogger"; // ⬅ 이 줄 추가


const FullGallery = () => {
  usePageLogger();
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchThumbnails = async () => {
      const allThumbs = [];

      // ✅ "thumb/YYYY" 폴더부터 조회
      const { data: yearFolders, error: yearError } = await supabase.storage
        .from("gallery")
        .list("thumb", { limit: 100 });

      if (yearError) {
        console.error("❌ 연도 목록 조회 실패", yearError);
        return;
      }

      for (const year of yearFolders || []) {
        if (!/^\d{4}$/.test(year.name)) continue;

        const { data: monthFolders } = await supabase.storage
          .from("gallery")
          .list(`thumb/${year.name}`, { limit: 100 });

        for (const month of monthFolders || []) {
          if (!/^\d{2}$/.test(month.name)) continue;

          const { data: files } = await supabase.storage
            .from("gallery")
            .list(`thumb/${year.name}/${month.name}`, { limit: 100 });

          for (const file of files || []) {
            const path = `thumb/${year.name}/${month.name}/${file.name}`;
            const url = supabase.storage.from("gallery").getPublicUrl(path).data.publicUrl;

            allThumbs.push({
              url,
              fullPath: `${year.name}/${month.name}/${file.name}`,
            });
          }
        }
      }

      setThumbnails(allThumbs.reverse());
      setLoading(false);
    };

    fetchThumbnails();
  }, []);

  const handleClick = (fullPath) => {
    navigate(`/comment-detail?img=${encodeURIComponent(fullPath)}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="full-gallery-wrapper">
      {/* ✅ 홈으로 가기 버튼 */}
      <div className="gallery-back-button" onClick={() => navigate("/")}>
        ← 홈으로
      </div>

      <h2 className="full-gallery-title">📂 전체 추억 모아보기</h2>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <div className="full-gallery-grid">
          {thumbnails.map((thumb, idx) => (
            <div
              key={idx}
              className="thumb-card"
              onClick={() => handleClick(thumb.fullPath)}
            >
              <img src={thumb.url} alt={`thumb-${idx}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FullGallery;

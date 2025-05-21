import React, { useEffect, useState } from "react";
import "./Memories.css";
import { useNavigate } from "react-router-dom";
import RandomImage from "../RandomImage";
import { supabase } from "../lib/supabaseClient";
import RandomCommentedImageButton from "../components/RandomCommentedImageButton";
import usePageLogger from "../hooks/usePageLogger";


const Memories = () => {
  usePageLogger();

  const navigate = useNavigate();
  const [thumbnails, setThumbnails] = useState([]);

  useEffect(() => {
    const fetchThumbnails = async () => {
      const result = [];

      const { data: yearFolders, error } = await supabase.storage.from("gallery").list("", {
        limit: 100,
        offset: 0,
      });

      if (error) return console.error("연도 폴더 불러오기 실패", error);

      for (const year of yearFolders.filter(f => f.name.match(/^\d{4}$/))) {
        const { data: monthFolders } = await supabase.storage.from("gallery").list(`${year.name}`, {
          limit: 100,
          offset: 0,
        });

        for (const month of monthFolders.filter(f => f.name.match(/^\d{2}$/))) {
          const { data: imageFiles } = await supabase.storage.from("gallery").list(`${year.name}/${month.name}`, {
            limit: 1, // 첫 번째 이미지만 썸네일용
          });

          if (imageFiles && imageFiles.length > 0) {
            const thumbPath = `${year.name}/${month.name}/${imageFiles[0].name}`;
            const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(thumbPath);

            result.push({
              year: year.name,
              month: month.name,
              thumb: publicUrl,
            });
          }
        }
      }

      // 최신순 정렬
      result.sort((a, b) => b.year.localeCompare(a.year) || b.month.localeCompare(a.month));
      setThumbnails(result);
    };

    fetchThumbnails();
  }, []);

  return (
    <div className="memories-container">

  
      {/* 버튼 2개 세로 정렬 */}
      <div className="memories-top-button-group">
        <button className="upload-button" onClick={() => navigate("/upload")}>
          📤 사진 업로드
        </button>
        <RandomCommentedImageButton
          onSelect={(url) => {
            navigate(`/gallery/random?img=${encodeURIComponent(url)}`);
          }}
        />
      </div>
  
      <RandomImage />
  
      <div className="memories-thumbnail-grid">
        {thumbnails.map(({ year, month, thumb }) => (
          <div
            key={`${year}-${month}`}
            className="memories-thumb-card"
            onClick={() => navigate(`/gallery/${year}/${month}`)}
          >
            <img
              src={thumb}
              alt={`${year}년 ${month}월 썸네일`}
              className="memories-thumb-img"
              loading="lazy"
            />
            <span className="memories-thumb-label">{year}.{month}</span>
          </div>
        ))}
      </div>
    </div>
  );
};  
  

export default Memories;

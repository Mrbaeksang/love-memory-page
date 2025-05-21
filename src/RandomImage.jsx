import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import "./RandomImage.css";

const RandomImage = ({ style = {} }) => {
  const [thumbUrl, setThumbUrl] = useState(null);
  const [originUrl, setOriginUrl] = useState(null);
  const navigate = useNavigate();

  

  useEffect(() => {
    const fetchRandomThumbnail = async () => {
      try {
        const { data: folders, error: folderErr } = await supabase.storage
          .from("gallery")
          .list("", { limit: 100 });

        if (folderErr || !folders) {
          console.error("상위 폴더 에러:", folderErr);
          return;
        }

        const folderPaths = folders
          .filter(f => f.name && f.metadata === null)
          .map(f => f.name);

        let allFiles = [];

        for (const year of folderPaths) {
          const { data: months } = await supabase.storage
            .from("gallery")
            .list(year);

          const monthFolders = (months || [])
            .filter(m => m.name && m.metadata === null)
            .map(m => m.name);

          for (const month of monthFolders) {
            const { data: files } = await supabase.storage
              .from("gallery")
              .list(`${year}/${month}`);

            const imageFiles = (files || [])
              .filter(file => /\.(jpe?g|png|webp)$/i.test(file.name))
              .map(f => ({ year, month, name: f.name }));

            allFiles.push(...imageFiles);
          }
        }

        if (!allFiles.length) {
          console.warn("이미지를 찾을 수 없음.");
          return;
        }

        const random = allFiles[Math.floor(Math.random() * allFiles.length)];

        const thumbPath = `thumb/${random.year}/${random.month}/${random.name}`;
        const originPath = `${random.year}/${random.month}/${random.name}`;

        const thumb = supabase.storage.from("gallery").getPublicUrl(thumbPath).data?.publicUrl;
        const original = supabase.storage.from("gallery").getPublicUrl(originPath).data?.publicUrl;
        

        setThumbUrl(thumb || original); // fallback 처리
        setOriginUrl(original);
      } catch (err) {
        console.error("썸네일 로딩 에러:", err);
      }
    };

    fetchRandomThumbnail();
  }, []);

  const handleClick = () => {
    if (originUrl) {
      navigate(`/comment-detail?img=${encodeURIComponent(originUrl)}`);
      window.scrollTo(0, 0);
    }
  };

  return thumbUrl ? (
    <div className="lovetype-random-image-wrap">
      <img
        src={thumbUrl}
        alt="감성 랜덤 썸네일"
        className="lovetype-random-image clickable"
        style={style}
        loading="lazy"
        onClick={handleClick}
        onError={(e) => {
          // 썸네일 에러 시 원본으로 대체
          if (originUrl) e.target.src = originUrl;
        }}
      />
    </div>
  ) : null;
};

export default RandomImage;

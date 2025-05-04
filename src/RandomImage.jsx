import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";
import "./RandomImage.css";

const RandomImage = ({ style = {} }) => {
  const [url, setUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllAndPickRandom = async () => {
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
          const { data: months, error: monthErr } = await supabase.storage
            .from("gallery")
            .list(year);

          if (monthErr || !months) continue;

          const monthFolders = months
            .filter(m => m.name && m.metadata === null)
            .map(m => m.name);

          for (const month of monthFolders) {
            const { data: files, error: fileErr } = await supabase.storage
              .from("gallery")
              .list(`${year}/${month}`);

            if (fileErr || !files) continue;

            const imageFiles = files
              .filter(file => /\.(jpe?g|png|webp)$/i.test(file.name))
              .map(f => `${year}/${month}/${f.name}`);

            allFiles.push(...imageFiles);
          }
        }

        if (!allFiles.length) {
          console.warn("이미지를 찾을 수 없음.");
          return;
        }

        const randomPath = allFiles[Math.floor(Math.random() * allFiles.length)];
        const publicUrl = supabase.storage
          .from("gallery")
          .getPublicUrl(randomPath).data?.publicUrl;

        setUrl(publicUrl);
      } catch (err) {
        console.error("전체 이미지 가져오기 중 에러:", err);
      }
    };

    fetchAllAndPickRandom();
  }, []);

  const handleClick = () => {
    if (url) {
      navigate(`/comment-detail?img=${encodeURIComponent(url)}`);
      window.scrollTo(0, 0);
    }
  };

  return url ? (
    <div className="lovetype-random-image-wrap">
      <img
        src={url}
        alt="감성 랜덤 이미지"
        className="lovetype-random-image clickable"
        style={style}
        loading="lazy"
        onClick={handleClick} // ✅ 클릭 이벤트 추가
      />
    </div>
  ) : null;
};

export default RandomImage;

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

const RandomImage = ({ style = {} }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    const fetchAllAndPickRandom = async () => {
      try {
        // ✅ 최상위 폴더 목록 가져오기 (예: 2024, 2025)
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

        // ✅ 각 연도 → 각 월 → 이미지 파일들 수집
        for (const year of folderPaths) {
          const { data: months, error: monthErr } = await supabase.storage
            .from("gallery")
            .list(year);

          if (monthErr || !months) {
            console.warn(`"${year}" 폴더 오류`, monthErr);
            continue;
          }

          const monthFolders = months
            .filter(m => m.name && m.metadata === null)
            .map(m => m.name);

          for (const month of monthFolders) {
            const { data: files, error: fileErr } = await supabase.storage
              .from("gallery")
              .list(`${year}/${month}`);

            if (fileErr || !files) {
              console.warn(`"${year}/${month}" 폴더 오류`, fileErr);
              continue;
            }

            const imageFiles = files
              .filter(file => /\.(jpe?g|png|webp)$/i.test(file.name))
              .map(f => `${year}/${month}/${f.name}`);

            allFiles.push(...imageFiles);
          }
        }

        // ✅ 이미지가 없으면 리턴
        if (!allFiles.length) {
          console.warn("이미지를 찾을 수 없음.");
          return;
        }

        // ✅ 랜덤 경로 선택
        const randomPath = allFiles[Math.floor(Math.random() * allFiles.length)];

        // ✅ publicUrl 안전하게 꺼내기
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

  return url ? (
    <div className="lovetype-random-image-wrap">
      <img
        src={url}
        alt="감성 랜덤 이미지"
        className="lovetype-random-image"
        style={style}
        loading="lazy"
      />
    </div>
  ) : null;
};

export default RandomImage;

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AdminThumbnailFill = () => {
  const [status, setStatus] = useState("준비 중...");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const generateThumbnail = async (filePath, year, month, fileName) => {
      const { data, error } = await supabase.storage.from("gallery").download(filePath);
      if (error || !data) {
        console.warn("다운로드 실패:", filePath);
        return;
      }

      const imageBlob = data;
      const img = new Image();
      img.src = URL.createObjectURL(imageBlob);

      await new Promise((resolve) => {
        img.onload = () => resolve();
      });

      const canvas = document.createElement("canvas");
      const maxWidth = 300;
      const scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
      if (!blob) return;

      const thumbPath = `thumb/${year}/${month}/${fileName}`;
      const { error: uploadErr } = await supabase.storage.from("gallery").upload(thumbPath, blob, {
        upsert: false,
        contentType: "image/jpeg",
      });

      if (uploadErr) {
        console.warn("업로드 실패:", thumbPath);
      } else {
        console.log("썸네일 생성됨:", thumbPath);
      }
    };

    const run = async () => {
      setStatus("썸네일 생성 중...");

      const { data: years } = await supabase.storage.from("gallery").list("", { limit: 100 });
      for (const year of years || []) {
        if (!/^\d{4}$/.test(year.name)) continue;

        const { data: months } = await supabase.storage.from("gallery").list(year.name, { limit: 100 });
        for (const month of months || []) {
          if (!/^\d{2}$/.test(month.name)) continue;

          const { data: files } = await supabase.storage
            .from("gallery")
            .list(`${year.name}/${month.name}`, { limit: 100 });

          for (const file of files || []) {
            const thumbPath = `thumb/${year.name}/${month.name}/${file.name}`;
            const { data: exists } = await supabase.storage.from("gallery").list(`thumb/${year.name}/${month.name}`);
            const alreadyExists = exists?.some((f) => f.name === file.name);

            if (!alreadyExists) {
              await generateThumbnail(`${year.name}/${month.name}/${file.name}`, year.name, month.name, file.name);
            }
          }
        }
      }

      setStatus("✅ 썸네일 생성 완료!");
      setDone(true);
    };

    run();
  }, []);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>🔧 썸네일 자동 생성 도구</h2>
      <p>{status}</p>
      {done && <p>🎉 페이지를 닫아도 좋아요!</p>}
    </div>
  );
};

export default AdminThumbnailFill;

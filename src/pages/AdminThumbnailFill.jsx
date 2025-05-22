import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AdminThumbnailFill = () => {
  // 상태 훅: 현재 작업 진행 상태 메시지를 저장합니다.
  const [status, setStatus] = useState("준비 중...");
  // 상태 훅: 모든 작업이 완료되었는지 여부를 나타냅니다.
  const [done, setDone] = useState(false);

  // useEffect 훅: 컴포넌트가 마운트될 때 썸네일 생성 로직을 실행합니다.
  useEffect(() => {
    /**
     * 특정 이미지 파일의 썸네일을 생성하여 Supabase Storage에 업로드하는 비동기 함수입니다.
     * @param {string} filePath 원본 이미지 파일의 전체 경로 (예: "2023/10/image.jpg")
     * @param {string} year 이미지 파일이 속한 연도 (예: "2023")
     * @param {string} month 이미지 파일이 속한 월 (예: "10")
     * @param {string} fileName 이미지 파일의 이름 (예: "image.jpg")
     */
    const generateThumbnail = async (filePath, year, month, fileName) => {
      // 1. Supabase Storage에서 원본 이미지 파일을 다운로드합니다.
      const { data, error } = await supabase.storage.from("gallery").download(filePath);
      // 다운로드 실패 시 경고를 출력하고 함수를 종료합니다.
      if (error || !data) {
        console.warn("다운로드 실패:", filePath);
        return;
      }

      const imageBlob = data; // 다운로드된 이미지 데이터를 Blob 형태로 저장합니다.
      const img = new Image(); // 새 Image 객체를 생성합니다.
      img.src = URL.createObjectURL(imageBlob); // Blob URL을 Image src로 설정합니다.

      // 2. 이미지가 로드될 때까지 기다립니다.
      await new Promise((resolve) => {
        img.onload = () => resolve();
      });

      // 3. 썸네일 생성을 위한 캔버스(Canvas)를 생성합니다.
      const canvas = document.createElement("canvas");
      const maxWidth = 300; // 썸네일의 최대 너비를 300px로 설정합니다.
      const scale = maxWidth / img.width; // 원본 이미지 너비에 대한 스케일 비율을 계산합니다.
      canvas.width = maxWidth; // 캔버스 너비를 최대 너비로 설정합니다.
      canvas.height = img.height * scale; // 캔버스 높이를 스케일에 맞춰 조정합니다.
      const ctx = canvas.getContext("2d"); // 캔버스의 2D 렌더링 컨텍스트를 가져옵니다.
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // 원본 이미지를 캔버스에 그립니다.

      // 4. 캔버스 내용을 JPEG Blob으로 변환합니다. (품질 0.8)
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
      // Blob 변환에 실패하면 함수를 종료합니다.
      if (!blob) return;

      // 5. Supabase Storage의 'thumb' 폴더에 썸네일 파일을 업로드합니다.
      // 썸네일 경로는 'thumb/연도/월/파일이름' 형식입니다.
      const thumbPath = `thumb/${year}/${month}/${fileName}`;
      const { error: uploadErr } = await supabase.storage.from("gallery").upload(thumbPath, blob, {
        upsert: false, // 기존 파일이 있어도 덮어쓰지 않습니다. (여기서는 `true`가 더 적합할 수 있으나, 현재는 `false`로 설정되어 있습니다.)
        contentType: "image/jpeg", // 콘텐츠 타입을 JPEG로 지정합니다.
      });

      // 업로드 실패 시 경고를 출력합니다.
      if (uploadErr) {
        console.warn("업로드 실패:", thumbPath);
      } else {
        console.log("썸네일 생성됨:", thumbPath); // 성공 시 메시지를 출력합니다.
      }
    };

    /**
     * 모든 이미지에 대해 썸네일 생성 작업을 실행하는 메인 비동기 함수입니다.
     */
    const run = async () => {
      setStatus("썸네일 생성 중..."); // 상태 메시지를 업데이트합니다.

      // 1. 'gallery' 버킷의 루트에서 연도 폴더 목록을 가져옵니다.
      const { data: years } = await supabase.storage.from("gallery").list("", { limit: 100 });
      // 각 연도 폴더를 순회합니다.
      for (const year of years || []) {
        // 연도 이름이 4자리 숫자인지 정규식을 통해 확인합니다. (유효성 검사)
        if (!/^\d{4}$/.test(year.name)) continue;

        // 2. 해당 연도 폴더 안의 월 폴더 목록을 가져옵니다.
        const { data: months } = await supabase.storage.from("gallery").list(year.name, { limit: 100 });
        // 각 월 폴더를 순회합니다.
        for (const month of months || []) {
          // 월 이름이 2자리 숫자인지 정규식을 통해 확인합니다. (유효성 검사)
          if (!/^\d{2}$/.test(month.name)) continue;

          // 3. 해당 연도/월 폴더 안의 파일 목록을 가져옵니다.
          const { data: files } = await supabase.storage
            .from("gallery")
            .list(`${year.name}/${month.name}`, { limit: 100 });

          // 각 파일을 순회하며 썸네일 생성 여부를 확인합니다.
          for (const file of files || []) {
            // 썸네일이 저장될 예상 경로를 구성합니다.
            const thumbPath = `thumb/${year.name}/${month.name}/${file.name}`;
            // 'thumb' 폴더 내에 해당 연도/월 폴더의 파일 목록을 가져와 이미 썸네일이 존재하는지 확인합니다.
            const { data: exists } = await supabase.storage.from("gallery").list(`thumb/${year.name}/${month.name}`);
            const alreadyExists = exists?.some((f) => f.name === file.name);

            // 썸네일이 아직 존재하지 않는 경우에만 썸네일 생성 함수를 호출합니다.
            if (!alreadyExists) {
              await generateThumbnail(`${year.name}/${month.name}/${file.name}`, year.name, month.name, file.name);
            }
          }
        }
      }

      setStatus("✅ 썸네일 생성 완료!"); // 모든 작업 완료 후 상태 메시지를 업데이트합니다.
      setDone(true); // 작업 완료 상태를 true로 설정합니다.
    };

    run(); // 썸네일 생성 작업을 시작합니다.
  }, []); // 빈 의존성 배열: 컴포넌트가 마운트될 때 (첫 렌더링 시) 한 번만 실행됩니다.

  return (
    // 썸네일 자동 생성 도구의 UI를 렌더링합니다.
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>🔧 썸네일 자동 생성 도구</h2>
      <p>{status}</p> {/* 현재 작업 상태를 표시합니다. */}
      {done && <p>🎉 페이지를 닫아도 좋아요!</p>} {/* 작업 완료 시 메시지를 표시합니다. */}
    </div>
  );
};

export default AdminThumbnailFill;
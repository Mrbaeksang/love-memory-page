import React, { useMemo } from "react";

// gallery 폴더 내 이미지 파일명 목록 (자동화 가능, 현재는 수동)
const imageList = [
  "IMG_20250428_230623_167.webp",
  "IMG_20250429_051557_386.webp",
  "Retro Photo 2024-12-23 (5F51080A-BB41-4423-9611-8FC6BDD136BF).jpeg",
  "Retro Photo 2024-12-23 (F20CE934-80CD-458D-9F58-A9FE41AB3785).jpeg",
  "Retro Photo 2024-12-26 (6D05966F-70B3-471C-9151-2F307D69E49D).jpeg",
  "Retro Photo 2024-12-26 (748A59D8-ACD4-46AB-BBAB-7C8301495DF4).jpeg",
  "Retro Photo 2024-12-29 (23471070-F1B0-4D81-B868-94980FC08D10).jpeg",
  "Retro Photo 2025-01-01 (C47D42CD-CE93-4FDD-A973-C7C672073234).jpeg",
  "Retro Photo 2025-01-03 (2342939A-F4C4-4F14-A0C9-C5539211C218).jpeg",
  "Retro Photo 2025-01-03 (DADACAAD-0DAF-4EA6-B411-2F78575AB81A).jpeg",
  "Retro Photo 2025-01-06 (5FDB0E7B-A233-4C89-8F48-EA9EC28A6562).jpeg",
  "Retro Photo 2025-01-06 (8E6ECF4D-341E-48DF-A0D5-E37041C9E03D).jpeg",
  "Retro Photo 2025-01-06 (A853571F-8F59-472D-935B-BA3E28B1D38A).jpeg",
  "Retro Photo 2025-01-06 (B8114C7B-84FC-41FB-A07C-068C2679D223).jpeg",
  "Retro Photo 2025-01-06 (C64FCD2F-118C-4D50-8C66-D2E05572F157).jpeg",
  "Retro Photo 2025-01-07 (47DA8F86-31A4-4A29-B282-CEE9B1679CFB).jpeg",
  "Retro Photo 2025-01-07 (48103798-EB27-4ECB-B560-A65EC2BBCCE6).jpeg",
  "Retro Photo 2025-01-07 (7EF6CA02-071C-4DCC-A277-C705FBA43D8D).jpeg",
  "Retro Photo 2025-01-07 (CD3B1853-A582-478D-9E99-0B288545415B).jpeg",
  // ... (생략, 필요시 전체 추가)
];

const getRandomImage = () => {
  const idx = Math.floor(Math.random() * imageList.length);
  return imageList[idx];
};

const RandomImage = ({ style = {} }) => {
  // useMemo로 한 번만 랜덤 선택
  const img = useMemo(() => getRandomImage(), []);
  return (
    <div className="lovetype-random-image-wrap">
      <img
        src={`/gallery/${img}`}
        alt="emotional random"
        className="lovetype-random-image"
        style={style}
        loading="lazy"
      />
    </div>
  );
};

export default RandomImage;

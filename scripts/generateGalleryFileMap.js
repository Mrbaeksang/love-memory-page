// Node.js 스크립트: public/gallary 폴더 기준으로 galleryFileMap.js 자동 생성
const fs = require('fs');
const path = require('path');

// galleryFileUtils의 parseGalleryFiles 함수 복사 (import 불가 대비)
function parseGalleryFiles(fileNames) {
  const map = {};
  const dateRegex = /(\d{4})[-_]?([01]?\d)[-_]?([0-3]?\d)/;
  fileNames.forEach(name => {
    const match = name.match(dateRegex);
    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      if (!map[year]) map[year] = {};
      if (!map[year][month]) map[year][month] = [];
      map[year][month].push(name);
    }
  });
  // 파일명순 정렬
  Object.values(map).forEach(months => {
    Object.values(months).forEach(arr => arr.sort());
  });
  return map;
}

const GALLERY_DIR = path.join(__dirname, '..', 'public', 'gallary');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'pages', 'galleryFileMap.js');

fs.readdir(GALLERY_DIR, (err, files) => {
  if (err) {
    console.error('gallary 폴더를 읽을 수 없습니다:', err);
    process.exit(1);
  }
  // 이미지/비디오 파일만 필터링
  const validFiles = files.filter(name => /\.(jpe?g|png|webp|gif|bmp|mov|mp4)$/i.test(name));
  const map = parseGalleryFiles(validFiles);
  const jsContent = `// 자동 생성 파일 (수정 금지)\nexport const galleryFileMap = ${JSON.stringify(map, null, 2)};\n`;
  fs.writeFileSync(OUTPUT_FILE, jsContent, 'utf-8');
  console.log('galleryFileMap.js가 성공적으로 생성되었습니다!');
});

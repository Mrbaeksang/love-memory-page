// Node.js 스크립트: public/gallary 폴더의 파일명을 읽어 galleryFileMap.js 생성
const fs = require('fs');
const path = require('path');

// 파일명에서 연/월 추출
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

const gallaryDir = path.join(__dirname, '../../public/gallary');
const output = path.join(__dirname, 'galleryFileMap.js');

const files = fs.readdirSync(gallaryDir).filter(f => !f.startsWith('.'));
const map = parseGalleryFiles(files);

const fileContent = `// 자동 생성됨\nexport const galleryFileMap = ${JSON.stringify(map, null, 2)};\n`;
fs.writeFileSync(output, fileContent, 'utf8');
console.log('galleryFileMap.js 생성 완료:', output);

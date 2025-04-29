// gallary 폴더 파일명 배열을 받아 연/월별로 분류
export function parseGalleryFiles(fileNames) {
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

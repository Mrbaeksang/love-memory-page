const fs = require("fs");
const path = require("path");

// 현재 스크립트가 위치한 폴더 = music 폴더
const musicDir = __dirname;

// 1. love1.mp3 ~ love330.mp3 전체 목록 생성
const allFiles = Array.from({ length: 330 }, (_, i) => `love${i + 1}.mp3`);

// 2. 실제 존재하는 파일만 필터링
const existingFiles = allFiles.filter(file => fs.existsSync(path.join(musicDir, file)));

// 3. 랜덤하게 섞은 후 230개 선택하여 삭제
const shuffled = existingFiles.sort(() => Math.random() - 0.5);
const filesToDelete = shuffled.slice(0, 230);
const filesToKeep = shuffled.slice(230); // 나머지 100개

// 4. 삭제 실행
filesToDelete.forEach(file => {
  const fullPath = path.join(musicDir, file);
  fs.unlinkSync(fullPath);
  console.log(`🗑 Deleted: ${file}`);
});

// 5. 남은 파일들을 love1.mp3 ~ love100.mp3로 리네이밍
filesToKeep.forEach((oldName, index) => {
  const newName = `love${index + 1}.mp3`;
  const oldPath = path.join(musicDir, oldName);
  const newPath = path.join(musicDir, newName);
  fs.renameSync(oldPath, newPath);
  console.log(`📛 Renamed: ${oldName} → ${newName}`);
});

console.log(`✅ 작업 완료: 230개 삭제, 100개 리네이밍 완료`);

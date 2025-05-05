// renameMusic.js

const fs = require("fs");
const path = require("path");

const folderPath = path.join(__dirname); // 현재 폴더 기준
const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".mp3"));

files.forEach((file, index) => {
  const newName = `love${index + 1}.mp3`;
  const oldPath = path.join(folderPath, file);
  const newPath = path.join(folderPath, newName);

  // 파일 이름 같으면 skip
  if (file !== newName) {
    fs.renameSync(oldPath, newPath);
    console.log(`✅ ${file} → ${newName}`);
  }
});

console.log("\n🎵 모든 mp3 파일 리네이밍 완료!");

// src/utils/sendDailyDDayPush.js
import { sendPushToAll } from "./sendPushToAll";
import { getAnonId } from "./getAnonId";

export async function sendDailyDDayPush() {
  const startDate = "2025-01-01"; // 💖 시작일 (필요시 Supabase에서 불러오게 확장 가능)

  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  todayKST.setHours(0, 0, 0, 0);
  const dDay =
    Math.floor((todayKST.getTime() - new Date(startDate).setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24));

  const message = `오늘은 상현💖혜은 함께한 지 D+${dDay}일째~ 💕`;

  await sendPushToAll({
    title: "💘 오늘의 D-Day 알림",
    body: message,
    click_action: `https://love-memory-page.vercel.app/#home`,
    excludeUserId: getAnonId(), // 현재 유저 제외 (옵션)
  });

  console.log("✅ D-Day 푸시 전송 완료:", message);
}

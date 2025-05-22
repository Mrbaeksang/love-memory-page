import { sendPushToAll } from "./sendPushToAll"; // 푸시 발송 유틸
import { getAnonId } from "./getAnonId"; // 현재 사용자 ID 가져오기

/**
 * 매일 D-Day 푸시 알림을 전송하는 함수입니다.
 */
export async function sendDailyDDayPush() {
  const startDate = "2025-01-01"; // 💖 기념일 시작일

  // 1. 오늘 날짜 (KST 기준 00:00:00) 계산
  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  todayKST.setHours(0, 0, 0, 0);

  // 2. 시작일과의 차이 계산 (D+N)
  const startDateTime = new Date(startDate).setHours(0, 0, 0, 0);
  const dDay = Math.floor(
    (todayKST.getTime() - startDateTime) / (1000 * 60 * 60 * 24)
  );

  // 3. 메시지 생성
  const message = `오늘은 상현💖혜은 함께한 지 D+${dDay}일째~ 💕`;

  // 4. 푸시 발송 (유저당 1개만)
  await sendPushToAll({
    title: "💘 오늘의 D-Day 알림",
    body: message,
    click_action: `https://love-memory-page.vercel.app/#home`,
    excludeUserId: getAnonId(), // 현재 기기 제외
    deduplicatePerUser: true,   // 🔥 중복 제거 추가!
  });

  console.log("✅ D-Day 푸시 전송 완료:", message);
}

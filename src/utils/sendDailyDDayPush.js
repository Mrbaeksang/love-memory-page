import { sendPushToAll } from './sendPushToAll.js';
import { getAnonId } from './getAnonId.js';

/**
 * 매일 D-Day 푸시 알림을 전송하는 함수입니다.
 */
export async function sendDailyDDayPush() {
  const startDate = '2025-01-01';

  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  todayKST.setHours(0, 0, 0, 0);

  const startDateTime = new Date(startDate).setHours(0, 0, 0, 0);
  const dDay = Math.floor((todayKST - startDateTime) / (1000 * 60 * 60 * 24));

  const message = `오늘은 상현💖혜은 함께한 지 D+${dDay}일째~ 💕`;

  await sendPushToAll({
    title: '💘 오늘의 D-Day 알림',
    body: message,
    click_action: 'https://love-memory-page.vercel.app/#home',
    excludeUserId: getAnonId(),
    deduplicatePerUser: true,
  });

  console.log('✅ D-Day 푸시 전송 완료:', message);
}

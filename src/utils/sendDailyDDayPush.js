// src/utils/sendDailyDDayPush.js

import { sendPushToAll } from "./sendPushToAll"; // 모든 사용자에게 푸시 알림을 보내는 함수를 임포트합니다.
import { getAnonId } from "./getAnonId"; // 현재 익명 사용자 ID를 가져오는 함수를 임포트합니다.

/**
 * 매일 D-Day 푸시 알림을 전송하는 비동기 함수입니다.
 * 이 함수는 특정 시작일로부터 현재까지의 D-Day를 계산하여 알림 메시지를 생성하고,
 * sendPushToAll 함수를 통해 모든 등록된 사용자에게 푸시 알림을 발송합니다.
 */
export async function sendDailyDDayPush() {
  // 💖 기념일 시작일 (예시로 고정된 값, 필요에 따라 Supabase 등에서 동적으로 불러오도록 확장 가능)
  const startDate = "2025-01-01";

  // 1. 현재 한국 시간(KST)을 기준으로 오늘의 날짜를 계산합니다.
  // Date.now()는 UTC 기준 밀리초를 반환하므로, 한국 시간대(UTC+9)를 맞추기 위해 9시간을 더합니다.
  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  // 시간을 00:00:00.000으로 설정하여 날짜만 비교할 수 있도록 합니다.
  todayKST.setHours(0, 0, 0, 0);

  // 2. D-Day를 계산합니다.
  // 시작일의 시간을 00:00:00.000으로 설정하여 정확한 날짜 차이를 계산합니다.
  const startDateTime = new Date(startDate).setHours(0, 0, 0, 0);
  // 오늘 날짜(KST)와 시작일의 밀리초 차이를 계산하여 일(day) 단위로 변환합니다.
  const dDay = Math.floor(
    (todayKST.getTime() - startDateTime) / (1000 * 60 * 60 * 24)
  );

  // 3. D-Day 메시지를 생성합니다.
  const message = `오늘은 상현💖혜은 함께한 지 D+${dDay}일째~ 💕`;

  // 4. sendPushToAll 함수를 호출하여 모든 사용자에게 푸시 알림을 전송합니다.
  await sendPushToAll({
    title: "💘 오늘의 D-Day 알림", // 푸시 알림 제목
    body: message, // 계산된 D-Day 메시지
    click_action: `https://love-memory-page.vercel.app/#home`, // 알림 클릭 시 이동할 URL (홈 페이지로 이동)
    excludeUserId: null, // 선택 사항: 현재 알림을 보내는 기기의 사용자에게는 알림을 보내지 않습니다.
  });

  // 푸시 알림 전송 완료 로그를 콘솔에 출력합니다.
  console.log("✅ D-Day 푸시 전송 완료:", message);
}
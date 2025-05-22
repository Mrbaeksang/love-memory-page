// src/utils/sendPushToAll.js

import { supabase } from "../lib/supabaseClient"; // Supabase 클라이언트 라이브러리를 임포트합니다. 데이터베이스 및 스토리지 접근에 사용됩니다.

// 환경 변수에서 배포 URL을 가져옵니다. VITE_DEPLOY_URL이 없으면 빈 문자열을 사용합니다.
const DEPLOY_URL = import.meta.env.VITE_DEPLOY_URL || "";

/**
 * 등록된 모든 사용자에게 푸시 알림을 전송하는 비동기 함수입니다.
 *
 * @param {Object} params - 푸시 알림 전송에 필요한 매개변수 객체
 * @param {string} params.title - 푸시 알림의 제목
 * @param {string} params.body - 푸시 알림의 본문 내용
 * @param {string} params.click_action - 푸시 알림 클릭 시 이동할 URL (웹 페이지 경로)
 * @param {string} [params.excludeUserId] - 알림을 보내지 않을 특정 사용자의 ID (선택 사항)
 */
export async function sendPushToAll({ title, body, click_action, excludeUserId }) {
  try {
    // 1. Supabase에서 모든 푸시 알림 토큰을 조회합니다.
    const { data: tokens, error } = await supabase
      .from("notification_tokens") // 'notification_tokens' 테이블에서
      .select("token, user_id"); // 'token'과 'user_id' 컬럼을 선택합니다.

    // 푸시 토큰 조회 중 에러가 발생하면 콘솔에 에러를 출력하고 함수를 종료합니다.
    if (error) {
      console.error("🔴 푸시 토큰 조회 실패:", error);
      return;
    }

    // 2. 조회된 토큰들을 중복 없이 유니크하게 필터링하고, 특정 사용자를 제외합니다.
    const uniqueMap = new Map(); // 중복 토큰을 제거하고 user_id를 함께 저장하기 위한 Map 객체
    for (const { token, user_id } of tokens) {
      // excludeUserId가 없거나 (모두에게 보내는 경우) 현재 user_id가 제외할 ID가 아닐 경우에만 Map에 추가합니다.
      if (!excludeUserId || user_id !== excludeUserId) {
        uniqueMap.set(token, user_id); // 토큰을 키로, user_id를 값으로 저장하여 중복을 방지합니다.
      }
    }

    // Map에 저장된 유니크한 토큰(키)들만 배열로 추출합니다.
    const registrationIds = [...uniqueMap.keys()];

    // 전송할 토큰이 없으면 경고 메시지를 출력하고 함수를 종료합니다.
    if (registrationIds.length === 0) {
      console.warn("📭 푸시 보낼 토큰이 없습니다.");
      return;
    }

    // 3. 백엔드 API를 호출하여 실제 푸시 알림을 전송합니다.
    const response = await fetch(`${DEPLOY_URL}/api/send-push-v1`, {
      method: "POST", // POST 요청을 사용합니다.
      headers: { "Content-Type": "application/json" }, // 요청 본문이 JSON 형식임을 명시합니다.
      body: JSON.stringify({ // JSON 문자열로 변환하여 요청 본문에 포함합니다.
        registration_ids: registrationIds, // 푸시를 받을 기기 토큰 목록
        title, // 알림 제목
        body, // 알림 본문
        click_action, // 알림 클릭 시 이동할 URL
        data: {
          url: click_action, // ✅ 푸시 알림 클릭 시 정확한 웹 페이지로 이동하기 위해 이 data 필드가 반드시 필요합니다.
        },
      }),
    });

    // API 응답을 JSON 형태로 파싱합니다.
    const result = await response.json();
    console.log("📣 푸시 전송 결과:", result); // 푸시 전송 결과를 콘솔에 출력합니다.

  } catch (err) {
    // 푸시 전송 과정에서 발생한 모든 오류를 잡아 콘솔에 출력합니다.
    console.error("💥 푸시 전송 중 오류 발생:", err);
  }
}
import { supabase } from "../lib/supabaseClient";

const DEPLOY_URL = import.meta.env.VITE_DEPLOY_URL || "";

/**
 * 등록된 모든 사용자에게 푸시 알림을 전송하는 유틸 함수
 *
 * @param {Object} params
 * @param {string} params.title - 알림 제목
 * @param {string} params.body - 알림 내용
 * @param {string} params.click_action - 알림 클릭 시 이동할 URL
 * @param {string} [params.excludeUserId] - 제외할 사용자 ID
 * @param {boolean} [params.deduplicatePerUser=false] - 유저당 하나의 알림만 보낼지 여부 (기본: false)
 */
export async function sendPushToAll({
  title,
  body,
  click_action,
  excludeUserId,
  deduplicatePerUser = false,
}) {
  try {
    const { data: tokens, error } = await supabase
      .from("notification_tokens")
      .select("token, user_id");

    if (error) {
      console.error("🔴 푸시 토큰 조회 실패:", error);
      return;
    }

    let filteredTokens;

    if (deduplicatePerUser) {
      // 🔁 user_id 기준 하나의 토큰만 남기기
      const userMap = new Map();
      for (const { token, user_id } of tokens) {
        if (!excludeUserId || user_id !== excludeUserId) {
          if (!userMap.has(user_id)) {
            userMap.set(user_id, token);
          }
        }
      }
      filteredTokens = [...userMap.values()];
    } else {
      // 모든 토큰 전송
      filteredTokens = tokens
        .filter(({ user_id }) => !excludeUserId || user_id !== excludeUserId)
        .map((t) => t.token);
    }

    if (filteredTokens.length === 0) {
      console.warn("📭 보낼 토큰 없음");
      return;
    }

    const response = await fetch(`${DEPLOY_URL}/api/send-push-v1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registration_ids: filteredTokens,
        title,
        body,
        click_action,
        data: {
          url: click_action,
        },
      }),
    });

    const result = await response.json();
    console.log("📣 푸시 전송 결과:", result);

  } catch (err) {
    console.error("💥 푸시 전송 중 오류 발생:", err);
  }
}

import { supabase } from "../lib/supabaseClient.js";

const DEPLOY_URL =
  typeof process !== "undefined" && process.env.VITE_DEPLOY_URL
    ? process.env.VITE_DEPLOY_URL
    : import.meta.env?.VITE_DEPLOY_URL || "";

/**
 * 등록된 사용자에게 푸시 알림 전송
 *
 * @param {Object} params
 * @param {string} params.title - 알림 제목
 * @param {string} params.body - 알림 내용
 * @param {string} params.click_action - 클릭 시 이동 링크
 * @param {string} [params.excludeUserId] - 제외할 사용자 ID
 * @param {boolean} [params.deduplicatePerUser=false] - 유저당 하나만 보낼지
 * @param {boolean} [params.onlyAllowedUsers=false] - allowed_users 기준만 보낼지 여부
 */
export async function sendPushToAll({
  title,
  body,
  click_action,
  excludeUserId,
  deduplicatePerUser = false,
  onlyAllowedUsers = false,
}) {
  try {
    let allowedUserSet = null;

    // ✅ 1. allowed_users 기준만 보낼 경우
    if (onlyAllowedUsers) {
      const { data: allowedUsers, error: allowedError } = await supabase
        .from("allowed_users")
        .select("user_id");

      if (allowedError) {
        console.error("❌ allowed_users 불러오기 실패:", allowedError);
        return;
      }

      allowedUserSet = new Set(allowedUsers.map((u) => u.user_id));
    }

    // ✅ 2. 전체 토큰 목록 조회
    const { data: tokens, error } = await supabase
      .from("notification_tokens")
      .select("token, user_id");

    if (error) {
      console.error("🔴 푸시 토큰 조회 실패:", error);
      return;
    }

    // ✅ 3. 필터링 및 deduplication
    let filteredTokens;
    if (deduplicatePerUser) {
      const userMap = new Map();
      for (const { token, user_id } of tokens) {
        const isAllowed = !onlyAllowedUsers || allowedUserSet.has(user_id);
        if (isAllowed && (!excludeUserId || user_id !== excludeUserId)) {
          if (!userMap.has(user_id)) {
            userMap.set(user_id, token);
          }
        }
      }
      filteredTokens = [...userMap.values()];
    } else {
      filteredTokens = tokens
        .filter(({ user_id }) => {
          const isAllowed = !onlyAllowedUsers || allowedUserSet.has(user_id);
          return isAllowed && (!excludeUserId || user_id !== excludeUserId);
        })
        .map((t) => t.token);
    }

    if (filteredTokens.length === 0) {
      console.warn("📭 보낼 토큰 없음");
      return;
    }

    // ✅ 4. 푸시 요청 전송
    const response = await fetch(`${DEPLOY_URL}/api/send-push-v1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registration_ids: filteredTokens,
        title,
        body,
        click_action,
        data: { url: click_action },
      }),
    });

    const result = await response.json();
    console.log("📣 푸시 전송 결과:", result);
  } catch (err) {
    console.error("💥 푸시 전송 실패:", err);
  }
}

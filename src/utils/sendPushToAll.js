import { supabase } from "../lib/supabaseClient.js";

const DEPLOY_URL =
  typeof process !== "undefined" && process.env.VITE_DEPLOY_URL
    ? process.env.VITE_DEPLOY_URL
    : import.meta.env?.VITE_DEPLOY_URL || "";

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
        data: { url: click_action },
      }),
    });

    const result = await response.json();
    console.log("📣 푸시 전송 결과:", result);
  } catch (err) {
    console.error("💥 푸시 전송 중 오류 발생:", err);
  }
}

// src/utils/sendPushToAll.js
import { supabase } from "../lib/supabaseClient";

const DEPLOY_URL = import.meta.env.VITE_DEPLOY_URL || "";

export async function sendPushToAll({ title, body, click_action, excludeUserId }) {
  try {
    const { data: tokens, error } = await supabase
      .from("notification_tokens")
      .select("token, user_id");

    if (error) {
      console.error("🔴 푸시 토큰 조회 실패:", error);
      return;
    }

    const uniqueMap = new Map();
    for (const { token, user_id } of tokens) {
      if (!excludeUserId || user_id !== excludeUserId) {
        uniqueMap.set(token, user_id);
      }
    }

    const registrationIds = [...uniqueMap.keys()];
    if (registrationIds.length === 0) {
      console.warn("📭 푸시 보낼 토큰이 없습니다.");
      return;
    }

    const response = await fetch(`${DEPLOY_URL}/api/send-push-v1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registration_ids: registrationIds,
        title,
        body,
        click_action,
        data: {
          url: click_action, // ✅ 푸시 클릭 시 정확한 이동을 위해 반드시 필요
        },
      }),
    });

    const result = await response.json();
    console.log("📣 푸시 전송 결과:", result);
  } catch (err) {
    console.error("💥 푸시 전송 중 오류 발생:", err);
  }
}

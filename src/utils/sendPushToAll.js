// src/utils/sendPushToAll.js
import { supabase } from "../lib/supabaseClient";

const DEPLOY_URL = import.meta.env.VITE_DEPLOY_URL || "";

export async function sendPushToAll({ title, body, click_action, excludeUserId }) {
  const { data: tokens, error } = await supabase
    .from("notification_tokens")
    .select("token, user_id");

  if (error) {
    console.error("🔴 푸시 토큰 조회 실패:", error);
    return;
  }

  const filtered = excludeUserId
    ? tokens.filter(({ user_id }) => user_id !== excludeUserId)
    : tokens;

  const promises = filtered.map(({ token }) =>
    fetch(`${DEPLOY_URL}/api/send-push-v1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, title, body, click_action }),
    })
  );

  await Promise.all(promises);
  console.log(`📣 ${filtered.length}명에게 푸시 전송 완료`);
}

// /api/send-push-v1.js

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const decodedServiceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_ADMIN_KEY, "base64").toString("utf-8")
);

if (!getApps().length) {
  initializeApp({ credential: cert(decodedServiceAccount) });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { registration_ids, title, body, click_action } = req.body;

  if (!registration_ids || !Array.isArray(registration_ids) || registration_ids.length === 0 || !title || !body) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  try {
    const message = {
      notification: { title, body },
      tokens: registration_ids,
      webpush: {
        notification: {
          icon: "https://love-memory-page.vercel.app/icon-192.png",
        },
        fcmOptions: {
          link: click_action || "https://love-memory-page.vercel.app",
        },
      },
      data: {
        url: click_action || "https://love-memory-page.vercel.app",
      },
    };

    const response = await getMessaging().sendEachForMulticast(message);

    const failedTokens = response.responses
      .map((r, idx) => (!r.success ? registration_ids[idx] : null))
      .filter(Boolean);

    if (failedTokens.length > 0) {
      await supabase
        .from("notification_tokens")
        .delete()
        .in("token", failedTokens);
      console.warn("🧹 만료된 FCM 토큰 삭제:", failedTokens);
    }

    console.log("✅ FCM 전송 완료:", {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    res.status(200).json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error("🔴 FCM 전송 실패:", error);
    res.status(500).json({ error: "FCM 전송 중 서버 오류", detail: error.message });
  }
}

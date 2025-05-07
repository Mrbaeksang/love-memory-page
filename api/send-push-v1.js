// /api/send-push-v1.js
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import serviceAccount from "../../firebase-service-account.json";

// Firebase Admin 초기화 (중복 방지)
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  // ✅ CORS 헤더 추가
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Preflight 요청 처리
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, title, body, click_action } = req.body;

  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      webpush: {
        fcmOptions: {
          link: click_action || "https://love-memory-page.vercel.app",
        },
      },
    };

    const response = await getMessaging().send(message);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error("🔴 FCM 전송 오류:", error);
    res.status(500).json({ error: "푸시 전송 실패" });
  }
}

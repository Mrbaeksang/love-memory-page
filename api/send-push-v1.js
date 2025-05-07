// /api/send-push-v1.js

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// ✅ 환경변수에서 base64로 인코딩된 서비스 계정 키 불러오기
const decodedServiceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_ADMIN_KEY, "base64").toString("utf-8")
);

// ✅ Firebase Admin 초기화 (중복 방지)
if (!getApps().length) {
  initializeApp({
    credential: cert(decodedServiceAccount),
  });
}

export default async function handler(req, res) {
  // ✅ CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ OPTIONS 사전 요청 처리
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, title, body, click_action } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ error: "Missing fields: token, title, body are required" });
  }

  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      webpush: {
        notification: {
          icon: "https://love-memory-page.vercel.app/icon-192.png", // ✅ 위치 옮김
        },
        fcmOptions: {
          link: click_action || "https://love-memory-page.vercel.app",
        },
      },
    };
    

    const response = await getMessaging().send(message);
    console.log("✅ FCM 전송 성공:", response);
    res.status(200).json({ success: true, response });
  } // 👇 아래 부분만 try-catch 안에 추가
  catch (error) {
    console.error("🔴 FCM 전송 오류:", error);
  
    // ⛔ registration-token-not-registered 에러일 경우 DB에서 토큰 제거
    if (
      error.errorInfo?.code === "messaging/registration-token-not-registered" &&
      token
    ) {
      console.warn("🧹 만료된 FCM 토큰 삭제 중:", token);
      await supabase.from("notification_tokens").delete().eq("token", token);
    }
  
    return res.status(500).json({
      error: "푸시 전송 실패",
      details: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        info: error.errorInfo || null,
      },
    });
  }
  
  
}

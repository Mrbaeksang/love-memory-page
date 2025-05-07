// /api/send-push-v1.js

import admin from "firebase-admin";
import path from "path";
import { promises as fs } from "fs";

// ✅ Firebase 앱이 이미 초기화됐는지 체크 (중복 초기화 방지)
if (!admin.apps.length) {
  try {
    const keyPath = path.resolve(__dirname, "../firebase/firebase-admin-key.json");
    const serviceAccount = JSON.parse(await fs.readFile(keyPath, "utf-8"));
    console.log("✅ Firebase 초기화 성공");
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("❌ Firebase 초기화 실패:", error);
    throw new Error("Firebase 초기화 실패: " + error.message);
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ 
        message: "POST 요청만 허용됩니다",
        timestamp: new Date().toISOString()
      });
    }

    const { token, title, body, click_action } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({ 
        message: "필수 항목이 누락되었습니다",
        missing: !token ? "token" : !title ? "title" : "body",
        timestamp: new Date().toISOString()
      });
    }

    // ✅ 클릭 시 이동할 기본 경로 설정
    const clickAction = click_action || "https://love-memory-page.vercel.app";

    // ✅ FCM 메시지 구조 정의 (Webpush 옵션 포함)
    const message = {
      token,
      notification: {
        title,
        body,
      },
      webpush: {
        fcmOptions: {
          link: clickAction,
        },
        notification: {
          icon: "https://love-memory-page.vercel.app/icon-192.png",
        },
      },
    };

    const response = await admin.messaging().send(message);
    
    res.status(200).json({ 
      message: "푸시 전송 성공", 
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("푸시 전송 오류:", {
      error: error.message,
      stack: error.stack,
      request: {
        token: "[REDACTED]",
        title,
        body,
        click_action
      }
    });
    
    res.status(500).json({
      message: "푸시 전송 실패",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

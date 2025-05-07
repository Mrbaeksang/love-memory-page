import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

// 🔑 환경변수에서 Firebase 설정 불러오기
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 🔑 VAPID 키 (Web Push 인증키)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const firebaseApp = initializeApp(firebaseConfig);

export default function usePushNotifications(user_id) {
  useEffect(() => {
    const registerToken = async () => {
      try {
        const messaging = getMessaging(firebaseApp);

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (token) {
          // ✅ 본인 토큰 localStorage 저장 (작성자 제외용)
          localStorage.setItem("fcm_token", token);

          // ✅ Supabase에 토큰 저장
          const { error } = await supabase
          .from("notification_tokens")
          .upsert({ user_id, token }, { onConflict: "token" });

        if (error) {
          console.error("❌ Supabase 토큰 저장 실패:", error);
        } else {
          console.log("📬 FCM 토큰 저장 완료:", token);
        }
        }
      } catch (error) {
        console.error("🔴 FCM 토큰 등록 실패:", error);
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then(() => {
          console.log("✅ ServiceWorker 등록됨");
          registerToken();
        });
    }
  }, [user_id]);
}

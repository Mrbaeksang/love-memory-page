// src/hooks/usePushNotifications.js

import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// 🔐 환경 변수에서 Firebase 설정값 불러오기
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// ✅ Firebase 앱 초기화 (중복 방지)
const app = initializeApp(firebaseConfig);

const usePushNotifications = (userId) => {
  useEffect(() => {
    const initPush = async () => {
      try {
        // ✅ Service Worker 등록 (중복 체크)
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("✅ ServiceWorker 등록됨");

        // ✅ 권한 요청
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("❌ 푸시 권한 거부됨");
          return;
        }

        const messaging = getMessaging(app);

        // ✅ 토큰 발급
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (!token) {
          console.warn("❌ FCM 토큰 발급 실패");
          return;
        }

        // ✅ Supabase에 토큰 저장
        const { error } = await supabase
          .from("notification_tokens")
          .upsert({
            user_id: userId,
            token,
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error("❌ Supabase 토큰 저장 실패:", error);
        } else {
          console.log("📬 FCM 토큰 저장 완료:", token);
        }

        // ✅ 수신 알림 로그
        onMessage(messaging, (payload) => {
          console.log("📥 수신된 알림:", payload);
        });
      } catch (err) {
        console.error("🔥 푸시 초기화 중 예외 발생:", err);
      }
    };

    initPush();
  }, [userId]);
};

export default usePushNotifications;

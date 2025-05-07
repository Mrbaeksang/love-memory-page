import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const firebaseApp = initializeApp(firebaseConfig);

export default function usePushNotifications(user_id) {
  useEffect(() => {
    // ✅ 사용자 인터랙션 후 실행할 알림 등록 함수
    const registerPush = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("🔕 알림 권한이 거부되었습니다.");
          return;
        }

        const messaging = getMessaging(firebaseApp);
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (token) {
          localStorage.setItem("fcm_token", token);

          const { error } = await supabase
            .from("notification_tokens")
            .upsert({ user_id, token }, { onConflict: "token" });

          if (error) {
            console.error("❌ Supabase 토큰 저장 실패:", error);
          } else {
            console.log("📬 FCM 토큰 저장 완료:", token);
          }
        }
      } catch (err) {
        console.error("🔴 FCM 등록 실패:", err);
      }
    };

    // ✅ 반드시 클릭 후 실행되도록 이벤트 등록
    const listener = () => {
      registerPush();
      window.removeEventListener("click", listener); // 한 번만 실행
    };

    window.addEventListener("click", listener); // 페이지 내 첫 클릭 감지
  }, [user_id]);
}

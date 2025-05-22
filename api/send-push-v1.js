// /api/send-push-v1.js

// Firebase Admin SDK를 초기화하기 위한 함수들과 Supabase 연결 모듈을 임포트
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createClient } from "@supabase/supabase-js";

// ✅ Supabase 관리용 연결 (Service Role Key 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,          // 공개 주소
  process.env.SUPABASE_SERVICE_ROLE_KEY          // 관리자 권한 키
);

// ✅ Firebase Admin 인증 정보 디코딩 (base64로 암호화된 환경변수)
const decodedServiceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_ADMIN_KEY, "base64").toString("utf-8")
);

// ✅ Firebase 앱이 초기화되어 있지 않은 경우에만 초기화 (중복 방지)
if (!getApps().length) {
  initializeApp({ credential: cert(decodedServiceAccount) });
}

// ✅ API 핸들러 정의
export default async function handler(req, res) {
  // CORS 설정: 외부에서 요청 허용
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 프리플라이트 요청 처리 (CORS용)
  if (req.method === "OPTIONS") return res.status(200).end();

  // POST 외의 메서드는 허용하지 않음
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 요청 본문에서 필요한 데이터 추출
  const { registration_ids, title, body, click_action } = req.body;

  // 필수 값 검증
  if (!registration_ids || !Array.isArray(registration_ids) || registration_ids.length === 0 || !title || !body) {
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  try {
    // ✅ FCM 메시지 생성
    const message = {
      notification: { title, body },
      tokens: registration_ids,  // 여러 기기 대상
      webpush: {
        notification: {
          icon: "https://love-memory-page.vercel.app/icon-192.png",  // 알림 아이콘
        },
        fcmOptions: {
          link: click_action || "https://love-memory-page.vercel.app",  // 클릭 시 이동
        },
      },
      data: {
        url: click_action || "https://love-memory-page.vercel.app",  // PWA에서 열릴 주소
      },
    };

    // ✅ 다중 전송 처리
    const response = await getMessaging().sendEachForMulticast(message);

    // 실패한 토큰 식별
    const failedTokens = response.responses
      .map((r, idx) => (!r.success ? registration_ids[idx] : null))
      .filter(Boolean);

    if (failedTokens.length > 0) {
      console.warn("🧹 FCM 실패한 토큰 (삭제는 하지 않음):", failedTokens);
      // TODO: Supabase에서 삭제하거나 블랙리스트 처리 가능
    }

    // 로그 출력
    console.log("✅ FCM 전송 완료:", {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

    // 클라이언트에 결과 응답
    res.status(200).json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });

  } catch (error) {
    // 오류 처리
    console.error("🔴 FCM 전송 실패:", error);
    res.status(500).json({
      error: "FCM 전송 중 서버 오류",
      detail: error.message,
    });
  }
}

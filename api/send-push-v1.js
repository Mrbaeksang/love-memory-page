import { initializeApp, cert, getApps } from "firebase-admin/app"; // Firebase Admin SDK 앱 초기화 관련 함수 가져오기
import { getMessaging } from "firebase-admin/messaging"; // Firebase Cloud Messaging (FCM) 관련 함수 가져오기
import { createClient } from "@supabase/supabase-js"; // Supabase 클라이언트 생성 함수 가져오기

// Supabase 관리자 클라이언트를 초기화합니다.
// 환경 변수에서 Supabase URL과 서비스 역할 키를 사용하여 Supabase에 연결합니다.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, // 공개적으로 사용되는 Supabase 프로젝트 URL
  process.env.SUPABASE_SERVICE_ROLE_KEY // 관리자 권한을 가진 Supabase 서비스 역할 키 (보안상 노출 주의)
);

// Firebase 서비스 계정 인증 정보를 디코딩합니다.
// 환경 변수에 Base64로 인코딩된 Firebase 관리자 키를 UTF-8 문자열로 변환하여 JSON 파싱합니다.
const decodedServiceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_ADMIN_KEY, "base64").toString("utf-8")
);

// Firebase 앱이 아직 초기화되지 않았다면 초기화합니다.
// 중복 초기화를 방지하기 위해 getApps()를 사용하여 이미 초기화된 앱이 있는지 확인합니다.
if (!getApps().length) {
  initializeApp({ credential: cert(decodedServiceAccount) }); // 디코딩된 서비스 계정 정보로 Firebase 앱 초기화
}

// Next.js API 라우터 핸들러 함수입니다.
// 클라이언트로부터 푸시 알림 요청을 처리합니다.
export default async function handler(req, res) {
  // CORS(Cross-Origin Resource Sharing) 헤더를 설정합니다.
  // 모든 Origin에서의 요청을 허용하고, POST 및 OPTIONS 메서드를 허용합니다.
  res.setHeader("Access-Control-Allow-Origin", "*"); // 모든 도메인에서의 요청 허용
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS"); // 허용되는 HTTP 메서드 설정
  res.setHeader("Access-Control-Allow-Headers", "Content-Type"); // 허용되는 요청 헤더 설정

  // HTTP OPTIONS 요청(Preflight 요청)에 대한 처리입니다.
  // 실제 요청을 보내기 전에 브라우저가 서버에 권한을 묻는 요청으로, 200 상태 코드를 반환하며 종료합니다.
  if (req.method === "OPTIONS") return res.status(200).end();
  // POST 메서드 이외의 요청이 들어오면 405 Method Not Allowed 에러를 반환합니다.
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 요청 본문에서 필요한 필드들을 추출합니다.
  const { registration_ids, title, body, click_action } = req.body;

  // 필수 필드(registration_ids, title, body)의 유효성을 검사합니다.
  // registration_ids는 배열이어야 하며, 비어있지 않아야 합니다.
  if (
    !registration_ids ||
    !Array.isArray(registration_ids) ||
    registration_ids.length === 0 ||
    !title ||
    !body
  ) {
    // 필드가 누락되었거나 유효하지 않으면 400 Bad Request 에러를 반환합니다.
    return res.status(400).json({ error: "Missing or invalid fields" });
  }

  try {
    // Firebase Cloud Messaging (FCM) 메시지 객체를 생성합니다.
    const message = {
      notification: { title, body }, // 알림의 제목과 본문 설정
      tokens: registration_ids, // 알림을 전송할 대상 디바이스 토큰 목록
      webpush: {
        // 웹 푸시 알림에 대한 설정 (아이콘, 클릭 시 이동할 링크 등)
        notification: {
          icon: "https://love-memory-page.vercel.app/icon-192.png", // 웹 푸시 알림에 표시될 아이콘 URL
        },
        fcmOptions: {
          link: click_action || "https://love-memory-page.vercel.app", // 알림 클릭 시 이동할 URL (없으면 기본 URL 사용)
        },
      },
      data: {
        // 클라이언트 앱에서 접근할 수 있는 사용자 정의 데이터 (클릭 시 이동할 URL 포함)
        url: click_action || "https://love-memory-page.vercel.app",
      },
    };

    // Firebase Admin SDK를 사용하여 여러 디바이스에 멀티캐스트 푸시 알림을 전송합니다.
    const response = await getMessaging().sendEachForMulticast(message);

    // FCM 전송 결과에서 실패한 토큰들을 식별합니다.
    const failedTokens = response.responses
      .map((r, idx) => (!r.success ? registration_ids[idx] : null)) // 전송 실패한 경우 해당 토큰을 반환
      .filter(Boolean); // null 값 필터링 (실패한 토큰만 남김)

    // 실패한 토큰이 존재할 경우 Supabase에서 해당 토큰들을 삭제합니다.
    if (failedTokens.length > 0) {
      console.warn("🧹 FCM 실패한 토큰 (삭제 시도):", failedTokens);

      // Supabase의 'notification_tokens' 테이블에서 실패한 토큰들을 삭제합니다.
      const { error: deleteError } = await supabase
        .from("notification_tokens") // 대상 테이블 지정
        .delete() // 삭제 작업
        .in("token", failedTokens); // 'token' 컬럼이 failedTokens 배열에 포함된 레코드 삭제

      // Supabase 토큰 삭제 중 에러가 발생했는지 확인합니다.
      if (deleteError) {
        console.error("❌ Supabase 토큰 삭제 실패:", deleteError);
      } else {
        console.log(`✅ Supabase에서 ${failedTokens.length}개 토큰 삭제 완료`);
      }
    }

    // FCM 전송 결과(성공/실패 카운트)를 콘솔에 로깅합니다.
    console.log("✅ FCM 전송 완료:", {
      successCount: response.successCount, // 성공적으로 전송된 알림 수
      failureCount: response.failureCount, // 전송에 실패한 알림 수
    });

    // 클라이언트에게 성공 응답을 보냅니다.
    res.status(200).json({
      success: true, // 요청 처리 성공 여부
      successCount: response.successCount, // 성공적으로 전송된 알림 수
      failureCount: response.failureCount, // 전송에 실패한 알림 수
    });
  } catch (error) {
    // FCM 전송 중 예외(에러)가 발생한 경우 에러를 콘솔에 로깅합니다.
    console.error("🔴 FCM 전송 실패:", error);
    // 클라이언트에게 500 Internal Server Error 응답을 보냅니다.
    res.status(500).json({
      error: "FCM 전송 중 서버 오류", // 사용자에게 표시될 일반적인 에러 메시지
      detail: error.message, // 에러의 상세 내용 (개발자용)
    });
  }
}
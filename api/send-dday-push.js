// ✅ 이 파일은 Vercel Cron이 직접 호출하는 HTTP 엔드포인트입니다.
// ESM (import) 사용 가능하게 작성됨

import { sendDailyDDayPush } from '../src/utils/sendDailyDDayPush.js'; // 경로 주의

export default async function handler(req, res) {
  const secret = req.query.key;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).end('Unauthorized');
  }

  try {
    await sendDailyDDayPush();
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('❌ D-Day 푸시 실패:', err);
    return res.status(500).json({ error: 'Push failed', detail: err.message });
  }
}

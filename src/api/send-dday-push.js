// /api/send-dday-push.js
import { sendDailyDDayPush } from '@/utils/sendDailyDDayPush';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // ✅ 보호: CRON_SECRET 헤더 검증
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  try {
    await sendDailyDDayPush();
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("🔴 D-Day 푸시 실패:", e);
    return res.status(500).json({ error: 'Push failed' });
  }
}

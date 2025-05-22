// api/send-dday-push.js
import { sendDailyDDayPush } from '../src/utils/sendDailyDDayPush.js'; // ✅ 이 줄이 필요함!

export default async function handler(req, res) {
  const userAgent = req.headers['user-agent'] || "";
  const isCronJob = userAgent.includes("vercel-cron");
  const secret = req.query.key;

  if (!isCronJob && secret !== process.env.CRON_SECRET) {
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

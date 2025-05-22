export default async function handler(req, res) {
  const userAgent = req.headers['user-agent'] || "";

  const isCronJob = userAgent.includes("vercel-cron");
  const secret = req.query.key;

  // ✅ Vercel Cron이 아닌 경우에만 보안 키 확인
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

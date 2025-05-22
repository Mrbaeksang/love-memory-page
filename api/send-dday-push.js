const { sendDailyDDayPush } = require('../src/utils/sendDailyDDayPush');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  const key = req.query.key;
  if (key !== process.env.CRON_SECRET) {
    res.statusCode = 401;
    return res.end('Unauthorized');
  }

  try {
    await sendDailyDDayPush();
    res.statusCode = 200;
    return res.end('✅ D-Day push sent');
  } catch (err) {
    console.error('❌ D-Day 푸시 실패:', err);
    res.statusCode = 500;
    return res.end('Push failed');
  }
};

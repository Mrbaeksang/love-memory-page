const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const { error } = await supabase.from('visitor_log').insert([
      { ip: String(ip), user_agent: userAgent }
    ]);

    if (error) {
      console.error("❌ Insert Error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Unexpected Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

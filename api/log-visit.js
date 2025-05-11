import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  const { page, referer, anon_user_id } = req.body || {};

  console.log("📌 ip:", ip);
  console.log("📌 user-agent:", userAgent);
  console.log("📌 page:", page);
  console.log("📌 referer:", referer);
  console.log("📌 anon_user_id:", anon_user_id);

  try {
    const { data, error } = await supabase.from('visitor_log').insert([
      {
        ip: String(ip),
        user_agent: userAgent,
        page,
        referer,
        anon_user_id,
      }
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
}

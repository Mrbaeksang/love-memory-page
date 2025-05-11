import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const page = req.headers['x-page-path'] || null;
  const referer = req.headers['x-referer'] || null;
  const anonUserId = req.headers['x-user-id'] || null;

  console.log("📌 ENV URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30));
  console.log("📌 ENV KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10));
  console.log("📌 ip:", ip);
  console.log("📌 user-agent:", userAgent);
  console.log("📌 page:", page);
  console.log("📌 referer:", referer);
  console.log("📌 anon_user_id:", anonUserId);

  try {
    const { data, error } = await supabase.from('visitor_log').insert([
      {
        ip: String(ip),
        user_agent: userAgent,
        page,
        referer,
        anon_user_id: anonUserId,
      }
    ]);

    console.log("📌 Insert result:", data, error);

    if (error) {
      console.error("❌ Supabase Insert Error:", error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Unexpected Error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

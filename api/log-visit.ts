import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성 (환경 변수 필요)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Vercel Serverless Function 엔트리포인트
export default async function handler(req: any, res: any) {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  const { error } = await supabase.from('visitor_log').insert([
    {
      ip: String(ip),
      user_agent: userAgent,
    },
  ]);

  if (error) {
    console.error('❌ Supabase Insert Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }

  return res.status(200).json({ success: true });
}

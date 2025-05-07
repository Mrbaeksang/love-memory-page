import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { user_id, token } = req.body;
  if (!user_id || !token) return res.status(400).json({ error: "필수 정보 누락" });

  const { error } = await supabase
    .from("notification_tokens")
    .delete()
    .eq("user_id", user_id)
    .eq("token", token);

  if (error) {
    return res.status(500).json({ error: "삭제 실패", detail: error.message });
  }

  return res.status(200).json({ message: "만료된 토큰 삭제됨" });
}

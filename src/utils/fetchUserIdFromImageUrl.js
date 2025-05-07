// src/utils/fetchUserIdFromImageUrl.js
import { supabase } from "../lib/supabaseClient";

/**
 * Supabase에서 이미지 URL을 기준으로 업로더의 user_id를 조회
 */
export async function fetchUserIdFromImageUrl(imgUrl) {
  const { data, error } = await supabase
    .from("gallery_metadata")
    .select("user_id")
    .eq("image_path", imgUrl)
    .maybeSingle();

  if (error) {
    console.warn("이미지 업로더 조회 실패:", error);
    return null;
  }

  return data?.user_id ?? null;
}

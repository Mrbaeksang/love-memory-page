import { supabase } from '../lib/supabaseClient';

// 마커에 댓글 추가
export const addCommentToMarker = async (markerId, commentData) => {
  const { data, error } = await supabase
    .from('travel_marker_comments')
    .insert([{
      marker_id: markerId,
      content: commentData.content,
      user_id: commentData.userId,
      created_at: new Date().toISOString()
    }])
    .select();

  if (error) throw error;
  return data?.[0];
};

// 마커의 모든 댓글 가져오기
export const getMarkerComments = async (markerId) => {
  const { data, error } = await supabase
    .from('travel_marker_comments')
    .select(`
      id,
      content,
      created_at,
      user_id,
      profiles:user_id (id, username, avatar_url)
    `)
    .eq('marker_id', markerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(comment => ({
    ...comment,
    user: comment.profiles || { id: comment.user_id, username: '익명' }
  }));
};

// 댓글의 마커 정보 가져오기
export const getCommentMarker = async (commentId) => {
  const { data, error } = await supabase
    .from('travel_marker_comments')
    .select(`
      marker:marker_id (
        id,
        region,
        reason,
        type,
        lat,
        lng,
        created_at
      )
    `)
    .eq('id', commentId)
    .single();

  if (error) return null;
  return data?.marker || null;
};

// 마커에 사진 업로드
export const uploadMarkerPhoto = async (markerId, file, userId = null) => {
  // 파일 업로드 로직 (Supabase Storage 사용)
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `marker-photos/${markerId}/${fileName}`;
  
  // 원본 이미지 업로드
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('markers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) throw uploadError;
  
  // 공개 URL 생성
  const { data: { publicUrl } } = supabase.storage
    .from('markers')
    .getPublicUrl(filePath);
  
  // 썸네일 URL (실제 구현에서는 이미지 리사이징 로직 필요)
  const thumbnailUrl = publicUrl; // 임시로 동일한 URL 사용
  
  // 데이터베이스에 메타데이터 저장
  const { data: photoData, error: dbError } = await supabase
    .from('travel_marker_images')
    .insert([{
      marker_id: markerId,
      image_url: publicUrl,
      thumbnail_url: thumbnailUrl,
      uploaded_by: userId,
      created_at: new Date().toISOString()
    }])
    .select();
  
  if (dbError) throw dbError;
  return photoData?.[0];
};

// 마커의 모든 사진 가져오기
export const getMarkerPhotos = async (markerId) => {
  const { data, error } = await supabase
    .from('travel_marker_images')
    .select(`
      id,
      image_url,
      thumbnail_url,
      created_at,
      uploaded_by
    `) // ❌ profiles 조인 제거
    .eq('marker_id', markerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(photo => ({
    ...photo,
    url: photo.image_url,
    user: { id: photo.uploaded_by } // ❗ 있을 경우만
  }));
};


// 마커 정보 가져오기
export const getMarkerById = async (markerId) => {
  const { data, error } = await supabase
    .from('travel_markers')
    .select('*')
    .eq('id', markerId)
    .single();
  
  if (error) throw error;
  return data;
};
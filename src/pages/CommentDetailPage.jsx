import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import styles from "./CommentDetailPage.module.css";

const CommentDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const commentInputRef = useRef(null);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likingIds, setLikingIds] = useState([]);

  const params = new URLSearchParams(location.search);
  const imgUrl = params.get("img");

  useEffect(() => {
    if (imgUrl) fetchComments();

    if (commentInputRef.current) {
      commentInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      commentInputRef.current.focus();
    }
  }, [imgUrl]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("gallery_comments")
      .select("*")
      .eq("image_url", imgUrl)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("댓글 가져오기 실패", error);
    } else {
      setComments(data || []);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
  
    // 1. 댓글 등록
    const { error } = await supabase.from("gallery_comments").insert([
      {
        image_url: imgUrl,
        content: newComment.trim(),
        created_at: new Date().toISOString(),
        like_count: 0,
      },
    ]);
  
    if (!error) {
      setNewComment("");
      fetchComments();
  
      // 2. 푸시 대상 유저 ID를 결정 (지금은 고정값으로 예시)
      const imageOwnerId = "sarang_lover"; // 🔧 이미지 주인 ID (후에 동적으로 가져올 수 있음)
  
      // 3. 토큰 조회
      const { data: tokenData, error: tokenErr } = await supabase
        .from("notification_tokens")
        .select("token")
        .eq("user_id", imageOwnerId)
        .single();
  
      if (tokenErr || !tokenData) {
        console.warn("FCM 토큰 조회 실패:", tokenErr);
      } else {
        // 4. 푸시 전송 요청
        await fetch("/api/send-push-v1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenData.token,
            title: "사진에 댓글이 달렸어요!",
            body: "예쁜 추억에 새로운 댓글이 도착했어요 💌",
            click_action: "https://love-memory-page.vercel.app/comment-detail?img=" + encodeURIComponent(imgUrl),
          }),
        });
      }
    } else {
      alert("댓글 등록 실패");
      console.error(error);
    }
  
    setSubmitting(false);
  };
  

  const handleLike = async (commentId) => {
    // 1. 좋아요 처리
    const { data, error } = await supabase.rpc("increment_like_count", {
      comment_id_input: commentId,
    });
  
    if (!error) {
      fetchComments();
  
      // 2. 댓글 정보 조회 (작성자 파악용)
      const { data: commentData, error: fetchError } = await supabase
        .from("gallery_comments")
        .select("*")
        .eq("id", commentId)
        .single();
  
      if (fetchError || !commentData) {
        console.warn("댓글 정보 조회 실패");
        return;
      }
  
      const commentOwnerId = commentData.user_id || "sarang_lover"; // 예시: 고정 ID 또는 향후 사용자 ID 필드 사용
  
      // 3. 해당 유저의 토큰 조회
      const { data: tokenData, error: tokenErr } = await supabase
        .from("notification_tokens")
        .select("token")
        .eq("user_id", commentOwnerId)
        .single();
  
      if (tokenErr || !tokenData) {
        console.warn("좋아요 푸시 - 토큰 조회 실패");
      } else {
        // 4. 푸시 전송
        await fetch("/api/send-push-v1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenData.token,
            title: "누군가 내 댓글에 공감했어요 💕",
            body: "소중한 말에 따뜻한 반응이 도착했어요.",
            click_action: "https://love-memory-page.vercel.app/comment-detail?img=" + encodeURIComponent(imgUrl),
          }),
        });
      }
    } else {
      alert("좋아요 실패");
    }
  };
  

  return (
    <div className={styles["comment-detail-container"]}>
      <button onClick={() => navigate(-1)} className={styles["comment-detail-back"]}>
        ← 뒤로가기
      </button>

      {imgUrl && (
        <div className={styles["comment-detail-image-wrapper"]}>
          <img src={imgUrl} alt="상세 이미지" className={styles["comment-detail-image"]} />
        </div>
      )}

      <div className={styles["comment-form"]}>
        <textarea
          ref={commentInputRef}
          placeholder="댓글을 입력하세요..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className={styles["comment-input"]}
          style={{ color: "#333" }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={styles["comment-submit"]}
        >
          {submitting ? "작성 중..." : "작성하기"}
        </button>
      </div>

      <div className={styles["comment-detail-box"]}>
        <h3 className={styles["comment-detail-title"]}>💬 댓글</h3>
        {comments.length === 0 ? (
          <p className={styles["comment-detail-empty"]}>아직 댓글이 없습니다.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className={styles["comment-detail-item"]}>
              <p>{c.content}</p>
              <div className={styles["comment-footer"]}>
                <span className={styles["comment-detail-date"]}>
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleLike(c.id, c.like_count ?? 0)}
                  className={styles["comment-like-btn"]}
                  disabled={likingIds.includes(c.id)}
                >
                  ❤️ {c.like_count ?? 0}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentDetailPage;

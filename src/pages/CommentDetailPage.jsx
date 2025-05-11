import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getAnonId } from "../utils/getAnonId";
import { sendPushToAll } from "../utils/sendPushToAll";
import usePageLogger from "../hooks/usePageLogger"; // ⬅ 이 줄 추가
import styles from "./CommentDetailPage.module.css";

const CommentDetailPage = () => {
  usePageLogger();
  const location = useLocation();
  const navigate = useNavigate();
  const commentInputRef = useRef(null);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likingIds, setLikingIds] = useState([]);

  const params = new URLSearchParams(location.search);
  const imgUrl = params.get("img");
  const highlightId = params.get("highlight");

  useEffect(() => {
    if (imgUrl) fetchComments();

    setTimeout(() => {
      commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      commentInputRef.current?.focus();
    }, 100);
  }, [imgUrl]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("gallery_comments")
      .select("*")
      .eq("image_url", imgUrl)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("댓글 불러오기 실패", error);
    } else {
      setComments(data || []);
    }
  };

  useEffect(() => {
    if (highlightId && comments.length > 0) {
      const el = document.getElementById(`comment-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add(styles["comment-highlight"]);

        // 애니메이션 종료 후 클래스 제거 (선택적)
        setTimeout(() => {
          el.classList.remove(styles["comment-highlight"]);
        }, 2500);
      }
    }
  }, [highlightId, comments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);

    const myUserId = getAnonId();

    const { data, error } = await supabase
      .from("gallery_comments")
      .insert([
        {
          image_url: imgUrl,
          content: newComment.trim(),
          created_at: new Date().toISOString(),
          like_count: 0,
          user_id: myUserId,
        },
      ])
      .select();

    if (!error && data?.[0]) {
      const newCommentId = data[0].id;
      setNewComment("");
      fetchComments();

      await sendPushToAll({
        title: "사진에 댓글이 달렸어요!",
        body: "예쁜 추억에 새로운 댓글이 도착했어요 💌",
        click_action: `https://love-memory-page.vercel.app/comment-detail?img=${encodeURIComponent(imgUrl)}&highlight=${newCommentId}`,
        excludeUserId: myUserId,
      });
    } else {
      alert("죄송해요 💔 댓글을 등록하는 데 문제가 생겼어요.\n잠시 후 다시 시도해 주세요.");
      console.error(error);
    }

    setSubmitting(false);
  };

  const handleLike = async (commentId) => {
    const myUserId = getAnonId();
    setLikingIds((prev) => (prev.includes(commentId) ? prev : [...prev, commentId]));

    const { error } = await supabase.rpc("increment_like_count", {
      comment_id_input: commentId,
    });

    if (!error) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, like_count: (c.like_count || 0) + 1 } : c
        )
      );

      await sendPushToAll({
        title: "누군가 내 댓글에 공감했어요 💕",
        body: "소중한 말에 따뜻한 반응이 도착했어요.",
        click_action: `https://love-memory-page.vercel.app/comment-detail?img=${encodeURIComponent(imgUrl)}&highlight=${commentId}`,
        excludeUserId: myUserId,
      });
    } else {
      alert("좋아요를 반영하지 못했어요 😢\n잠시 후 다시 시도해 주세요.");
      console.error(error);
    }

    setLikingIds((prev) => prev.filter((id) => id !== commentId));
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
            <div
              key={c.id}
              id={`comment-${c.id}`}
              className={styles["comment-detail-item"]}
            >
              <p>{c.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
              <div className={styles["comment-footer"]}>
                <span className={styles["comment-detail-date"]}>
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleLike(c.id)}
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

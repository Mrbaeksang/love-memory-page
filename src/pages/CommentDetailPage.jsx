import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import styles from "./CommentDetailPage.module.css";

const CommentDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const commentInputRef = useRef(null); // 자동 포커스용
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const params = new URLSearchParams(location.search);
  const imgUrl = params.get("img");

  useEffect(() => {
    if (imgUrl) fetchComments();

    // ✨ 포커스 자동 설정 및 스크롤 이동
    if (commentInputRef.current) {
      commentInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      commentInputRef.current.focus();
    }
  }, [imgUrl]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("gallery_comments")
      .select("*")
      .eq("image_url", imgUrl)
      .order("created_at", { ascending: false });

    setComments(data || []);
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);

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
    } else {
      alert("댓글 등록 실패");
      console.error(error);
    }

    setSubmitting(false);
  };

  const handleLike = async (id, currentCount) => {
    const { error } = await supabase
      .from("gallery_comments")
      .update({ like_count: currentCount + 1 })
      .eq("id", id);

    if (!error) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, like_count: (c.like_count ?? 0) + 1 } : c
        )
      );
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
          ref={commentInputRef} // 👈 자동 포커스 ref 추가됨
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

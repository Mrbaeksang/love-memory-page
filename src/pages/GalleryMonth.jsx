import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "./GalleryMonth.css";
import RandomCommentedImageButton from "../components/RandomCommentedImageButton";


const GalleryMonth = () => {
  const { year, month } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [modalImg, setModalImg] = useState(null);
  const modalImgRef = useRef(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  const title = `${year}년 ${parseInt(month, 10)}월의 우리`;
  const emotionText = "이 달의 소중한 추억들을 담았어요.";

  // 이미지 가져오기
  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .storage
        .from("gallery")
        .list(`${year}/${month}`, { limit: 100 });

      if (error) return console.error("❌ 이미지 목록 실패:", error);

      const urls = data
        .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f.name))
        .map((f) =>
          supabase.storage.from("gallery").getPublicUrl(`${year}/${month}/${f.name}`).data.publicUrl
        );

      setImages(urls);
    };
    fetchImages();
  }, [year, month]);

  // 댓글 불러오기
  const fetchComments = async (url) => {
    const { data, error } = await supabase
      .from("gallery_comments")
      .select("*")
      .eq("image_url", url)
      .order("created_at", { ascending: false });

    if (!error) setComments(data);
  };

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!comment.trim()) return;

    const { error } = await supabase.from("gallery_comments").insert({
      image_url: modalImg,
      content: comment.trim(),
    });

    if (!error) {
      setComment("");
      fetchComments(modalImg);
    } else {
      alert("❌ 댓글 저장 실패");
    }
  };

  // Enter 키 입력 시 댓글 전송
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (id) => {
    const { error } = await supabase.from("gallery_comments").delete().eq("id", id);
    if (!error) fetchComments(modalImg);
  };

  // 모달 오픈
  const handleModalOpen = (url) => {
    setModalImg(url);
    fetchComments(url);
  };

  // 모바일 pinch-to-zoom
  useEffect(() => {
    if (!modalImg) return;
    const img = modalImgRef.current;
    if (!img) return;

    let scale = 1, lastDist = null;

    const getDist = (e) => {
      const [t1, t2] = e.touches;
      return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) lastDist = getDist(e);
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && lastDist) {
        const dist = getDist(e);
        const newScale = Math.min(Math.max(scale * (dist / lastDist), 1), 3);
        img.style.transform = `scale(${newScale})`;
        if (Math.abs(newScale - scale) > 0.01) scale = newScale;
        lastDist = dist;
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      img.style.transform = "scale(1)";
      scale = 1;
      lastDist = null;
    };

    img.addEventListener("touchstart", onTouchStart, { passive: false });
    img.addEventListener("touchmove", onTouchMove, { passive: false });
    img.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      img.removeEventListener("touchstart", onTouchStart);
      img.removeEventListener("touchmove", onTouchMove);
      img.removeEventListener("touchend", onTouchEnd);
    };
  }, [modalImg]);

  // 메인 화면
  if (!images.length) {
    return (
      <div className="gallery-month-bg">
        <div className="gallery-header-bar">
          <button className="gallery-home-btn" onClick={() => navigate("/")}>← 홈으로</button>
        </div>
        <h2 className="gallery-month-title">{title}</h2>
        <div className="gallery-month-emotion">{emotionText}</div>
        <div className="gallery-month-empty">아직 등록된 추억이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="gallery-month-bg">
      <div className="gallery-header-bar">
        <button className="gallery-home-btn" onClick={() => navigate("/")}>← 홈으로</button>
      </div>
      <h2 className="gallery-month-title">{title}</h2>
      <div className="gallery-month-emotion">{emotionText}</div>

      <RandomCommentedImageButton onSelect={(url) => {
  setModalImg(url);
  fetchComments(url);
}} />


      <div className="gallery-month-grid">
        {images.map((url, idx) => (
          <div className="gallery-photo-card" key={url}>
            <img
              src={url}
              alt={`추억 ${idx + 1}`}
              className="gallery-photo-img"
              loading="lazy"
              onClick={() => handleModalOpen(url)}
              onError={(e) => (e.target.style.display = "none")}
              style={{ cursor: "zoom-in" }}
            />
          </div>
        ))}
      </div>

      {/* 모달 */}
      {modalImg && (
        <div className="gallery-modal-bg" onClick={() => setModalImg(null)}>
          <div className="gallery-modal-img-wrap" onClick={(e) => e.stopPropagation()}>
            <img ref={modalImgRef} src={modalImg} alt="확대 이미지" className="gallery-modal-img" />

            <div className="gallery-comment-box">
              <textarea
                className="gallery-comment-textarea"
                placeholder="이 사진에 대한 감상을 남겨보세요 ✍️"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="gallery-comment-submit" onClick={handleSubmitComment}>
                댓글 남기기
              </button>

              <div className="gallery-comment-list">
                {comments.length === 0 && (
                  <div style={{ color: "#aaa", fontSize: "0.95rem", marginTop: "8px" }}>
                    아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                  </div>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="gallery-comment-item fade-in">
                    <p>{c.content}</p>
                    <div className="comment-meta">
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      <button className="comment-delete" onClick={() => handleDeleteComment(c.id)}>
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryMonth;

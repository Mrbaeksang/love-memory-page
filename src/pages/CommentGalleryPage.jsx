import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import styles from "./CommentGalleryPage.module.css";

const CommentGalleryPage = () => {
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  const shuffleArray = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  

  useEffect(() => {
    const fetchCommentedImages = async () => {
      const { data, error } = await supabase
        .from("gallery_comments")
        .select("image_url")
        .neq("image_url", "");

      if (error || !data) {
        console.error("댓글 이미지 조회 오류:", error);
        return;
      }

      const counts = {};
      data.forEach((item) => {
        if (item.image_url in counts) counts[item.image_url]++;
        else counts[item.image_url] = 1;
      });

      const uniqueUrls = Object.entries(counts).map(([url, count]) => ({
        url,
        count,
      }));

      setImages(shuffleArray(uniqueUrls));

    };

    fetchCommentedImages();
  }, []);

  const goToDetail = (imgUrl) => {
    navigate(`/comment-detail?img=${encodeURIComponent(imgUrl)}`);
  };

  return (
    <div className={styles["comment-gallery-container"]}>
      <button
        onClick={() => navigate("/")}
        className={styles["back-home-button"]}
      >
        ← 홈으로 돌아가기
      </button>

      <h2 className={styles["comment-gallery-title"]}>💬 댓글이 달린 사진들</h2>

      <div className={styles["comment-gallery-grid"]}>
        {images.map((img, idx) => (
          <div
            key={idx}
            onClick={() => goToDetail(img.url)}
            className={styles["comment-gallery-card"]}
          >
            <img
              src={img.url}
              alt={`댓글이미지-${idx}`}
              className={styles["comment-gallery-image"]}
            />
            <div className={styles["comment-gallery-badge"]}>💬 {img.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentGalleryPage;

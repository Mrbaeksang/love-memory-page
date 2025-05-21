import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import usePageLogger from "../hooks/usePageLogger";
import styles from "./CommentGalleryPage.module.css";

const CommentGalleryPage = () => {
  usePageLogger();
  const navigate = useNavigate();

  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("latest"); // 기본: 최신순

  useEffect(() => {
    const fetchCommentedImages = async () => {
      const { data, error } = await supabase
        .from("gallery_comments")
        .select("image_url, created_at")
        .neq("image_url", "");

      if (error) {
        console.error("댓글 이미지 조회 오류:", error);
        setLoading(false);
        return;
      }

      setRawData(data || []);
      setLoading(false);
    };

    fetchCommentedImages();
  }, []);

  // 📦 이미지 중복 제거 + 카운트 + 최근 시간
  const aggregateImages = () => {
    const map = new Map();
    rawData.forEach(({ image_url, created_at }) => {
      if (!map.has(image_url)) {
        map.set(image_url, { url: image_url, count: 1, latest: created_at });
      } else {
        const existing = map.get(image_url);
        existing.count += 1;
        if (new Date(created_at) > new Date(existing.latest)) {
          existing.latest = created_at;
        }
      }
    });

    let arr = Array.from(map.values());

    // 📌 정렬
    switch (sortOrder) {
      case "latest":
        arr.sort((a, b) => new Date(b.latest) - new Date(a.latest));
        break;
      case "oldest":
        arr.sort((a, b) => new Date(a.latest) - new Date(b.latest));
        break;
      case "most":
        arr.sort((a, b) => b.count - a.count);
        break;
      case "least":
        arr.sort((a, b) => a.count - b.count);
        break;
      default:
        break;
    }

    // 🌀 셔플
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
  };

  const images = aggregateImages();

  return (
    <div className={styles["comment-gallery-container"]}>
      <button
        onClick={() => navigate("/")}
        className={styles["back-home-button"]}
      >
        ← 홈으로 돌아가기
      </button>

      <h2 className={styles["comment-gallery-title"]}>💬 댓글이 달린 사진들</h2>

      <div className={styles["sort-buttons"]}>
        <button
          className={sortOrder === "latest" ? styles.active : ""}
          onClick={() => setSortOrder("latest")}
        >
          최신순
        </button>
        <button
          className={sortOrder === "oldest" ? styles.active : ""}
          onClick={() => setSortOrder("oldest")}
        >
          오래된순
        </button>
        <button
          className={sortOrder === "most" ? styles.active : ""}
          onClick={() => setSortOrder("most")}
        >
          많은순
        </button>
        <button
          className={sortOrder === "least" ? styles.active : ""}
          onClick={() => setSortOrder("least")}
        >
          적은순
        </button>
      </div>

      {loading ? (
        <div className={styles["loading-container"]}>
          <div className={styles["loading-spinner"]}></div>
          <p>사진 불러오는 중...</p>
        </div>
      ) : images.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: "2rem" }}>
          댓글이 달린 이미지가 없습니다.
        </p>
      ) : (
        <div className={styles["comment-gallery-grid"]}>
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() =>
                navigate(`/comment-detail?img=${encodeURIComponent(img.url)}`)
              }
              className={styles["comment-gallery-card"]}
            >
              <img
                src={img.url}
                alt={`댓글이미지-${idx}`}
                className={styles["comment-gallery-image"]}
              />
              <div className={styles["comment-gallery-badge"]}>
                💬 {img.count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentGalleryPage;

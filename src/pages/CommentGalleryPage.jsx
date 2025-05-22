import React, { useEffect, useState, useMemo } from "react"; // useMemo 훅 추가
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import usePageLogger from "../hooks/usePageLogger";
import styles from "./CommentGalleryPage.module.css";

const CommentGalleryPage = () => {
  usePageLogger(); // 페이지 로깅 훅 사용
  const navigate = useNavigate(); // 페이지 이동을 위한 훅

  const [rawData, setRawData] = useState([]); // Supabase에서 가져온 원본 댓글 데이터
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [sortOrder, setSortOrder] = useState("latest"); // 정렬 순서 (기본: 최신순)

  useEffect(() => {
    const fetchCommentedImages = async () => {
      const { data, error } = await supabase
        .from("gallery_comments")
        .select("image_url, created_at") // 이미지 URL과 생성 시간만 선택
        .neq("image_url", ""); // image_url이 비어있지 않은 것만 가져옴

      if (error) {
        console.error("댓글 이미지 조회 오류:", error);
        setLoading(false); // 오류 발생 시 로딩 중지
        return;
      }

      setRawData(data || []); // 데이터 설정 (null일 경우 빈 배열로)
      setLoading(false); // 로딩 완료
    };

    fetchCommentedImages(); // 컴포넌트 마운트 시 데이터 가져오기
  }, []); // 의존성 배열이 비어있으므로 한 번만 실행

  // 📦 이미지 중복 제거 + 카운트 + 최근 시간 (정렬은 여기서 하지 않음)
  const aggregatedImages = useMemo(() => {
    const map = new Map();
    rawData.forEach(({ image_url, created_at }) => {
      if (!map.has(image_url)) {
        map.set(image_url, { url: image_url, count: 1, latest: created_at });
      } else {
        const existing = map.get(image_url);
        existing.count += 1;
        // 더 최신 댓글이 있다면 latest 업데이트
        if (new Date(created_at) > new Date(existing.latest)) {
          existing.latest = created_at;
        }
      }
    });
    return Array.from(map.values());
  }, [rawData]); // rawData가 변경될 때만 다시 계산

  // 📌 정렬 로직 (sortOrder 또는 aggregatedImages가 변경될 때마다 재정렬)
  const sortedAndShuffledImages = useMemo(() => {
    let arr = [...aggregatedImages]; // 원본 배열을 복사하여 사용

    switch (sortOrder) {
      case "latest":
        arr.sort((a, b) => new Date(b.latest) - new Date(a.latest)); // 최신순
        break;
      case "oldest":
        arr.sort((a, b) => new Date(a.latest) - new Date(b.latest)); // 오래된순
        break;
      case "most":
        arr.sort((a, b) => b.count - a.count); // 댓글 많은순
        break;
      case "least":
        arr.sort((a, b) => a.count - b.count); // 댓글 적은순
        break;
      case "random": // 랜덤 정렬 옵션 추가 (셔플)
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        break;
      default:
        break;
    }
    return arr;
  }, [aggregatedImages, sortOrder]); // aggregatedImages 또는 sortOrder가 변경될 때만 다시 계산

  return (
    <div className={styles["comment-gallery-container"]}>
      {/* 홈으로 돌아가기 버튼 */}
      <button
        onClick={() => navigate("/")}
        className={styles["back-home-button"]}
      >
        ← 홈으로 돌아가기
      </button>

      {/* 페이지 제목 */}
      <h2 className={styles["comment-gallery-title"]}>💬 댓글이 달린 사진들</h2>

      {/* 정렬 버튼 그룹 */}
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
          댓글 많은순
        </button>
        <button
          className={sortOrder === "least" ? styles.active : ""}
          onClick={() => setSortOrder("least")}
        >
          댓글 적은순
        </button>
         <button
          className={sortOrder === "random" ? styles.active : ""}
          onClick={() => setSortOrder("random")}
        >
          랜덤
        </button>
      </div>

      {/* 로딩 상태 및 이미지 목록 조건부 렌더링 */}
      {loading ? (
        <div className={styles["loading-container"]}>
          <div className={styles["loading-spinner"]}></div>
          <p>사진 불러오는 중...</p>
        </div>
      ) : sortedAndShuffledImages.length === 0 ? ( // 댓글 달린 이미지가 없을 경우
        <p className={styles["no-images-message"]}>
          댓글이 달린 이미지가 없습니다. 첫 댓글을 남겨보세요!
        </p>
      ) : (
        // 댓글 달린 이미지 그리드
        <div className={styles["comment-gallery-grid"]}>
          {sortedAndShuffledImages.map((img, idx) => (
            <div
              key={img.url || idx} // 고유한 URL을 key로 사용하거나 fallback으로 idx
              onClick={() =>
                navigate(`/comment-detail?img=${encodeURIComponent(img.url)}`)
              }
              className={styles["comment-gallery-card"]}
            >
              <img
                src={img.url}
                alt={`댓글 이미지 ${idx + 1}`}
                className={styles["comment-gallery-image"]}
                onError={(e) => { // 이미지 로드 실패 시 대체 이미지 또는 숨김 처리
                    e.target.style.display = 'none'; // 이미지를 숨김
                    // e.target.src = '/path/to/placeholder-image.png'; // 대체 이미지 사용 시
                }}
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
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getAnonId } from "../utils/getAnonId";
import { sendPushToAll } from "../utils/sendPushToAll";
import usePageLogger from "../hooks/usePageLogger";
import { getCommentMarker, getMarkerPhotos } from "../api/markers";
import { FiMapPin, FiImage } from "react-icons/fi";
import styles from "./CommentDetailPage.module.css";
import "./CommentDetailPage.css";

const CommentDetailPage = () => {
  usePageLogger();
  const location = useLocation();
  const navigate = useNavigate();
  const commentInputRef = useRef(null);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likingIds, setLikingIds] = useState([]);
  const [marker, setMarker] = useState(null);
  const [markerPhotos, setMarkerPhotos] = useState([]);
  const [isLoadingMarker, setIsLoadingMarker] = useState(true);

  const params = new URLSearchParams(location.search);
  const imgUrl = params.get("img");
  const highlightId = params.get("highlight");


  const [visitedMarkers, setVisitedMarkers] = useState([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [currentPhotoMarker, setCurrentPhotoMarker] = useState(null);


  const fetchMarkerInfo = useCallback(async () => {
    if (!imgUrl) return;
    
    try {
      setIsLoadingMarker(true);
      
      // 먼저 이미지와 연결된 마커 정보 확인
      const { data: imageData, error: imageError } = await supabase
        .from('travel_marker_images')
        .select('marker_id')
        .eq('image_url', imgUrl)
        .single();

      if (imageError && imageError.code !== 'PGRST116') { // PGRST116은 데이터가 없을 때 발생하는 에러 코드
        throw imageError;
      }

      if (imageData && imageData.marker_id) {
        // 이미지와 연결된 마커가 있으면 해당 마커 정보 가져오기
        const { data: markerData, error: markerError } = await supabase
          .from('travel_markers')
          .select('*')
          .eq('id', imageData.marker_id)
          .single();

        if (markerError) throw markerError;
        
        if (markerData) {
          setMarker(markerData);
          setCurrentPhotoMarker(markerData);
          
          // 해당 마커의 사진 목록 가져오기
          const { data: photos, error: photosError } = await supabase
            .from('travel_marker_images')
            .select('*')
            .eq('marker_id', markerData.id);
            
          if (!photosError) {
            setMarkerPhotos(photos || []);
          }
          return;
        }
      }
      
      // 이미지와 연결된 마커가 없으면 댓글 ID로 마커 정보 확인 (기존 로직 유지)
      const commentId = location.pathname.split('/').pop();
      if (commentId) {
        const markerData = await getCommentMarker(commentId);
        if (markerData) {
          setMarker(markerData);
          setCurrentPhotoMarker(markerData);
          
          const photos = await getMarkerPhotos(markerData.id);
          setMarkerPhotos(photos || []);
        }
      }
      
    } catch (error) {
      console.error('마커 정보를 가져오는 중 오류 발생:', error);
    } finally {
      setIsLoadingMarker(false);
    }
  }, [imgUrl, location.pathname]);

  // 방문한 마커 목록 가져오기
  useEffect(() => {
    const fetchVisitedMarkers = async () => {
      const { data, error } = await supabase
        .from("travel_markers")
        .select("*")
        .eq("type", "visited");

      if (error) {
        console.error("Visited 마커 로딩 실패:", error);
      } else {
        setVisitedMarkers(data || []);
      }
    };

    fetchVisitedMarkers();
  }, []);
  
  // 이미지 URL이 변경될 때마다 마커 정보 다시 가져오기
  useEffect(() => {
    if (imgUrl) {
      const loadData = async () => {
        await Promise.all([
          fetchComments(),
          fetchMarkerInfo()
        ]);
        
        // 댓글 입력창으로 스크롤
        setTimeout(() => {
          commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          commentInputRef.current?.focus();
        }, 100);
      };
      
      loadData();
    }
  }, [imgUrl, fetchMarkerInfo]);

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

  
  const handleMarkerLinkChange = (e) => {
    setSelectedMarkerId(e.target.value);
  };

  const linkPhotoToMarker = async () => {
    if (!selectedMarkerId || !imgUrl) {
      alert('연결할 여행지를 선택해주세요.');
      return;
    }

    if (!window.confirm('선택한 여행지와 이 사진을 연결하시겠습니까?')) {
      return;
    }

    setIsLinking(true);

    try {
      // 기존 연결이 있는지 확인
      const { data: existingLinks, error: checkError } = await supabase
        .from('travel_marker_images')
        .select('id')
        .eq('image_url', imgUrl);

      if (checkError) throw checkError;

      if (existingLinks && existingLinks.length > 0) {
        // 기존 연결 업데이트
        const { error: updateError } = await supabase
          .from('travel_marker_images')
          .update({ 
            marker_id: selectedMarkerId,
            updated_at: new Date().toISOString()
          })
          .eq('image_url', imgUrl);

        if (updateError) throw updateError;
      } else {
        // 새 연결 생성
        const { error: insertError } = await supabase
          .from('travel_marker_images')
          .insert([{
            marker_id: selectedMarkerId,
            image_url: imgUrl,
            created_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      // 성공 피드백
      alert('✅ 사진이 성공적으로 여행지와 연결되었습니다!');
      
      // 현재 선택된 마커 정보 업데이트
      const selectedMarker = visitedMarkers.find(m => m.id === selectedMarkerId);
      setCurrentPhotoMarker(selectedMarker);
      
      // 마커 정보 다시 불러오기
      fetchMarkerInfo();
      
    } catch (error) {
      console.error('마커 연결 중 오류 발생:', error);
      alert('마커 연결 중 오류가 발생했습니다. 나중에 다시 시도해주세요.');
    } finally {
      setIsLinking(false);
    }
  };

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

      {/* 이미지 표시 섹션 */}
      {imgUrl && (
        <div className="image-container" style={{ marginBottom: '20px' }}>
          <img 
            src={imgUrl} 
            alt="댓글이 달린 사진" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '500px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }} 
          />
        </div>
      )}

      {/* 마커 연결 섹션 */}
      {visitedMarkers.length > 0 && !marker && (
        <div className="marker-link-section">
          <h3>
            <FiMapPin />
            여행지 연결하기
          </h3>
          <div className="marker-select-container">
            <select
              value={selectedMarkerId}
              onChange={handleMarkerLinkChange}
              className="marker-select"
              disabled={isLinking}
            >
              <option value="">여행지 선택</option>
              {visitedMarkers.map(marker => (
                <option key={marker.id} value={marker.id}>
                  {marker.region} {marker.reason ? `(${marker.reason})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={linkPhotoToMarker}
              disabled={!selectedMarkerId || isLinking}
              className="link-button"
            >
              {isLinking ? '연결 중...' : '연결하기'}
            </button>
          </div>
          {currentPhotoMarker && (
            <div className="current-marker-info">
              <FiMapPin className="pin-icon" />
              <span>
                현재 연결된 여행지: <strong>{currentPhotoMarker.region}</strong>
                {currentPhotoMarker.reason && ` (${currentPhotoMarker.reason})`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 마커와 연동된 여행지 섹션 */}
      {!isLoadingMarker && marker && (
        <div className="marker-section">
          <div className="marker-header">
            <FiMapPin className="marker-icon" />
            <h3>연결된 여행지: {marker.region}</h3>
          </div>
          <p className="marker-reason">{marker.reason}</p>
          
          {markerPhotos.length > 0 && (
            <div className="marker-photos-preview">
              <div className="photos-count">
                <FiImage /> {markerPhotos.length}장의 사진
              </div>
              <button 
                onClick={() => navigate(`/travel-map/photos/${marker.id}`)}
                className="view-photos-button"
              >
                사진 모두 보기
              </button>
            </div>
          )}
          
          <div className="photo-grid-preview">
            {markerPhotos.slice(0, 3).map((photo, index) => (
              <div 
                key={photo.id} 
                className="photo-thumbnail"
                onClick={() => navigate(`/travel-map/photos/${marker.id}?photo=${photo.id}`)}
                style={{
                  backgroundImage: `url(${photo.thumbnail_url || photo.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                aria-label={`${index + 1}번째 사진 보기`}
              />
            ))}
            {markerPhotos.length > 3 && (
              <div className="more-photos-overlay">
                +{markerPhotos.length - 3}장 더보기
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={styles.commentInputContainer} ref={commentInputRef}>
        <textarea
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

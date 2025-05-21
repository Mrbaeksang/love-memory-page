import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import usePageLogger from "../hooks/usePageLogger";
import "./GalleryMonth.css";
import RandomCommentedImageButton from "../components/RandomCommentedImageButton";
import { sendPushToAll } from "../utils/sendPushToAll";
import { getAnonId } from "../utils/getAnonId";


// 새로운 API 함수 추가 (나중에 별도 파일로 분리할 수도 있지만, 일단 여기에 추가)
// 모든 방문한 마커 가져오기
async function getVisitedMarkers() {
  const { data, error } = await supabase
    .from("travel_markers")
    .select("id, region, reason")
    .eq("type", "visited");
  if (error) {
    console.error("❌ 방문한 마커 불러오기 실패:", error);
    return [];
  }
  return data;
}

// 특정 이미지에 연결된 마커 정보 가져오기
async function getImageMarker(imageUrl) {
  const { data, error } = await supabase
    .from("travel_marker_images")
    .select("marker_id")
    .eq("image_url", imageUrl)
    .single(); // 단일 결과 기대
  if (error && error.code !== 'PGRST116') { // PGRST116은 데이터가 없을 때 발생하는 에러
    console.error("❌ 이미지 마커 정보 불러오기 실패:", error);
    return null;
  }
  if (data && data.marker_id) {
    const { data: markerData, error: markerError } = await supabase
      .from("travel_markers")
      .select("id, region, reason")
      .eq("id", data.marker_id)
      .single();
    if (markerError) {
      console.error("❌ 연결된 마커 상세 정보 불러오기 실패:", markerError);
      return null;
    }
    return markerData;
  }
  return null;
}

// 이미지와 마커 연결 (또는 업데이트)
async function linkImageToMarker(imageUrl, markerId) {
  // 먼저 해당 image_url이 이미 존재하는지 확인
  const { data: existingEntry, error: selectError } = await supabase
    .from("travel_marker_images")
    .select("id")
    .eq("image_url", imageUrl)
    .single();

  if (selectError && selectError.code !== 'PGRST116') { // PGRST116은 데이터가 없을 때 발생하는 에러
    console.error("❌ 기존 이미지-마커 연결 확인 실패:", selectError);
    return { success: false, message: "기존 연결 확인 실패" };
  }

  if (existingEntry) {
    // 이미 존재하면 업데이트
    const { error: updateError } = await supabase
      .from("travel_marker_images")
      .update({ marker_id: markerId })
      .eq("image_url", imageUrl);
    if (updateError) {
      console.error("❌ 이미지-마커 연결 업데이트 실패:", updateError);
      return { success: false, message: "연결 업데이트 실패" };
    }
    return { success: true, message: "마커 연결이 업데이트되었습니다." };
  } else {
    // 존재하지 않으면 새로 삽입
    const { error: insertError } = await supabase
      .from("travel_marker_images")
      .insert({ image_url: imageUrl, marker_id: markerId });
    if (insertError) {
      console.error("❌ 이미지-마커 연결 삽입 실패:", insertError);
      return { success: false, message: "연결 삽입 실패" };
    }
    return { success: true, message: "마커와 사진이 연결되었습니다." };
  }
}

const GalleryMonth = () => {
  usePageLogger();
  const { year, month } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [modalImg, setModalImg] = useState(null);
  const modalImgRef = useRef(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  // --- 1단계: 마커 연동을 위한 새로운 상태들 ---
  const [visitedMarkers, setVisitedMarkers] = useState([]); // 방문한 마커 목록
  const [selectedMarkerId, setSelectedMarkerId] = useState(""); // 드롭다운에서 선택된 마커 ID
  const [currentPhotoMarker, setCurrentPhotoMarker] = useState(null); // 현재 사진이 연결된 마커 정보
  const [isLoadingMarkerLink, setIsLoadingMarkerLink] = useState(true); // 마커 연결 정보 로딩 중
  // --- 1단계: 새로운 상태들 끝 ---

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

    const shuffled = shuffleArray(urls);
    setImages(shuffled);
  };

  fetchImages();
}, [year, month]);


  // 댓글 가져오기
  const fetchComments = async (imageUrl) => {
    if (!imageUrl) return;
    const { data, error } = await supabase
      .from("gallery_comments")
      .select("*")
      .eq("image_url", imageUrl)
      .order("created_at", { ascending: false });

    if (error) return console.error("❌ 댓글 불러오기 실패:", error);
    setComments(data);
  };

  const handleSubmitComment = async () => {
    if (!comment.trim() || !modalImg) return;
    const anonId = "anonymous"; // 여기에 실제 사용자 ID 로직이 있다면 추가
    const { error } = await supabase
      .from("gallery_comments")
      .insert({ image_url: modalImg, content: comment, user_id: anonId });

    if (error) {
      console.error("❌ 댓글 추가 실패:", error);
      alert("댓글 추가에 실패했습니다.");
    } else {
      setComment("");
      fetchComments(modalImg); // 댓글 다시 불러오기
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;
    const { error } = await supabase
      .from("gallery_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("❌ 댓글 삭제 실패:", error);
      alert("댓글 삭제에 실패했습니다.");
    } else {
      fetchComments(modalImg); // 댓글 다시 불러오기
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleModalOpen = async (url) => {
    setModalImg(url);
    fetchComments(url);
    // --- 1단계: 모달 열릴 때 마커 정보 로딩 ---
    setIsLoadingMarkerLink(true);
    setSelectedMarkerId(""); // 모달 열릴 때 선택 초기화
    setCurrentPhotoMarker(null); // 모달 열릴 때 현재 연결된 마커 정보 초기화

    const markerInfo = await getImageMarker(url);
    if (markerInfo) {
      setCurrentPhotoMarker(markerInfo);
      setSelectedMarkerId(markerInfo.id); // 드롭다운 기본값 설정
    }
    setIsLoadingMarkerLink(false);
    // --- 1단계: 마커 정보 로딩 끝 ---
  };

  // --- 1단계: 마커 연동 기능 관련 useEffect 및 함수들 ---
  useEffect(() => {
    // 방문한 마커 목록 불러오기
    const loadVisitedMarkers = async () => {
      const markers = await getVisitedMarkers();
      setVisitedMarkers(markers);
    };
    loadVisitedMarkers();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  const handleLinkMarker = async () => {
  if (!modalImg || !selectedMarkerId) {
    alert("사진과 연결할 마커를 선택해주세요.");
    return;
  }

  setIsLoadingMarkerLink(true);

  try {
    const { success, message } = await linkImageToMarker(modalImg, selectedMarkerId);

    if (!success) {
      alert("마커 연결에 실패했습니다: " + message);
      return;
    }

    alert(message);

    // 연결 후 마커 정보 갱신
    const updatedMarkerInfo = await getImageMarker(modalImg);
    setCurrentPhotoMarker(updatedMarkerInfo);

    // 🔔 푸시 알림 발송
    await sendPushToAll({
      title: "📍 사진이 여행지에 연결되었어요!",
      body: "함께한 추억이 지도에 기록되었습니다.",
      click_action: `https://love-memory-page.vercel.app/#/travel-map/photos/${selectedMarkerId}?photo=${encodeURIComponent(modalImg)}`,
      excludeUserId: getAnonId(),
    });

  } catch (error) {
    console.error("❌ 마커 연결 처리 중 오류:", error);
    alert("알 수 없는 오류가 발생했습니다.");
  } finally {
    setIsLoadingMarkerLink(false);
  }
};

  // --- 1단계: 마커 연동 기능 관련 useEffect 및 함수들 끝 ---


  return (
    <div className="gallery-month-page">
      <h2 className="gallery-month-title">{title}</h2>
      <p className="gallery-month-emotion">{emotionText}</p>

      <RandomCommentedImageButton onSelect={(url) => {
        handleModalOpen(url); // 랜덤 버튼 클릭 시도 모달 열기
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

            {/* --- 1단계: 마커 연동 UI 추가 --- */}
            <div className="marker-link-section">
              {isLoadingMarkerLink ? (
                <p>마커 정보 불러오는 중...</p>
              ) : currentPhotoMarker ? (
                <div className="linked-marker-info">
                  <p>
                    📍 **연결된 여행지:** {currentPhotoMarker.region} ({currentPhotoMarker.reason})
                  </p>
                  <button
                    className="view-marker-photos-button"
                    onClick={() => navigate(`/travel-map/photos/${currentPhotoMarker.id}?photo=${encodeURIComponent(modalImg)}`)}
                  >
                    이 여행지 사진 모두 보기
                  </button>
                </div>
              ) : (
                <>
                  <label htmlFor="marker-select">📍 이 사진을 방문한 장소에 연결:</label>
                  <select
                    id="marker-select"
                    onChange={(e) => setSelectedMarkerId(e.target.value)}
                    value={selectedMarkerId}
                    className="marker-select-dropdown"
                  >
                    <option value="">-- 마커 선택 --</option>
                    {visitedMarkers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.region} ({m.reason})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleLinkMarker}
                    disabled={!selectedMarkerId}
                    className="link-marker-button"
                  >
                    🔗 마커에 사진 연결
                  </button>
                </>
              )}
            </div>
            {/* --- 1단계: 마커 연동 UI 끝 --- */}


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
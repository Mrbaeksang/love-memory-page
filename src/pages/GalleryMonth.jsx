import React, { useEffect, useState, useRef } from "react"; // React 훅 임포트 (useEffect, useState, useRef)
import { useParams, useNavigate } from "react-router-dom"; // React Router 훅 임포트 (URL 파라미터, 페이지 이동)
import { supabase } from "../lib/supabaseClient"; // Supabase 클라이언트 임포트
import usePageLogger from "../hooks/usePageLogger"; // 페이지 로깅 커스텀 훅 임포트
import "./GalleryMonth.css"; // 컴포넌트 스타일시트 임포트
import RandomCommentedImageButton from "../components/RandomCommentedImageButton"; // 랜덤 댓글 이미지 버튼 컴포넌트 임포트
import { sendPushToAll } from "../utils/sendPushToAll"; // 푸시 알림 발송 유틸 함수 임포트
import { getAnonId } from "../utils/getAnonId"; // 익명 사용자 ID 가져오는 유틸 함수 임포트

// 이미지 배열을 랜덤으로 섞는 유틸 함수
function shuffleArray(array) {
  // 배열의 복사본을 생성하여 원본 배열을 변경하지 않음
  return [...array].sort(() => Math.random() - 0.5); 
}

// 새로운 API 함수: 모든 방문한 마커(여행지) 정보 가져오기
async function getVisitedMarkers() {
  const { data, error } = await supabase
    .from("travel_markers") // 'travel_markers' 테이블에서 데이터 조회
    .select("id, region, reason") // 'id', 'region', 'reason' 컬럼 선택
    .eq("type", "visited"); // 'type'이 'visited'인 레코드만 필터링
  if (error) {
    console.error("❌ 방문한 마커 불러오기 실패:", error); // 에러 발생 시 콘솔에 출력
    return []; // 빈 배열 반환
  }
  return data; // 조회된 데이터 반환
}

// 특정 이미지에 연결된 마커 정보 가져오기
async function getImageMarker(imageUrl) {
  const { data, error } = await supabase
    .from("travel_marker_images") // 'travel_marker_images' 테이블에서 데이터 조회
    .select("marker_id") // 'marker_id' 컬럼 선택
    .eq("image_url", imageUrl) // 'image_url'이 일치하는 레코드 필터링
    .single(); // 단일 결과만 기대

  // 에러가 발생했으나 데이터가 없는 경우(PGRST116)가 아니라면 에러 처리
  if (error && error.code !== 'PGRST116') { 
    console.error("❌ 이미지 마커 정보 불러오기 실패:", error);
    return null; // null 반환
  }

  // 데이터가 존재하고 marker_id가 있다면 해당 마커의 상세 정보 조회
  if (data && data.marker_id) {
    const { data: markerData, error: markerError } = await supabase
      .from("travel_markers") // 'travel_markers' 테이블에서 데이터 조회
      .select("id, region, reason") // 'id', 'region', 'reason' 컬럼 선택
      .eq("id", data.marker_id) // 'id'가 이미지의 marker_id와 일치하는 레코드 필터링
      .single(); // 단일 결과만 기대
    if (markerError) {
      console.error("❌ 연결된 마커 상세 정보 불러오기 실패:", markerError);
      return null; // null 반환
    }
    return markerData; // 마커 상세 정보 반환
  }
  return null; // 연결된 마커가 없으면 null 반환
}

// 이미지와 마커 연결 (또는 업데이트) 함수
async function linkImageToMarker(imageUrl, markerId) {
  // 먼저 해당 image_url이 이미 존재하는지 확인
  const { data: existingEntry, error: selectError } = await supabase
    .from("travel_marker_images") // 'travel_marker_images' 테이블에서 조회
    .select("id") // 'id' 컬럼 선택
    .eq("image_url", imageUrl) // 'image_url'이 일치하는 레코드 필터링
    .single(); // 단일 결과만 기대

  // 에러가 발생했으나 데이터가 없는 경우(PGRST116)가 아니라면 에러 처리
  if (selectError && selectError.code !== 'PGRST116') { 
    console.error("❌ 기존 이미지-마커 연결 확인 실패:", selectError);
    return { success: false, message: "기존 연결 확인 실패" }; // 실패 메시지 반환
  }

  if (existingEntry) {
    // 이미 존재하면 업데이트
    const { error: updateError } = await supabase
      .from("travel_marker_images") // 'travel_marker_images' 테이블 업데이트
      .update({ marker_id: markerId }) // 'marker_id' 업데이트
      .eq("image_url", imageUrl); // 해당 이미지 URL에 대해
    if (updateError) {
      console.error("❌ 이미지-마커 연결 업데이트 실패:", updateError);
      return { success: false, message: "연결 업데이트 실패" }; // 실패 메시지 반환
    }
    return { success: true, message: "마커 연결이 업데이트되었습니다." }; // 성공 메시지 반환
  } else {
    // 존재하지 않으면 새로 삽입
    const { error: insertError } = await supabase
      .from("travel_marker_images") // 'travel_marker_images' 테이블에 삽입
      .insert({ image_url: imageUrl, marker_id: markerId }); // 이미지 URL과 마커 ID 삽입
    if (insertError) {
      console.error("❌ 이미지-마커 연결 삽입 실패:", insertError);
      return { success: false, message: "연결 삽입 실패" }; // 실패 메시지 반환
    }
    return { success: true, message: "마커와 사진이 연결되었습니다." }; // 성공 메시지 반환
  }
}

const GalleryMonth = () => {
  usePageLogger(); // 페이지 로거 훅 사용
  const { year, month } = useParams(); // URL 파라미터에서 년도와 월 가져오기
  const navigate = useNavigate(); // 페이지 이동을 위한 navigate 함수 초기화
  const [images, setImages] = useState([]); // 이미지 목록 상태
  const [modalImg, setModalImg] = useState(null); // 모달에 표시될 이미지 URL 상태
  const modalImgRef = useRef(null); // 모달 이미지 DOM 요소 참조
  const [comment, setComment] = useState(""); // 현재 입력 중인 댓글 상태
  const [comments, setComments] = useState([]); // 이미지 댓글 목록 상태

  // --- 1단계: 마커 연동을 위한 새로운 상태들 ---
  const [visitedMarkers, setVisitedMarkers] = useState([]); // 방문한 마커 목록 상태
  const [selectedMarkerId, setSelectedMarkerId] = useState(""); // 드롭다운에서 선택된 마커 ID 상태
  const [currentPhotoMarker, setCurrentPhotoMarker] = useState(null); // 현재 사진이 연결된 마커 정보 상태
  const [isLoadingMarkerLink, setIsLoadingMarkerLink] = useState(true); // 마커 연결 정보 로딩 중 여부 상태
  // --- 1단계: 새로운 상태들 끝 ---

  const title = `${year}년 ${parseInt(month, 10)}월의 우리`; // 페이지 제목
  const emotionText = "이 달의 소중한 추억들을 담았어요."; // 감성 문구

  // 이미지 가져오기
  useEffect(() => {
    const fetchImages = async () => {
      const { data, error } = await supabase
        .storage
        .from("gallery") // 'gallery' 스토리지 버킷에서
        .list(`${year}/${month}`, { limit: 100 }); // 특정 년/월 경로의 이미지 목록을 최대 100개까지 가져옴

      if (error) return console.error("❌ 이미지 목록 실패:", error); // 에러 발생 시 콘솔에 출력

      // 이미지 파일만 필터링하여 공개 URL 생성
      const urls = data
        .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f.name)) // 이미지 파일 확장자 필터링
        .map((f) =>
          supabase.storage.from("gallery").getPublicUrl(`${year}/${month}/${f.name}`).data.publicUrl
        );

      const shuffled = shuffleArray(urls); // 이미지 URL 배열을 랜덤으로 섞음
      setImages(shuffled); // 섞인 이미지 목록으로 상태 업데이트
    };

    fetchImages(); // 이미지 가져오는 함수 호출
  }, [year, month]); // year 또는 month가 변경될 때마다 실행

  // 댓글 가져오기 함수
  const fetchComments = async (imageUrl) => {
    if (!imageUrl) return; // 이미지 URL이 없으면 함수 종료
    const { data, error } = await supabase
      .from("gallery_comments") // 'gallery_comments' 테이블에서 데이터 조회
      .select("*") // 모든 컬럼 선택
      .eq("image_url", imageUrl) // 특정 이미지 URL에 해당하는 댓글만 필터링
      .order("created_at", { ascending: false }); // 생성 시간 역순으로 정렬

    if (error) return console.error("❌ 댓글 불러오기 실패:", error); // 에러 발생 시 콘솔에 출력
    setComments(data); // 조회된 댓글 목록으로 상태 업데이트
  };

  // 댓글 제출 함수
  const handleSubmitComment = async () => {
    if (!comment.trim() || !modalImg) return; // 댓글 내용이 없거나 모달 이미지가 없으면 함수 종료
    const anonId = getAnonId(); // 익명 사용자 ID 가져오기 (실제 사용자 ID 로직이 있다면 교체)
    const { error } = await supabase
      .from("gallery_comments") // 'gallery_comments' 테이블에 삽입
      .insert({ image_url: modalImg, content: comment, user_id: anonId }); // 이미지 URL, 내용, 사용자 ID 삽입

    if (error) {
      console.error("❌ 댓글 추가 실패:", error); // 에러 발생 시 콘솔에 출력
      alert("댓글 추가에 실패했습니다."); // 사용자에게 알림
    } else {
      setComment(""); // 댓글 입력 필드 초기화
      fetchComments(modalImg); // 댓글 다시 불러오기
    }
  };

  // 댓글 삭제 함수
  const handleDeleteComment = async (commentId) => {
    // 삭제 확인 메시지
    if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) return; 
    const { error } = await supabase
      .from("gallery_comments") // 'gallery_comments' 테이블에서 삭제
      .delete() // 레코드 삭제
      .eq("id", commentId); // 특정 댓글 ID에 해당하는 레코드 삭제

    if (error) {
      console.error("❌ 댓글 삭제 실패:", error); // 에러 발생 시 콘솔에 출력
      alert("댓글 삭제에 실패했습니다."); // 사용자에게 알림
    } else {
      fetchComments(modalImg); // 댓글 다시 불러오기
    }
  };

  // 키보드 이벤트 핸들러 (Enter 키로 댓글 제출)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Enter 키를 눌렀고 Shift 키가 눌리지 않았다면
      e.preventDefault(); // 기본 동작(줄바꿈) 방지
      handleSubmitComment(); // 댓글 제출 함수 호출
    }
  };

  // 모달 열기 함수
  const handleModalOpen = async (url) => {
    setModalImg(url); // 모달 이미지 URL 설정
    fetchComments(url); // 해당 이미지의 댓글 불러오기

    // --- 1단계: 모달 열릴 때 마커 정보 로딩 ---
    setIsLoadingMarkerLink(true); // 로딩 상태 시작
    setSelectedMarkerId(""); // 선택된 마커 ID 초기화
    setCurrentPhotoMarker(null); // 현재 연결된 마커 정보 초기화

    const markerInfo = await getImageMarker(url); // 이미지에 연결된 마커 정보 가져오기
    if (markerInfo) {
      setCurrentPhotoMarker(markerInfo); // 연결된 마커 정보 설정
      setSelectedMarkerId(markerInfo.id); // 드롭다운 기본값 설정
    }
    setIsLoadingMarkerLink(false); // 로딩 상태 종료
    // --- 1단계: 마커 정보 로딩 끝 ---
  };

  // --- 1단계: 마커 연동 기능 관련 useEffect 및 함수들 ---
  useEffect(() => {
    // 방문한 마커 목록 불러오기
    const loadVisitedMarkers = async () => {
      const markers = await getVisitedMarkers(); // 모든 방문 마커 가져오기
      setVisitedMarkers(markers); // 상태 업데이트
    };
    loadVisitedMarkers(); // 함수 호출
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 마커 연결 처리 함수
  const handleLinkMarker = async () => {
    if (!modalImg || !selectedMarkerId) { // 모달 이미지 또는 선택된 마커가 없으면 알림
      alert("사진과 연결할 마커를 선택해주세요.");
      return;
    }

    setIsLoadingMarkerLink(true); // 로딩 상태 시작

    try {
      const { success, message } = await linkImageToMarker(modalImg, selectedMarkerId); // 이미지와 마커 연결

      if (!success) { // 연결 실패 시 알림
        alert("마커 연결에 실패했습니다: " + message);
        return;
      }

      alert(message); // 성공 메시지 알림

      // 연결 후 마커 정보 갱신
      const updatedMarkerInfo = await getImageMarker(modalImg); // 업데이트된 마커 정보 가져오기
      setCurrentPhotoMarker(updatedMarkerInfo); // 상태 업데이트

      // 🔔 푸시 알림 발송
      await sendPushToAll({
        title: "📍 사진이 여행지에 연결되었어요!", // 알림 제목
        body: "함께한 추억이 지도에 기록되었습니다.", // 알림 내용
        // 알림 클릭 시 이동할 URL (여행 지도 특정 마커 사진으로 이동)
        click_action: `https://love-memory-page.vercel.app/#/travel-map/photos/${selectedMarkerId}?photo=${encodeURIComponent(modalImg)}`,
        excludeUserId: getAnonId(), // 현재 사용자 제외 (자신에게는 알림이 가지 않도록)
      });

    } catch (error) {
      console.error("❌ 마커 연결 처리 중 오류:", error); // 오류 발생 시 콘솔에 출력
      alert("알 수 없는 오류가 발생했습니다."); // 사용자에게 알림
    } finally {
      setIsLoadingMarkerLink(false); // 로딩 상태 종료
    }
  };

  // --- 1단계: 마커 연동 기능 관련 useEffect 및 함수들 끝 ---

  return (
    <div className="gallery-month-page"> {/* 갤러리 월별 페이지 컨테이너 */}
      <h2 className="gallery-month-title">{title}</h2> {/* 페이지 제목 */}
      <p className="gallery-month-emotion">{emotionText}</p> {/* 감성 문구 */}

      {/* 랜덤 댓글 이미지 버튼 (클릭 시 모달 열기) */}
      <RandomCommentedImageButton onSelect={(url) => {
        handleModalOpen(url); 
      }} />

      {/* 이미지 그리드 */}
      <div className="gallery-month-grid">
        {images.map((url, idx) => ( // 이미지 목록을 매핑하여 각 이미지 카드 렌더링
          <div className="gallery-photo-card" key={url}> {/* 이미지 카드 */}
            <img
              src={url} // 이미지 소스
              alt={`추억 ${idx + 1}`} // 이미지 대체 텍스트
              className="gallery-photo-img" // 이미지 스타일 클래스
              loading="lazy" // 이미지 지연 로딩
              onClick={() => handleModalOpen(url)} // 클릭 시 모달 열기
              onError={(e) => (e.target.style.display = "none")} // 이미지 로딩 실패 시 숨김
              style={{ cursor: "zoom-in" }} // 마우스 오버 시 커서 변경
            />
          </div>
        ))}
      </div>

      {/* 모달 */}
      {modalImg && ( // modalImg 상태가 null이 아닐 때만 모달 렌더링
        <div className="gallery-modal-bg" onClick={() => setModalImg(null)}> {/* 모달 배경 (클릭 시 모달 닫기) */}
          <div className="gallery-modal-img-wrap" onClick={(e) => e.stopPropagation()}> {/* 모달 이미지 래퍼 (클릭 이벤트 전파 방지) */}
            <img ref={modalImgRef} src={modalImg} alt="확대 이미지" className="gallery-modal-img" /> {/* 확대 이미지 */}

            {/* --- 1단계: 마커 연동 UI 추가 --- */}
            <div className="marker-link-section">
              {isLoadingMarkerLink ? ( // 마커 정보 로딩 중일 때
                <p>마커 정보 불러오는 중...</p>
              ) : currentPhotoMarker ? ( // 현재 사진이 마커에 연결되어 있을 때
                <div className="linked-marker-info">
                  <p>
                    📍 **연결된 여행지:** {currentPhotoMarker.region} ({currentPhotoMarker.reason}) {/* 연결된 여행지 정보 표시 */}
                  </p>
                  <button
                    className="view-marker-photos-button"
                    // '이 여행지 사진 모두 보기' 버튼 - 클릭 시 해당 마커의 사진 갤러리로 이동
                    onClick={() => navigate(`/travel-map/photos/${currentPhotoMarker.id}?photo=${encodeURIComponent(modalImg)}`)}
                  >
                    이 여행지 사진 모두 보기
                  </button>
                </div>
              ) : ( // 현재 사진이 마커에 연결되어 있지 않을 때
                <>
                  <label htmlFor="marker-select">📍 이 사진을 방문한 장소에 연결:</label> {/* 라벨 */}
                  <select
                    id="marker-select"
                    onChange={(e) => setSelectedMarkerId(e.target.value)} // 드롭다운 값 변경 시 상태 업데이트
                    value={selectedMarkerId} // 현재 선택된 값
                    className="marker-select-dropdown"
                  >
                    <option value="">-- 마커 선택 --</option> {/* 기본 옵션 */}
                    {visitedMarkers.map((m) => ( // 방문한 마커 목록을 옵션으로 렌더링
                      <option key={m.id} value={m.id}>
                        {m.region} ({m.reason})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleLinkMarker} // 클릭 시 마커 연결 함수 호출
                    disabled={!selectedMarkerId} // 선택된 마커가 없으면 버튼 비활성화
                    className="link-marker-button"
                  >
                    🔗 마커에 사진 연결
                  </button>
                </>
              )}
            </div>
            {/* --- 1단계: 마커 연동 UI 끝 --- */}

            {/* 댓글 박스 */}
            <div className="gallery-comment-box">
              <textarea
                className="gallery-comment-textarea"
                placeholder="이 사진에 대한 감상을 남겨보세요 ✍️"
                value={comment}
                onChange={(e) => setComment(e.target.value)} // 입력 값 변경 시 상태 업데이트
                onKeyDown={handleKeyDown} // 키보드 이벤트 핸들러
              />
              <button className="gallery-comment-submit" onClick={handleSubmitComment}>
                댓글 남기기
              </button>

              {/* 댓글 목록 */}
              <div className="gallery-comment-list">
                {comments.length === 0 && ( // 댓글이 없을 때 메시지 표시
                  <div style={{ color: "#aaa", fontSize: "0.95rem", marginTop: "8px" }}>
                    아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                  </div>
                )}
                {comments.map((c) => ( // 댓글 목록을 매핑하여 각 댓글 아이템 렌더링
                  <div key={c.id} className="gallery-comment-item fade-in">
                    <p>{c.content}</p> {/* 댓글 내용 */}
                    <div className="comment-meta">
                      <span>{new Date(c.created_at).toLocaleDateString()}</span> {/* 댓글 생성 날짜 */}
                      <button className="comment-delete" onClick={() => handleDeleteComment(c.id)}>
                        🗑 {/* 삭제 버튼 */}
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

export default GalleryMonth; // GalleryMonth 컴포넌트 내보내기
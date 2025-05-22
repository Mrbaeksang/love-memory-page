import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getAnonId } from "../utils/getAnonId";
import { sendPushToAll } from "../utils/sendPushToAll";
import usePageLogger from "../hooks/usePageLogger";
import { getCommentMarker, getMarkerPhotos } from "../api/markers";
import { FiMapPin, FiImage } from "react-icons/fi";
import styles from "./CommentDetailPage.module.css";
import "./CommentDetailPage.css"; // 이 파일은 .module.css와 함께 사용될 수 있으나, 보통 하나의 방식으로 통합하여 관리합니다.

const CommentDetailPage = () => {
  // 커스텀 훅: 페이지 방문 기록을 로깅합니다.
  usePageLogger();
  // React Router 훅: 현재 URL의 위치(pathname, search 등) 정보를 가져옵니다.
  const location = useLocation();
  // React Router 훅: 프로그래밍 방식으로 페이지를 이동할 수 있게 합니다.
  const navigate = useNavigate();
  // useRef 훅: 댓글 입력창 DOM 요소에 직접 접근하여 스크롤 및 포커스를 제어하기 위해 사용됩니다.
  const commentInputRef = useRef(null);

  // 상태 훅: 현재 이미지에 대한 댓글 목록을 저장합니다.
  const [comments, setComments] = useState([]);
  // 상태 훅: 새로 작성할 댓글의 내용을 저장합니다.
  const [newComment, setNewComment] = useState("");
  // 상태 훅: 댓글 제출(submitting) 중인지 여부를 나타냅니다. 중복 제출을 방지합니다.
  const [submitting, setSubmitting] = useState(false);
  // 상태 훅: '좋아요'를 누르고 있는 댓글들의 ID를 저장합니다. 중복 좋아요 클릭을 방지합니다.
  const [likingIds, setLikingIds] = useState([]);
  // 상태 훅: 현재 사진과 연동된 마커(여행지) 정보를 저장합니다.
  const [marker, setMarker] = useState(null);
  // 상태 훅: 현재 마커(여행지)에 연결된 모든 사진 목록을 저장합니다.
  const [markerPhotos, setMarkerPhotos] = useState([]);
  // 상태 훅: 마커 정보를 로딩 중인지 여부를 나타냅니다. 로딩 UI를 표시하는 데 사용될 수 있습니다.
  const [isLoadingMarker, setIsLoadingMarker] = useState(true);

  // URL 쿼리 파라미터를 파싱하기 위한 객체를 생성합니다.
  const params = new URLSearchParams(location.search);
  // URL에서 'img' 쿼리 파라미터(이미지 URL)를 가져옵니다.
  const imgUrl = params.get("img");
  // URL에서 'highlight' 쿼리 파라미터(강조할 댓글의 ID)를 가져옵니다.
  const highlightId = params.get("highlight");

  // 상태 훅: 사용자가 'visited' 타입으로 추가한 마커(여행지) 목록을 저장합니다.
  const [visitedMarkers, setVisitedMarkers] = useState([]);
  // 상태 훅: 사진을 연결할 때 드롭다운에서 선택된 마커의 ID를 저장합니다.
  const [selectedMarkerId, setSelectedMarkerId] = useState("");
  // 상태 훅: 사진과 마커 연결 작업(linking) 중인지 여부를 나타냅니다.
  const [isLinking, setIsLinking] = useState(false);
  // 상태 훅: 현재 보고 있는 사진이 연결된 마커 정보를 저장합니다. (UI 표시용)
  const [currentPhotoMarker, setCurrentPhotoMarker] = useState(null);

  // useCallback 훅: 마커 정보를 비동기적으로 가져오는 함수를 메모이제이션합니다.
  // imgUrl 또는 location.pathname이 변경될 때만 함수를 재생성합니다.
  const fetchMarkerInfo = useCallback(async () => {
    // imgUrl이 없으면 함수를 즉시 종료합니다.
    if (!imgUrl) return;

    try {
      // 마커 로딩 상태를 true로 설정하여 로딩 인디케이터를 표시할 수 있게 합니다.
      setIsLoadingMarker(true);

      // 1. 먼저 'travel_marker_images' 테이블에서 현재 이미지 URL에 연결된 마커 ID가 있는지 확인합니다.
      const { data: imageData, error: imageError } = await supabase
        .from('travel_marker_images')
        .select('marker_id')
        .eq('image_url', imgUrl)
        .single(); // 단일 결과만 기대합니다.

      // Supabase에서 데이터가 없을 때 발생하는 특정 에러 코드(PGRST116)가 아니라면, 에러를 던집니다.
      if (imageError && imageError.code !== 'PGRST116') {
        throw imageError;
      }

      // 이미지 데이터가 존재하고, 해당 데이터에 연결된 marker_id가 있다면
      if (imageData && imageData.marker_id) {
        // 해당 marker_id를 사용하여 'travel_markers' 테이블에서 마커의 전체 정보를 가져옵니다.
        const { data: markerData, error: markerError } = await supabase
          .from('travel_markers')
          .select('*')
          .eq('id', imageData.marker_id)
          .single();

        // 마커 정보 조회 중 에러 발생 시 에러를 던집니다.
        if (markerError) throw markerError;

        // 마커 데이터가 성공적으로 조회되었다면
        if (markerData) {
          // 상태를 업데이트하여 마커 정보와 현재 사진이 연결된 마커를 설정합니다.
          setMarker(markerData);
          setCurrentPhotoMarker(markerData);

          // 해당 마커에 연결된 모든 사진 목록을 'travel_marker_images' 테이블에서 가져옵니다.
          const { data: photos, error: photosError } = await supabase
            .from('travel_marker_images')
            .select('*')
            .eq('marker_id', markerData.id);

          // 사진 목록 조회 중 에러가 없으면 상태를 업데이트합니다.
          if (!photosError) {
            setMarkerPhotos(photos || []); // 데이터가 없으면 빈 배열로 초기화합니다.
          }
          return; // 마커 정보를 성공적으로 가져왔으므로 함수를 종료합니다.
        }
      }

      // 2. 만약 이미지와 직접 연결된 마커가 없다면 (또는 위에서 찾지 못했다면),
      // 기존 로직대로 댓글 ID를 통해 마커 정보를 확인합니다.
      const commentId = location.pathname.split('/').pop(); // URL 경로에서 마지막 부분을 댓글 ID로 추출합니다.
      if (commentId) {
        // API 함수를 통해 댓글과 연결된 마커 데이터를 가져옵니다.
        const markerData = await getCommentMarker(commentId);
        if (markerData) {
          // 마커 정보와 현재 사진이 연결된 마커를 설정합니다.
          setMarker(markerData);
          setCurrentPhotoMarker(markerData);

          // 해당 마커에 연결된 사진 목록을 가져와 상태를 업데이트합니다.
          const photos = await getMarkerPhotos(markerData.id);
          setMarkerPhotos(photos || []); // 데이터가 없으면 빈 배열로 초기화합니다.
        }
      }

    } catch (error) {
      console.error('마커 정보를 가져오는 중 오류 발생:', error); // 콘솔에 에러를 로깅합니다.
    } finally {
      setIsLoadingMarker(false); // 마커 로딩 상태를 false로 설정합니다.
    }
  }, [imgUrl, location.pathname]); // imgUrl과 location.pathname이 변경될 때마다 이 함수는 재생성됩니다.

  // useEffect 훅: 컴포넌트가 마운트될 때 한 번만 실행되어 방문했던 마커 목록을 가져옵니다.
  useEffect(() => {
    const fetchVisitedMarkers = async () => {
      // 'travel_markers' 테이블에서 'type'이 'visited'인 모든 마커를 조회합니다.
      const { data, error } = await supabase
        .from("travel_markers")
        .select("*")
        .eq("type", "visited");

      if (error) {
        console.error("Visited 마커 로딩 실패:", error); // 에러 발생 시 콘솔에 로깅합니다.
      } else {
        setVisitedMarkers(data || []); // 데이터가 없으면 빈 배열로 설정합니다.
      }
    };

    fetchVisitedMarkers(); // 함수를 호출하여 방문했던 마커 목록을 가져옵니다.
  }, []); // 빈 의존성 배열: 컴포넌트가 마운트될 때 (첫 렌더링 시) 한 번만 실행됩니다.

  // useEffect 훅: imgUrl이 변경될 때마다 댓글과 마커 정보를 새로 가져옵니다.
  useEffect(() => {
    // imgUrl이 유효할 때만 데이터를 로드합니다.
    if (imgUrl) {
      const loadData = async () => {
        // fetchComments와 fetchMarkerInfo 함수를 동시에 비동기적으로 실행하여 데이터를 가져옵니다.
        await Promise.all([
          fetchComments(),
          fetchMarkerInfo()
        ]);

        // 데이터 로드 후, 댓글 입력창으로 스크롤하고 포커스합니다.
        // setTimeout을 사용하여 DOM 업데이트가 완료된 후 실행되도록 합니다.
        setTimeout(() => {
          commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          commentInputRef.current?.focus();
        }, 100);
      };

      loadData(); // 데이터 로딩 함수를 호출합니다.
    }
  }, [imgUrl, fetchMarkerInfo]); // imgUrl 또는 fetchMarkerInfo 함수가 변경될 때마다 이 효과는 다시 실행됩니다.

  // 현재 이미지에 대한 댓글 목록을 Supabase에서 비동기적으로 가져오는 함수입니다.
  const fetchComments = async () => {
    // 'gallery_comments' 테이블에서 현재 이미지 URL에 해당하는 댓글들을 가져옵니다.
    // 'created_at' 필드를 기준으로 최신 댓글이 먼저 오도록 내림차순 정렬합니다.
    const { data, error } = await supabase
      .from("gallery_comments")
      .select("*")
      .eq("image_url", imgUrl)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("댓글 불러오기 실패", error); // 에러 발생 시 콘솔에 로깅합니다.
    } else {
      setComments(data || []); // 데이터가 없으면 빈 배열로 설정합니다.
    }
  };

  // useEffect 훅: highlightId나 comments 배열이 변경될 때 특정 댓글을 강조합니다.
  useEffect(() => {
    // highlightId가 존재하고 댓글 목록이 비어있지 않을 때만 실행합니다.
    if (highlightId && comments.length > 0) {
      // 강조할 댓글의 ID를 사용하여 해당 DOM 요소를 가져옵니다.
      const el = document.getElementById(`comment-${highlightId}`);
      if (el) {
        // 해당 요소로 부드럽게 스크롤합니다.
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // 강조 효과를 위한 CSS 클래스를 추가합니다. (styles 객체를 통해 CSS 모듈 클래스 참조)
        el.classList.add(styles["comment-highlight"]);

        // 2.5초 후에 강조 클래스를 제거하여 애니메이션 효과를 종료합니다. (선택적)
        setTimeout(() => {
          el.classList.remove(styles["comment-highlight"]);
        }, 2500);
      }
    }
  }, [highlightId, comments]); // highlightId 또는 comments 배열이 변경될 때마다 이 효과는 다시 실행됩니다.

  // 마커 연결 드롭다운의 선택 값이 변경될 때 호출되는 핸들러 함수입니다.
  const handleMarkerLinkChange = (e) => {
    setSelectedMarkerId(e.target.value); // 선택된 마커의 ID를 상태에 저장합니다.
  };

  // 사진을 선택된 마커(여행지)에 연결하는 비동기 함수입니다.
  const linkPhotoToMarker = async () => {
    // 선택된 마커 ID나 이미지 URL이 없으면 경고 메시지를 표시하고 함수를 종료합니다.
    if (!selectedMarkerId || !imgUrl) {
      alert('연결할 여행지를 선택해주세요.');
      return;
    }

    // 사용자에게 사진 연결을 다시 한번 확인할지 묻습니다.
    if (!window.confirm('선택한 여행지와 이 사진을 연결하시겠습니까?')) {
      return;
    }

    setIsLinking(true); // 연결 작업 시작을 나타내는 상태로 설정합니다.

    try {
      // 1. 'travel_marker_images' 테이블에서 현재 이미지 URL에 대한 기존 연결이 있는지 확인합니다.
      const { data: existingLinks, error: checkError } = await supabase
        .from('travel_marker_images')
        .select('id')
        .eq('image_url', imgUrl);

      // 조회 중 에러 발생 시 에러를 던집니다.
      if (checkError) throw checkError;

      // 2. 기존 연결이 있다면 업데이트하고, 없다면 새로운 연결을 생성합니다.
      if (existingLinks && existingLinks.length > 0) {
        // 기존 연결 업데이트: 해당 이미지 URL의 marker_id를 선택된 값으로 업데이트합니다.
        const { error: updateError } = await supabase
          .from('travel_marker_images')
          .update({
            marker_id: selectedMarkerId, // 새로운 마커 ID
            updated_at: new Date().toISOString() // 업데이트 시간 기록
          })
          .eq('image_url', imgUrl); // 현재 이미지 URL에 해당하는 레코드만 업데이트합니다.

        // 업데이트 중 에러 발생 시 에러를 던집니다.
        if (updateError) throw updateError;
      } else {
        // 새로운 연결 생성: marker_id, image_url, created_at을 포함하는 새 레코드를 삽입합니다.
        const { error: insertError } = await supabase
          .from('travel_marker_images')
          .insert([{
            marker_id: selectedMarkerId,
            image_url: imgUrl,
            created_at: new Date().toISOString()
          }]);

        // 삽입 중 에러 발생 시 에러를 던집니다.
        if (insertError) throw insertError;
      }

      // 성공 메시지를 사용자에게 알립니다.
      alert('✅ 사진이 성공적으로 여행지와 연결되었습니다!');

      // UI에 표시될 현재 사진과 연결된 마커 정보를 업데이트합니다.
      const selectedMarker = visitedMarkers.find(m => m.id === selectedMarkerId);
      setCurrentPhotoMarker(selectedMarker);

      // 마커 정보와 사진 목록을 다시 불러와 최신 상태를 반영합니다.
      fetchMarkerInfo();

    } catch (error) {
      console.error('마커 연결 중 오류 발생:', error); // 콘솔에 에러를 로깅합니다.
      alert('마커 연결 중 오류가 발생했습니다. 나중에 다시 시도해주세요.'); // 사용자에게 오류 메시지를 표시합니다.
    } finally {
      setIsLinking(false); // 연결 작업 종료 상태로 설정합니다.
    }
  };

  // 댓글 제출 핸들러 함수입니다.
  const handleSubmit = async () => {
    // 댓글 내용이 비어있거나 공백만 있다면 함수를 종료합니다.
    if (!newComment.trim()) return;
    setSubmitting(true); // 제출 중 상태로 설정하여 버튼을 비활성화합니다.

    // 익명 사용자 ID를 가져옵니다.
    const myUserId = getAnonId();

    // 'gallery_comments' 테이블에 새 댓글을 삽입합니다.
    const { data, error } = await supabase
      .from("gallery_comments")
      .insert([
        {
          image_url: imgUrl, // 현재 이미지 URL
          content: newComment.trim(), // 댓글 내용 (앞뒤 공백 제거)
          created_at: new Date().toISOString(), // 현재 시간 (ISO 8601 형식)
          like_count: 0, // 초기 좋아요 수는 0
          user_id: myUserId, // 댓글 작성자의 익명 ID
        },
      ])
      .select(); // 삽입된 데이터를 반환받습니다.

    // 에러가 없고 데이터가 성공적으로 삽입되었다면
    if (!error && data?.[0]) {
      const newCommentId = data[0].id; // 새로 삽입된 댓글의 ID를 가져옵니다.
      setNewComment(""); // 댓글 입력창을 비웁니다.
      fetchComments(); // 댓글 목록을 다시 불러와 UI를 업데이트합니다.

      // 모든 사용자에게 푸시 알림을 보냅니다 (자기 자신 제외).
      await sendPushToAll({
        title: "사진에 댓글이 달렸어요!",
        body: "예쁜 추억에 새로운 댓글이 도착했어요 💌",
        // 알림 클릭 시 이동할 URL: 현재 사진의 댓글 상세 페이지로 이동하며 새로 작성된 댓글을 강조합니다.
        click_action: `https://love-memory-page.vercel.app/comment-detail?img=${encodeURIComponent(imgUrl)}&highlight=${newCommentId}`,
        excludeUserId: myUserId, // 알림을 보낼 때 제외할 사용자 ID (자기 자신에게는 보내지 않음)
      });
    } else { // 댓글 삽입 중 에러 발생 시
      alert("죄송해요 💔 댓글을 등록하는 데 문제가 생겼어요.\n잠시 후 다시 시도해 주세요."); // 사용자에게 오류 메시지를 표시합니다.
      console.error(error); // 콘솔에 에러를 로깅합니다.
    }

    setSubmitting(false); // 제출 중 상태를 해제합니다.
  };

  // 댓글의 '좋아요'를 처리하는 비동기 함수입니다.
  const handleLike = async (commentId) => {
    const myUserId = getAnonId(); // 익명 사용자 ID를 가져옵니다.
    // '좋아요' 처리 중인 ID 목록에 현재 댓글 ID를 추가합니다. 이미 있으면 추가하지 않습니다.
    setLikingIds((prev) => (prev.includes(commentId) ? prev : [...prev, commentId]));

    // Supabase RPC 함수 'increment_like_count'를 호출하여 특정 댓글의 좋아요 수를 증가시킵니다.
    const { error } = await supabase.rpc("increment_like_count", {
      comment_id_input: commentId, // 좋아요 수를 증가시킬 댓글의 ID
    });

    if (!error) { // 에러가 없으면
      // 댓글 목록 상태를 업데이트하여 좋아요 수를 즉시 반영합니다.
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, like_count: (c.like_count || 0) + 1 } : c
        )
      );

      // 모든 사용자에게 푸시 알림을 보냅니다 (자기 자신 제외).
      await sendPushToAll({
        title: "누군가 내 댓글에 공감했어요 💕",
        body: "소중한 말에 따뜻한 반응이 도착했어요.",
        // 알림 클릭 시 이동할 URL: 현재 사진의 댓글 상세 페이지로 이동하며 해당 댓글을 강조합니다.
        click_action: `https://love-memory-page.vercel.app/comment-detail?img=${encodeURIComponent(imgUrl)}&highlight=${commentId}`,
        excludeUserId: myUserId, // 알림을 보낼 때 제외할 사용자 ID
      });
    } else { // 좋아요 처리 중 에러 발생 시
      alert("좋아요를 반영하지 못했어요 😢\n잠시 후 다시 시도해 주세요."); // 사용자에게 오류 메시지를 표시합니다.
      console.error(error); // 콘솔에 에러를 로깅합니다.
    }

    // '좋아요' 처리 중인 ID 목록에서 현재 댓글 ID를 제거합니다.
    setLikingIds((prev) => prev.filter((id) => id !== commentId));
  };

  return (
    // 최상위 컨테이너: CSS Modules를 사용하여 스타일을 적용합니다.
    <div className={styles["comment-detail-container"]}>
      {/* 뒤로 가기 버튼: 클릭 시 이전 페이지로 이동합니다. */}
      <button onClick={() => navigate(-1)} className={styles["comment-detail-back"]}>
        ← 뒤로가기
      </button>

      {/* 이미지 표시 섹션 */}
      {imgUrl && ( // imgUrl이 존재할 때만 이 섹션을 렌더링합니다.
        // 일반 CSS 클래스와 인라인 스타일이 혼합되어 사용되고 있습니다.
        // 가능하면 `styles` 객체를 사용하여 CSS Module로 통합하는 것이 좋습니다.
        <div className="image-container" style={{ marginBottom: '20px' }}>
          <img
            src={imgUrl}
            alt="댓글이 달린 사진"
            // 인라인 스타일도 가능하면 CSS Module로 옮겨 관리하는 것이 좋습니다.
            style={{
              maxWidth: '100%',
              maxHeight: '500px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          />
        </div>
      )}

      {/* 마커 연결 섹션: 방문했던 마커가 있고 현재 사진에 마커가 연결되어 있지 않을 때만 렌더링됩니다. */}
      {visitedMarkers.length > 0 && !marker && (
        // 이 섹션의 클래스들도 일반 CSS 클래스명을 사용하고 있습니다.
        // `styles` 객체를 통해 `styles["marker-link-section"]` 등으로 참조하는 것이 CSS Module 사용의 올바른 방법입니다.
        <div className="marker-link-section">
          <h3>
            <FiMapPin /> {/* 핀 아이콘 */}
            여행지 연결하기
          </h3>
          <div className="marker-select-container">
            {/* 여행지 선택 드롭다운 */}
            <select
              value={selectedMarkerId}
              onChange={handleMarkerLinkChange}
              className="marker-select"
              disabled={isLinking} // 연결 작업 중에는 드롭다운을 비활성화합니다.
            >
              <option value="">여행지 선택</option>
              {/* 방문했던 마커 목록을 옵션으로 렌더링합니다. */}
              {visitedMarkers.map(marker => (
                <option key={marker.id} value={marker.id}>
                  {marker.region} {marker.reason ? `(${marker.reason})` : ''}
                </option>
              ))}
            </select>
            {/* 연결하기 버튼 */}
            <button
              onClick={linkPhotoToMarker}
              disabled={!selectedMarkerId || isLinking} // 선택된 마커가 없거나 연결 중이면 버튼을 비활성화합니다.
              className="link-button"
            >
              {isLinking ? '연결 중...' : '연결하기'} {/* 연결 중일 때는 텍스트를 변경합니다. */}
            </button>
          </div>
          {/* 현재 연결된 여행지 정보 표시: currentPhotoMarker가 존재할 때만 렌더링됩니다. */}
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

      {/* 마커와 연동된 여행지 섹션: 마커 로딩이 완료되었고 마커 정보가 존재할 때만 렌더링됩니다. */}
      {!isLoadingMarker && marker && (
        // 이 섹션의 클래스들도 일반 CSS 클래스명을 사용하고 있습니다.
        // `styles` 객체를 통해 `styles["marker-section"]` 등으로 참조하는 것이 CSS Module 사용의 올바른 방법입니다.
        <div className="marker-section">
          <div className="marker-header">
            <FiMapPin className="marker-icon" /> {/* 마커 아이콘 */}
            <h3>연결된 여행지: {marker.region}</h3>
          </div>
          <p className="marker-reason">{marker.reason}</p> {/* 마커의 부가 설명 */}

          {/* 마커에 연결된 사진 미리보기 섹션: markerPhotos가 존재할 때만 렌더링됩니다. */}
          {markerPhotos.length > 0 && (
            <div className="marker-photos-preview">
              <div className="photos-count">
                <FiImage /> {markerPhotos.length}장의 사진 {/* 사진 개수 표시 */}
              </div>
              <button
                onClick={() => navigate(`/travel-map/photos/${marker.id}`)} // 클릭 시 해당 마커의 모든 사진 페이지로 이동합니다.
                className="view-photos-button"
              >
                사진 모두 보기
              </button>
            </div>
          )}

          {/* 사진 그리드 미리보기: 첫 3장의 사진을 썸네일로 표시합니다. */}
          <div className="photo-grid-preview">
            {markerPhotos.slice(0, 3).map((photo, index) => (
              <div
                key={photo.id}
                className="photo-thumbnail"
                onClick={() => navigate(`/travel-map/photos/${marker.id}?photo=${photo.id}`)} // 클릭 시 해당 마커의 특정 사진으로 이동
                style={{
                  // 썸네일 또는 원본 이미지 URL을 배경 이미지로 설정합니다.
                  backgroundImage: `url(${photo.thumbnail_url || photo.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                aria-label={`${index + 1}번째 사진 보기`}
              />
            ))}
            {/* 3장 이상의 사진이 있을 경우 '더보기' 오버레이를 표시합니다. */}
            {markerPhotos.length > 3 && (
              <div className="more-photos-overlay">
                +{markerPhotos.length - 3}장 더보기
              </div>
            )}
          </div>
        </div>
      )}

      {/* 댓글 입력 컨테이너: ref를 사용하여 DOM에 직접 접근 가능하게 합니다. */}
      <div className={styles.commentInputContainer} ref={commentInputRef}>
        <textarea
          placeholder="댓글을 입력하세요..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)} // 입력 값 변경 시 상태 업데이트
          rows={3}
          className={styles["comment-input"]} // CSS Modules를 사용하여 스타일 적용
          style={{ color: "#333" }} // 인라인 스타일
        />
        <button
          onClick={handleSubmit}
          disabled={submitting} // 제출 중일 때는 버튼 비활성화
          className={styles["comment-submit"]} // CSS Modules를 사용하여 스타일 적용
        >
          {submitting ? "작성 중..." : "작성하기"} {/* 제출 중일 때는 텍스트를 변경합니다. */}
        </button>
      </div>

      {/* 댓글 상세 박스 (댓글 목록) */}
      <div className={styles["comment-detail-box"]}>
        <h3 className={styles["comment-detail-title"]}>💬 댓글</h3>
        {/* 댓글이 없을 경우 메시지를 표시합니다. */}
        {comments.length === 0 ? (
          <p className={styles["comment-detail-empty"]}>아직 댓글이 없습니다.</p>
        ) : (
          // 댓글 목록을 렌더링합니다.
          comments.map((c) => (
            <div
              key={c.id}
              id={`comment-${c.id}`} // highlightId와 일치하는 댓글을 찾기 위한 ID
              className={styles["comment-detail-item"]} // CSS Modules를 사용하여 스타일 적용
            >
              {/* 댓글 내용: XSS 공격 방지를 위해 HTML 엔티티로 변환합니다. */}
              <p>{c.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
              <div className={styles["comment-footer"]}>
                <span className={styles["comment-detail-date"]}>
                  {new Date(c.created_at).toLocaleDateString()} {/* 댓글 작성 날짜 표시 */}
                </span>
                <button
                  onClick={() => handleLike(c.id)} // 좋아요 버튼 클릭 시 handleLike 함수 호출
                  className={styles["comment-like-btn"]} // CSS Modules를 사용하여 스타일 적용
                  disabled={likingIds.includes(c.id)} // 좋아요 처리 중일 때는 버튼 비활성화
                >
                  ❤️ {c.like_count ?? 0} {/* 좋아요 수 표시 */}
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
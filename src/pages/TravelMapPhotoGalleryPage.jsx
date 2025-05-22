import { useState, useEffect } from 'react'; // React 훅 임포트
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // React Router 훅 임포트
import { getMarkerPhotos, getMarkerById } from '../api/markers'; // 마커 관련 API 함수 임포트
import { supabase } from '../lib/supabaseClient'; // Supabase 클라이언트 임포트
import { FiX, FiChevronLeft, FiChevronRight, FiDownload, FiMapPin } from 'react-icons/fi'; // 아이콘 임포트
import './TravelMapPhotoGalleryPage.css'; // CSS 스타일시트 임포트

// 여행 지도 사진 갤러리 페이지 컴포넌트 정의
function TravelMapPhotoGalleryPage() {
  const { markerId } = useParams(); // URL 파라미터에서 markerId 가져오기
  const location = useLocation(); // 현재 URL 정보 가져오기
  const navigate = useNavigate(); // 페이지 이동 함수 가져오기

  // 상태 변수 정의
  const [marker, setMarker] = useState(null); // 현재 마커 정보
  const [photos, setPhotos] = useState([]); // 사진 목록
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0); // 현재 선택된 사진의 인덱스
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태
  const [isFullscreen, setIsFullscreen] = useState(false); // 전체 화면 모드 여부

  // URL에서 사진 ID 추출 및 전체 화면 모드 설정
  useEffect(() => {
    const params = new URLSearchParams(location.search); // URL 쿼리 파라미터 파싱
    const photoUrl = params.get('photo'); // 'photo' 파라미터 값 가져오기

    if (photoUrl) { // photo 파라미터가 존재할 경우
      if (photos.length === 0) {
        // 사진이 아직 로드되지 않은 경우, URL을 기반으로 임시 사진 객체 생성
        // (직접 URL로 접근했을 때를 대비)
        setPhotos([{ id: 'direct-photo', url: photoUrl, isDirect: true }]);
        setSelectedPhotoIndex(0); // 첫 번째 사진으로 설정
        setIsFullscreen(true); // 전체 화면 모드 활성화
      } else {
        // 이미 로드된 사진 중에서 해당 photoUrl 또는 id와 일치하는 사진 찾기
        const index = photos.findIndex(p => p.url === photoUrl || p.id === photoUrl);
        if (index !== -1) {
          setSelectedPhotoIndex(index); // 해당 사진의 인덱스로 설정
          setIsFullscreen(true); // 전체 화면 모드 활성화
        }
      }
    }
  }, [location.search, photos]); // location.search 또는 photos가 변경될 때마다 실행

  // 마커 정보와 사진 목록 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true); // 로딩 시작

        // getMarkerById와 getMarkerPhotos를 병렬로 실행하여 마커 정보와 사진 목록 가져오기
        const [markerData, photosData] = await Promise.all([
          getMarkerById(markerId), // 마커 ID로 마커 정보 가져오기
          getMarkerPhotos(markerId) // 마커 ID로 사진 목록 가져오기
        ]);

        setMarker(markerData); // 마커 정보 상태 업데이트
        setPhotos(photosData || []); // 사진 목록 상태 업데이트 (데이터가 없으면 빈 배열)
      } catch (error) {
        console.error('데이터를 불러오는 중 오류 발생:', error); // 에러 발생 시 콘솔에 출력
      } finally {
        setIsLoading(false); // 로딩 종료
      }
    };

    fetchData(); // fetchData 함수 호출
  }, [markerId]); // markerId가 변경될 때마다 실행

  // 키보드 이벤트 처리 (이전/다음 사진 전환, 전체 화면 닫기)
  useEffect(() => {
    if (!isFullscreen) return; // 전체 화면 모드가 아니면 이벤트 리스너 설정 안 함

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft': // 왼쪽 화살표 키
          goToPrevious(); // 이전 사진으로 이동
          break;
        case 'ArrowRight': // 오른쪽 화살표 키
          goToNext(); // 다음 사진으로 이동
          break;
        case 'Escape': // Esc 키
          closeFullscreen(); // 전체 화면 닫기
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown); // 키보드 이벤트 리스너 등록
    return () => window.removeEventListener('keydown', handleKeyDown); // 컴포넌트 언마운트 시 이벤트 리스너 제거
  }, [isFullscreen, selectedPhotoIndex, photos.length]); // 의존성 배열에 따라 재실행

  // 터치 이벤트 처리 (스와이프)
  const [touchStartX, setTouchStartX] = useState(0); // 터치 시작 X 좌표
  const [touchEndX, setTouchEndX] = useState(0); // 터치 끝 X 좌표

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX); // 첫 번째 터치의 X 좌표 저장
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX); // 터치 이동 중 X 좌표 저장
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return; // 터치 시작/끝 좌표가 없으면 함수 종료

    const diff = touchStartX - touchEndX; // 터치 시작과 끝 X 좌표의 차이 계산
    const swipeThreshold = 50; // 스와이프를 감지할 최소 거리 (px)

    if (diff > swipeThreshold) {
      // 왼쪽으로 스와이프 (시작 X > 끝 X) - 다음 사진으로 이동
      goToNext();
    } else if (diff < -swipeThreshold) {
      // 오른쪽으로 스와이프 (시작 X < 끝 X) - 이전 사진으로 이동
      goToPrevious();
    }

    // 터치 상태 초기화
    setTouchStartX(0);
    setTouchEndX(0);
  };

  // 이전 사진으로 이동하는 함수
  const goToPrevious = () => {
    setSelectedPhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1)); // 현재 인덱스가 0보다 크면 -1, 아니면 마지막 인덱스로 이동
  };

  // 다음 사진으로 이동하는 함수
  const goToNext = () => {
    setSelectedPhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0)); // 현재 인덱스가 마지막보다 작으면 +1, 아니면 0으로 이동
  };

  // 전체 화면 모드로 사진 열기
  const openFullscreen = (index) => {
    setSelectedPhotoIndex(index); // 선택된 사진 인덱스 설정
    setIsFullscreen(true); // 전체 화면 모드 활성화
    // URL 업데이트 (뒤로 가기 버튼으로 전체 화면 닫기 가능하도록)
    navigate(`/travel-map/photos/${markerId}?photo=${photos[index].id}`, { replace: true });
  };

  // 전체 화면 모드 닫기
  const closeFullscreen = () => {
    setIsFullscreen(false); // 전체 화면 모드 비활성화
    // URL에서 photo 파라미터 제거 (뒤로 가기 버튼 시 그리드 뷰로 돌아가도록)
    navigate(`/travel-map/photos/${markerId}`, { replace: true });
  };

  // 사진 다운로드 함수
  const downloadPhoto = async (url, filename) => {
    try {
      const response = await fetch(url); // 사진 URL로 데이터 가져오기
      const blob = await response.blob(); // 응답을 Blob 형태로 변환
      const downloadUrl = window.URL.createObjectURL(blob); // Blob URL 생성
      const a = document.createElement('a'); // <a> 태그 생성
      a.href = downloadUrl; // 다운로드 URL 설정
      a.download = filename || `travel-photo-${Date.now()}.jpg`; // 파일 이름 설정 (없으면 기본값)
      document.body.appendChild(a); // <body>에 <a> 태그 추가
      a.click(); // <a> 태그 클릭 (다운로드 실행)
      window.URL.revokeObjectURL(downloadUrl); // Blob URL 해제 (메모리 관리)
      a.remove(); // <a> 태그 제거
    } catch (error) {
      console.error('사진 다운로드 중 오류 발생:', error); // 에러 발생 시 콘솔에 출력
    }
  };

  // 로딩 중일 때 표시할 UI
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div> {/* 로딩 스피너 */}
        <p>사진을 불러오는 중...</p> {/* 로딩 메시지 */}
      </div>
    );
  }

  // 마커를 찾을 수 없을 때 표시할 UI
  if (!marker) {
    return (
      <div className="error-container">
        <h2>여행지를 찾을 수 없습니다.</h2> {/* 에러 메시지 */}
        <button onClick={() => navigate(-1)} className="back-button">
          이전 페이지로 돌아가기 {/* 이전 페이지로 돌아가는 버튼 */}
        </button>
      </div>
    );
  }

  const currentPhoto = photos[selectedPhotoIndex]; // 현재 선택된 사진 객체
  const isDirectPhoto = currentPhoto?.isDirect; // URL로 직접 접근한 사진인지 여부

  // 등록된 사진이 없을 때 표시할 UI
  if (photos.length === 0) {
    return (
      <div className="empty-gallery">
        <h2>등록된 사진이 아직 없습니다.</h2> {/* 빈 갤러리 메시지 */}
        <p>이 여행지에는 아직 추억이 없어요 🥲</p>
        <button
          onClick={() => navigate('/')} // 홈으로 돌아가는 버튼
          className="back-button"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  // 메인 렌더링
  return (
    // 전체 갤러리 컨테이너 (전체 화면 모드에 따라 클래스 추가)
    <div className={`travel-photo-gallery ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* 헤더 섹션 */}
      <header className="gallery-header">
        <button
          onClick={() => navigate(-1)} // 뒤로 가기 버튼
          className="back-button"
          aria-label="뒤로 가기" // 스크린 리더를 위한 라벨
        >
          <FiChevronLeft size={24} /> {/* 뒤로 가기 아이콘 */}
        </button>
        <h1>{marker.region}</h1> {/* 마커 지역 이름 */}
        {marker.reason && <p className="marker-reason">{marker.reason}</p>} {/* 마커 사유 (있을 경우) */}
        <div className="spacer"></div> {/* 공간 채우기용 div */}
      </header>

      {/* 사진 그리드 (전체 화면 모드가 아닐 때만 표시) */}
      {!isFullscreen && (
        <div className="photo-grid">
          {photos.map((photo, index) => ( // 사진 목록을 매핑하여 썸네일 생성
            <div
              key={photo.id} // 사진 ID를 키로 사용
              className="photo-thumbnail" // 썸네일 스타일 클래스
              onClick={() => openFullscreen(index)} // 클릭 시 전체 화면 모드로 열기
              role="button" // 접근성을 위한 역할 설정
              tabIndex="0" // 탭 순서에 포함
              aria-label={`${index + 1}번째 사진 보기`} // 스크린 리더를 위한 라벨
            >
              <img
                src={photo.thumbnail_url || photo.url} // 썸네일 URL 또는 원본 URL 사용
                alt={`${marker.region} ${index + 1}`} // 이미지 대체 텍스트
                loading="lazy" // 지연 로딩 활성화
              />
            </div>
          ))}
        </div>
      )}

      {/* 전체 화면 사진 뷰어 (전체 화면 모드일 때만 표시) */}
      {isFullscreen && (
        <div
          className="photo-viewer-container" // 뷰어 컨테이너 스타일
          onTouchStart={handleTouchStart} // 터치 시작 이벤트 핸들러
          onTouchMove={handleTouchMove} // 터치 이동 이벤트 핸들러
          onTouchEnd={handleTouchEnd} // 터치 끝 이벤트 핸들러
        >
          <div className="photo-viewer-header">
            <button
              onClick={closeFullscreen} // 클릭 시 전체 화면 닫기
              className="close-button" // 닫기 버튼 스타일
              aria-label="닫기" // 스크린 리더를 위한 라벨
            >
              <FiX size={24} /> {/* 닫기 아이콘 */}
            </button>
            {/* 직접 접근한 사진이 아닐 때만 네비게이션 버튼과 카운터 표시 */}
            {!photos[selectedPhotoIndex]?.isDirect && (
              <div className="photo-navigation">
                <button
                  onClick={goToPrevious} // 이전 사진으로 이동
                  className="nav-button prev" // 네비게이션 버튼 스타일
                  aria-label="이전 사진" // 스크린 리더를 위한 라벨
                >
                  <FiChevronLeft size={28} /> {/* 왼쪽 화살표 아이콘 */}
                </button>
                <span className="photo-counter">
                  {photos[selectedPhotoIndex] ? selectedPhotoIndex + 1 : 0} / {photos.length} {/* 현재 사진 번호 / 총 사진 개수 */}
                </span>
                <button
                  onClick={goToNext} // 다음 사진으로 이동
                  className="nav-button next" // 네비게이션 버튼 스타일
                  aria-label="다음 사진" // 스크린 리더를 위한 라벨
                >
                  <FiChevronRight size={28} /> {/* 오른쪽 화살표 아이콘 */}
                </button>
              </div>
            )}
            <div className="spacer"></div> {/* 공간 채우기용 div */}
            {/* 직접 접근한 사진이 아닐 때만 다운로드 버튼 표시 */}
            {!photos[selectedPhotoIndex]?.isDirect && (
              <button
                onClick={() => downloadPhoto(photos[selectedPhotoIndex].url, `travel-${marker.region}-${selectedPhotoIndex + 1}.jpg`)}
                className="download-button" // 다운로드 버튼 스타일
                aria-label="사진 다운로드" // 스크린 리더를 위한 라벨
              >
                <FiDownload size={20} /> {/* 다운로드 아이콘 */}
              </button>
            )}
          </div>

          <div className="photo-viewer-content">
            <button
              className="nav-button prev-button" // 이전 버튼 스타일
              onClick={goToPrevious} // 이전 사진으로 이동
              aria-label="이전 사진" // 스크린 리더를 위한 라벨
            >
              <FiChevronLeft size={40} /> {/* 왼쪽 화살표 아이콘 */}
            </button>

            <div className="photo-container">
              <img
                src={photos[selectedPhotoIndex]?.url || ''} // 현재 선택된 사진의 URL
                alt={`${marker.region} ${selectedPhotoIndex + 1}`} // 이미지 대체 텍스트
                className="full-photo" // 전체 사진 스타일
              />
            </div>

            <button
              className="nav-button next-button" // 다음 버튼 스타일
              onClick={goToNext} // 다음 사진으로 이동
              aria-label="다음 사진" // 스크린 리더를 위한 라벨
            >
              <FiChevronRight size={40} /> {/* 오른쪽 화살표 아이콘 */}
            </button>
          </div>

          <div className="photo-viewer-footer">
            <p>
              {marker.region} - {/* 마커 지역 이름 */}
              {photos[selectedPhotoIndex]?.created_at ? new Date(photos[selectedPhotoIndex].created_at).toLocaleDateString() : ''} {/* 사진 생성일 */}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TravelMapPhotoGalleryPage; // 컴포넌트 내보내기
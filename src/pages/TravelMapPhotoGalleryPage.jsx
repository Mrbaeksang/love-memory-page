import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getMarkerPhotos, getMarkerById } from '../api/markers';
import { supabase } from '../lib/supabaseClient';
import { FiX, FiChevronLeft, FiChevronRight, FiDownload, FiMapPin } from 'react-icons/fi';
import './TravelMapPhotoGalleryPage.css';

function TravelMapPhotoGalleryPage() {
  const { markerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [marker, setMarker] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // URL에서 사진 ID 추출 (예: /travel-map/photos/123?photo=456)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const photoUrl = params.get('photo');
    
    if (photoUrl) {
      // URL로 직접 사진을 열어야 하는 경우
      if (photos.length === 0) {
        // 사진이 로드되지 않은 경우, URL을 기반으로 사진 객체 생성
        setPhotos([{ id: 'direct-photo', url: photoUrl, isDirect: true }]);
        setSelectedPhotoIndex(0);
        setIsFullscreen(true);
      } else {
        // 이미 로드된 사진 중에서 찾기
        const index = photos.findIndex(p => p.url === photoUrl || p.id === photoUrl);
        if (index !== -1) {
          setSelectedPhotoIndex(index);
          setIsFullscreen(true);
        }
      }
    }
  }, [location.search, photos]);

  // 마커 정보와 사진 목록 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 병렬로 마커 정보와 사진 목록 가져오기
        const [markerData, photosData] = await Promise.all([
          getMarkerById(markerId),
          getMarkerPhotos(markerId)
        ]);
        
        setMarker(markerData);
        setPhotos(photosData || []);
      } catch (error) {
        console.error('데이터를 불러오는 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [markerId]);

  // 키보드 이벤트 처리 (이전/다음 사진 전환)
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          closeFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, selectedPhotoIndex, photos.length]);

  // 터치 이벤트 처리 (스와이프)
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    
    const diff = touchStartX - touchEndX;
    const swipeThreshold = 50; // 스와이프 감지 최소 거리
    
    if (diff > swipeThreshold) {
      // 왼쪽으로 스와이프 - 다음 사진
      goToNext();
    } else if (diff < -swipeThreshold) {
      // 오른쪽으로 스와이프 - 이전 사진
      goToPrevious();
    }
    
    // 터치 상태 초기화
    setTouchStartX(0);
    setTouchEndX(0);
  };

  const goToPrevious = () => {
    setSelectedPhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const goToNext = () => {
    setSelectedPhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const openFullscreen = (index) => {
    setSelectedPhotoIndex(index);
    setIsFullscreen(true);
    // URL 업데이트 (뒤로 가기 버튼 지원)
    navigate(`/travel-map/photos/${markerId}?photo=${photos[index].id}`, { replace: true });
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    // URL에서 photo 파라미터 제거
    navigate(`/travel-map/photos/${markerId}`, { replace: true });
  };

  const downloadPhoto = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || `travel-photo-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
    } catch (error) {
      console.error('사진 다운로드 중 오류 발생:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>사진을 불러오는 중...</p>
      </div>
    );
  }

  if (!marker) {
    return (
      <div className="error-container">
        <h2>여행지를 찾을 수 없습니다.</h2>
        <button onClick={() => navigate(-1)} className="back-button">
          이전 페이지로 돌아가기
        </button>
      </div>
    );
  }

  const currentPhoto = photos[selectedPhotoIndex];
  const isDirectPhoto = currentPhoto?.isDirect;

  if (photos.length === 0) {
  return (
    <div className="empty-gallery">
      <h2>등록된 사진이 아직 없습니다.</h2>
      <p>이 여행지에는 아직 추억이 없어요 🥲</p>
      <button 
        onClick={() => navigate('/')} 
        className="back-button"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}


  return (
    <div className={`travel-photo-gallery ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* 헤더 */}
      <header className="gallery-header">
        <button 
          onClick={() => navigate(-1)} 
          className="back-button"
          aria-label="뒤로 가기"
        >
          <FiChevronLeft size={24} />
        </button>
        <h1>{marker.region}</h1>
        {marker.reason && <p className="marker-reason">{marker.reason}</p>}
        <div className="spacer"></div>
        
      </header>

      {/* 사진 그리드 */}
      {!isFullscreen && (
        <div className="photo-grid">
          {photos.map((photo, index) => (
            <div 
              key={photo.id} 
              className="photo-thumbnail"
              onClick={() => openFullscreen(index)}
              role="button"
              tabIndex="0"
              aria-label={`${index + 1}번째 사진 보기`}
            >
              <img 
                src={photo.thumbnail_url || photo.url} 
                alt={`${marker.region} ${index + 1}`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* 전체 화면 사진 뷰어 */}
      {isFullscreen && (
        <div 
          className="photo-viewer-container"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="photo-viewer-header">
            <button 
              onClick={closeFullscreen}
              className="close-button"
              aria-label="닫기"
            >
              <FiX size={24} />
          </button>
          {!photos[selectedPhotoIndex]?.isDirect && (
              <div className="photo-navigation">
                <button 
                  onClick={goToPrevious}
                  className="nav-button prev"
                  aria-label="이전 사진"
                >
                  <FiChevronLeft size={28} />
                </button>
                <span className="photo-counter">
                  {photos[selectedPhotoIndex] ? selectedPhotoIndex + 1 : 0} / {photos.length}
                </span>
                <button 
                  onClick={goToNext}
                  className="nav-button next"
                  aria-label="다음 사진"
                >
                  <FiChevronRight size={28} />
                </button>
              </div>
            )}
            <div className="spacer"></div>
            {!photos[selectedPhotoIndex]?.isDirect && (
              <button 
                onClick={() => downloadPhoto(photos[selectedPhotoIndex].url, `travel-${marker.region}-${selectedPhotoIndex + 1}.jpg`)}
                className="download-button"
                aria-label="사진 다운로드"
              >
                <FiDownload size={20} />
              </button>
            )}
          </div>
          
          <div className="photo-viewer-content">
            <button 
              className="nav-button prev-button"
              onClick={goToPrevious}
              aria-label="이전 사진"
            >
              <FiChevronLeft size={40} />
            </button>
            
            <div className="photo-container">
              <img 
                src={photos[selectedPhotoIndex]?.url || ''} 
                alt={`${marker.region} ${selectedPhotoIndex + 1}`}
                className="full-photo"
              />
            </div>
            
            <button 
              className="nav-button next-button"
              onClick={goToNext}
              aria-label="다음 사진"
            >
              <FiChevronRight size={40} />
            </button>
          </div>
          
          <div className="photo-viewer-footer">
            <p>{marker.region} - {photos[selectedPhotoIndex]?.created_at ? new Date(photos[selectedPhotoIndex].created_at).toLocaleDateString() : ''}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TravelMapPhotoGalleryPage;

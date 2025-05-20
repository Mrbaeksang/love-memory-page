import React, { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { sendPushToAll } from "../utils/sendPushToAll";
import { getAnonId } from "../utils/getAnonId";
import "./TravelMap.css";

// 로딩 스피너 컴포넌트
const LoadingSpinner = () => (
  <div className="loading-overlay">
    <div className="loading-spinner" />
  </div>
);

// 에러 메시지 컴포넌트
const ErrorMessage = ({ message, onRetry }) => (
  <div className="error-message">
    <p>{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="retry-button"
        aria-label="다시 시도"
      >
        다시 시도
      </button>
    )}
  </div>
);

export default function TravelMap() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [tempMarker, setTempMarker] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [form, setForm] = useState({ 
    region: "", 
    reason: "", 
    type: "want",
    isSaved: false,
    id: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

const handleMapClick = useCallback(async (e, nMap, nInfoWindow) => {
  try {
    // 마커 클릭 이벤트인 경우 무시
    if (e.overlay) return;
    
    const coord = e.coord;

    // 기존 임시 마커 제거
    if (tempMarker) {
      tempMarker.setMap(null);
      setTempMarker(null);
    }

    // 새 마커 생성
    const marker = new window.naver.maps.Marker({
      position: coord,
      map: nMap,
      title: "선택한 위치",
      alt: "선택한 위치 마커",
      clickable: true,
      icon: {
        content: '<div style="background:white;border:2px solid #4A90E2;border-radius:50%;width:20px;height:20px;box-sizing:border-box;"></div>',
        size: new window.naver.maps.Size(20, 20),
        anchor: new window.naver.maps.Point(10, 10)
      }
    });
    
    setTempMarker(marker);
    
    // 기존 인포윈도우 닫기
    if (nInfoWindow) {
      nInfoWindow.close();
    }

    // 폼 초기화
    setForm({ region: "", reason: "", type: "want" });

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/reverse-geocode?lat=${coord.lat()}&lng=${coord.lng()}`
      );
      if (!res.ok) throw new Error("주소를 가져오는데 실패했습니다.");

      const data = await res.json();
      const area = data?.results?.[0]?.region;
      const land = data?.results?.[0]?.land;
      const address = [
        area?.area1?.name,
        area?.area2?.name,
        area?.area3?.name,
        land?.name,
      ]
        .filter(Boolean)
        .join(" ") || "주소 정보 없음";

      setForm((prev) => ({
        ...prev,
        region: address.trim(),
        // reason은 그대로 비우고 type은 유지
      }));

      const infoContent = `
        <div class="info-window" role="dialog" aria-label="선택한 위치 정보">
          <b>선택된 위치</b><br />
          ${address}
        </div>
      `;
      nInfoWindow.setContent(infoContent);
      nInfoWindow.open(nMap, marker);
    } catch (err) {
      setError("주소 조회 실패");
      console.error("Reverse geocode error:", err);
    } finally {
      setIsLoading(false);
    }
  } catch (err) {
    setError("지도 클릭 처리 중 오류 발생");
    console.error("Map click error:", err);
    setIsLoading(false);
  }
}, [tempMarker]);


  // 저장된 마커 로드
  const loadSavedMarkers = useCallback(async (nMap) => {
    try {
      setIsLoading(true);
      setError(null);
  
      const { data, error } = await supabase.from("travel_markers").select("*");
      if (error) throw error;
  
      if (!data || data.length === 0) {
        console.warn("저장된 마커가 없습니다.");
        return;
      }
  
      data.forEach((m) => {
        if (!m.lat || !m.lng) return;
  
        const pos = new window.naver.maps.LatLng(m.lat, m.lng);
        const marker = new window.naver.maps.Marker({
          position: pos,
          map: nMap,
          title: m.region || "이름 없는 장소",
          icon: {
            content: m.type === 'visited' ? 
              '<div style="font-size:24px;">📍</div>' : 
              '<div style="font-size:24px;color:#4A90E2;">🔹</div>',
            size: new window.naver.maps.Size(24, 24),
            anchor: new window.naver.maps.Point(12, 12)
          }
        });

        // 마커 클릭 이벤트 추가
        window.naver.maps.Event.addListener(marker, 'click', () => {
          // 기존 임시 마커 제거
          if (tempMarker) {
            tempMarker.setMap(null);
            setTempMarker(null);
          }
          
          // 폼을 저장된 마커 정보로 업데이트
          setForm({
            region: m.region || '',
            reason: m.reason || '',
            type: m.type || 'want',
            isSaved: true,
            id: m.id
          });
          
          // 스크롤을 폼으로 이동
          document.querySelector('.travel-form')?.scrollIntoView({ behavior: 'smooth' });
        });
      });
  
    } catch (err) {
      console.error("마커 로딩 실패:", err);
      setError("마커를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  

  // 지도 초기화
  useEffect(() => {
    if (window.naver && window.naver.maps) {
      initMap();
      return;
    }

    window.initMap = initMap;
    
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${
      import.meta.env.VITE_NAVER_API_KEY
    }&callback=initMap`;
    script.async = true;
    script.onerror = () => setError('지도 스크립트를 로드하는 데 실패했습니다.');
    document.head.appendChild(script);

    return () => {
      if (window.initMap) {
        delete window.initMap;
      }
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const initMap = useCallback(() => {
    try {
      const mapOptions = {
        center: new window.naver.maps.LatLng(36.5, 127.5),
        zoom: 7,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.naver.maps.MapTypeControlStyle.BUTTON,
          position: window.naver.maps.Position.TOP_RIGHT
        },
        zoomControl: true,
        zoomControlOptions: {
          style: window.naver.maps.ZoomControlStyle.SMALL,
          position: window.naver.maps.Position.TOP_RIGHT
        },
        scaleControl: false,
        logoControl: false,
        mapDataControl: false
      };

      const nMap = new window.naver.maps.Map("map", mapOptions);

      setMap(nMap);
      const nInfoWindow = new window.naver.maps.InfoWindow({ 
        anchorSkew: true,
        borderWidth: 0,
        backgroundColor: 'transparent',
        pixelOffset: new window.naver.maps.Point(0, -10)
      });
      
      setInfoWindow(nInfoWindow);

      // 지도 클릭 이벤트 리스너
      const clickListener = window.naver.maps.Event.addListener(
        nMap, 
        "click", 
        (e) => handleMapClick(e, nMap, nInfoWindow)
      );

      // 저장된 마커 로드
      loadSavedMarkers(nMap);

      // 클린업 함수
      return () => {
        if (clickListener) {
          window.naver.maps.Event.removeListener(clickListener);
        }
      };
    } catch (err) {
      setError('지도를 초기화하는 중 오류가 발생했습니다.');
      console.error('Map initialization error:', err);
    }
  }, [handleMapClick, loadSavedMarkers]);

  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const res = await fetch(`/api/geocode?query=${encodeURIComponent(searchInput)}`);
      if (!res.ok) throw new Error('검색에 실패했습니다.');
      
      const json = await res.json();
      const item = json.addresses?.[0];
      
      if (!item) {
        setError('검색 결과가 없습니다. 다른 검색어를 시도해주세요.');
        return;
      }

      const latlng = new window.naver.maps.LatLng(item.y, item.x);
      map.setCenter(latlng);
      map.setZoom(14);

      if (tempMarker) tempMarker.setMap(null);
      const marker = new window.naver.maps.Marker({ 
        position: latlng, 
        map,
        title: item.roadAddress || item.jibunAddress,
        alt: '검색된 위치 마커'
      });
      setTempMarker(marker);

      setForm(prev => ({
        ...prev,
        region: item.roadAddress || item.jibunAddress || "주소 없음",
      }));
    } catch (err) {
      setError('검색 중 오류가 발생했습니다.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchInput, map, tempMarker]);

  const saveMarker = async () => {
    if (!tempMarker || !form.region || !form.reason) {
      setError('주소와 이유를 모두 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const pos = tempMarker.getPosition();
      const { data, error } = await supabase
        .from("travel_markers")
        .insert({
          region: form.region,
          reason: form.reason,
          type: form.type,
          lat: pos.lat(),
          lng: pos.lng(),
        })
        .select();

      if (error || !data?.[0]) {
        throw new Error('저장에 실패했습니다.');
      }

      // 푸시 알림 전송 (비동기로 실행되지만 기다리지 않음)
      sendPushToAll({
        title: `${form.region}에 새 추억이 추가됐어요!`,
        body: form.reason,
        click_action: `${window.location.origin}/#travel?highlight=marker_${data[0].id}`,
        excludeUserId: getAnonId(),
      }).catch(err => {
        console.error('푸시 알림 전송 실패:', err);
      });

      // 성공 메시지 표시 후 폼 초기화
      alert("✨ 저장 완료!");
      setTempMarker(null);
      setForm({ region: "", reason: "", type: "want" });
      setSearchInput("");
      
      // 페이지 새로고침 대신 마커만 다시 로드
      if (map) {
        loadSavedMarkers(map);
      }
    } catch (err) {
      setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Save marker error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="travel-map-wrap">
      {/* 로딩 오버레이 */}
      {isLoading && <LoadingSpinner />}
      
      {/* 검색 영역 */}
      <div className="search-box">
        <input 
          type="text"
          value={searchInput} 
          onChange={(e) => setSearchInput(e.target.value)} 
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="주소 검색 (예: 부산, 제주도…)" 
          aria-label="주소 검색"
          disabled={isLoading}
        />
        <button 
          onClick={handleSearch} 
          disabled={isLoading || !searchInput.trim()}
          aria-label="검색"
        >
          🔍 검색
        </button>
      </div>
      
      {/* 에러 메시지 */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => setError(null)} 
        />
      )}
      
      {/* 네이버 맵 */}
      <div 
        id="map" 
        ref={mapRef} 
        className="naver-map"
        aria-label="여행 지도"
        role="application"
        tabIndex="-1"
      ></div>

      {/* 마커 폼 */}
      {(tempMarker || form.isSaved) && (
        <div 
          className="marker-form-box travel-form"
          role="dialog"
          aria-labelledby="marker-form-title"
        >
          <div className="marker-form-header">
            <h3 id="marker-form-title">
              {form.type === 'want' ? '가보고 싶은 곳' : '다녀온 곳'}
              {form.isSaved && <span className="saved-badge">저장됨</span>}
            </h3>
            <button 
              className="close-button"
              onClick={() => {
                setTempMarker(null);
                setForm({ region: "", reason: "", type: "want", isSaved: false, id: null });
              }}
              aria-label="닫기"
            >
              ×
            </button>
          </div>
          
          <div className="location-info">
            <span className="location-icon">📍</span>
            <p className="location-text">{form.region || "주소 정보 없음"}</p>
          </div>
          
          {form.isSaved ? (
            <div className="saved-content">
              {form.reason && (
                <div className="saved-reason">
                  <p>{form.reason}</p>
                </div>
              )}
              <div className="photo-section">
                <button className="add-photo">
                  <span>+</span> 사진 추가
                </button>
              </div>
              <div className="action-buttons">
                <button className="edit-button">수정</button>
                <button className="delete-button">삭제</button>
              </div>
            </div>
          ) : (
            <>
              <textarea
                className="reason-input"
                placeholder="이 장소에 대한 추억이나 이유를 적어주세요"
                value={form.reason}
                onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                disabled={isLoading}
                aria-label="이유 입력"
                maxLength={500}
              />
              
              <div className="type-buttons">
                <button 
                  className={`type-button ${form.type === "want" ? "active" : ""}`}
                  onClick={() => setForm(prev => ({ ...prev, type: "want" }))}
                  disabled={isLoading}
                  aria-pressed={form.type === "want"}
                >
                  가보고 싶은 곳
                </button>
                <button 
                  className={`type-button ${form.type === "visited" ? "active" : ""}`}
                  onClick={() => setForm(prev => ({ ...prev, type: "visited" }))}
                  disabled={isLoading}
                  aria-pressed={form.type === "visited"}
                >
                  다녀온 곳
                </button>
              </div>
              
              <div className="form-actions">
                <button 
                  className="cancel-button" 
                  onClick={() => {
                    setTempMarker(null);
                    setForm(prev => ({ ...prev, isSaved: false }));
                  }}
                  disabled={isLoading}
                >
                  취소
                </button>
                <button 
                  className="save-button" 
                  onClick={saveMarker}
                  disabled={isLoading || !form.reason.trim()}
                >
                  {isLoading ? '저장 중...' : '✨ 저장'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
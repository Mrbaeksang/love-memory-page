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
  const [form, setForm] = useState({ region: "", reason: "", type: "want" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

const handleMapClick = useCallback(async (e, nMap, nInfoWindow) => {
  try {
    const coord = e.coord;

    // 기존 임시 마커 제거
    if (tempMarker) {
      tempMarker.setMap(null);
    }

    // 새 마커 생성 또는 기존 마커 위치 업데이트
    let marker = tempMarker;
    if (!marker) {
      marker = new window.naver.maps.Marker({
        position: coord,
        map: nMap,
        title: "선택한 위치",
        alt: "선택한 위치 마커",
        clickable: true
      });
      setTempMarker(marker);
    } else {
      marker.setPosition(coord);
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
          title: m.region || "이름 없는 장소"
        });

        // 마커 클릭 이벤트 추가
        window.naver.maps.Event.addListener(marker, 'click', () => {
          const infoContent = `
            <div class="info-window" style="padding: 10px;">
              <div><strong>${m.region || '이름 없음'}</strong></div>
              ${m.reason ? `<div>${m.reason}</div>` : ''}
            </div>
          `;
          
          const infoWindow = new window.naver.maps.InfoWindow({
            content: infoContent,
            borderWidth: 0,
            backgroundColor: 'transparent',
            disableAnchor: true
          });
          
          infoWindow.open(nMap, marker);
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
      {tempMarker && (
        <div 
          className="marker-form-box travel-form"
          role="dialog"
          aria-labelledby="marker-form-title"
        >
          <h3 id="marker-form-title">
            {form.type === 'want' ? '가보고 싶은 곳' : '다녀온 곳'}
          </h3>
          
          <p>📍 {form.region || "주소 정보 없음"}</p>
          
          <textarea
            placeholder="이 장소에 대한 추억이나 이유를 적어주세요"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            disabled={isLoading}
            aria-label="이유 입력"
            maxLength={500}
          />
          
          <div className="type-buttons">
            <button 
              className={form.type === "want" ? "active" : ""}
              onClick={() => setForm({ ...form, type: "want" })}
              disabled={isLoading}
              aria-pressed={form.type === "want"}
            >
              가보고 싶은 곳
            </button>
            <button 
              className={form.type === "visited" ? "active" : ""}
              onClick={() => setForm({ ...form, type: "visited" })}
              disabled={isLoading}
              aria-pressed={form.type === "visited"}
            >
              다녀온 곳
            </button>
          </div>
          
          <div className="form-actions">
            <button 
              className="cancel" 
              onClick={() => setTempMarker(null)}
              disabled={isLoading}
            >
              취소
            </button>
            <button 
              className="save" 
              onClick={saveMarker}
              disabled={isLoading || !form.reason.trim()}
            >
              {isLoading ? '저장 중...' : '✨ 저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
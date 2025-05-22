import React, { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient"; // Supabase 클라이언트 임포트 (데이터베이스 연동)
import { sendPushToAll } from "../utils/sendPushToAll"; // 푸시 알림 전송 유틸리티 임포트
import { getAnonId } from "../utils/getAnonId"; // 익명 ID 가져오는 유틸리티 임포트
import "./TravelMap.css"; // 컴포넌트 스타일시트 임포트
import { useNavigate } from "react-router-dom"; // React Router의 navigate 훅 임포트

// 로딩 스피너 컴포넌트 정의
const LoadingSpinner = () => (
  <div className="loading-overlay"> {/* 로딩 오버레이 */}
    <div className="loading-spinner" /> {/* 스피너 아이콘 */}
  </div>
);

// 에러 메시지 컴포넌트 정의
const ErrorMessage = ({ message, onRetry }) => (
  <div className="error-message"> {/* 에러 메시지 컨테이너 */}
    <p>{message}</p> {/* 에러 메시지 텍스트 */}
    {onRetry && ( // onRetry 함수가 있으면 다시 시도 버튼 렌더링
      <button
        onClick={onRetry} // 클릭 시 onRetry 함수 실행
        className="retry-button" // CSS 클래스
        aria-label="다시 시도" // 접근성 레이블
      >
        다시 시도
      </button>
    )}
  </div>
);

// TravelMap 메인 컴포넌트 정의
export default function TravelMap() {
  const mapRef = useRef(null); // 지도 DOM 요소를 참조하기 위한 ref
  const [map, setMap] = useState(null); // 네이버 지도 인스턴스를 저장하는 state
  const [tempMarker, setTempMarker] = useState(null); // 임시 마커 (클릭 또는 검색으로 생성)를 저장하는 state
  const [infoWindow, setInfoWindow] = useState(null); // 정보창 인스턴스를 저장하는 state
  const [searchInput, setSearchInput] = useState(""); // 검색어 입력 필드의 값을 저장하는 state
  const [form, setForm] = useState({ id: null, region: "", reason: "", type: "want" }); // 마커 정보를 담는 폼 데이터 state
  const [isSavedMarker, setIsSavedMarker] = useState(false); // 현재 선택된 마커가 저장된 마커인지 여부
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태를 나타내는 state
  const [error, setError] = useState(null); // 에러 메시지를 저장하는 state
  const tempMarkerRef = useRef(null); // 임시 마커 인스턴스를 유지하기 위한 ref
  const [markerImages, setMarkerImages] = useState([]); // 특정 마커의 이미지들을 저장하는 state
  const [isGalleryOpen, setIsGalleryOpen] = useState(false); // 갤러리 모달 열림/닫힘 상태

  const navigate = useNavigate(); // 페이지 이동을 위한 navigate 훅

  // 지도 클릭 핸들러 ( useCallback으로 맵 인스턴스, 인포윈도우 종속성을 추가하여 불필요한 재생성 방지 )
  const handleMapClick = useCallback(async (e, nMap, nInfoWindow) => {
    const coord = e.coord; // 클릭한 지점의 좌표

    // 임시 마커가 없으면 새로 생성, 있으면 위치만 업데이트
    if (!tempMarkerRef.current) {
      tempMarkerRef.current = new window.naver.maps.Marker({
        position: coord, // 마커 위치
        map: nMap, // 마커를 표시할 지도
        title: "선택한 위치" // 마커 타이틀
      });
    } else {
      tempMarkerRef.current.setPosition(coord); // 기존 마커 위치 업데이트
    }

    setTempMarker(tempMarkerRef.current); // 임시 마커 state 업데이트
    setIsSavedMarker(false); // 저장된 마커가 아님을 표시
    // 클릭 시 폼 정보 초기화 (m.id, m.region, m.reason, m.type이 정의되지 않았으므로 초기화)
    setForm({
      id: null,
      region: "",
      reason: "",
      type: "want"
    });

    setError(null); // 에러 메시지 초기화
    setIsLoading(true); // 로딩 상태 설정

    try {
      // 역지오코딩 API 호출 (좌표 -> 주소)
      const res = await fetch(`/api/reverse-geocode?lat=${coord.lat()}&lng=${coord.lng()}`);
      if (!res.ok) throw new Error("주소를 가져오는데 실패했습니다."); // 응답 실패 시 에러 throw

      const data = await res.json(); // 응답 데이터 파싱
      const area = data?.results?.[0]?.region; // 지역 정보 추출
      const land = data?.results?.[0]?.land; // 세부 지명 정보 추출
      // 주소 문자열 조합 (존재하는 부분만 필터링)
      const address = [
        area?.area1?.name,
        area?.area2?.name,
        area?.area3?.name,
        land?.name,
      ].filter(Boolean).join(" ") || "주소 정보 없음";

      // 폼의 region 필드 업데이트
      setForm((prev) => ({
        ...prev,
        region: address.trim() // 공백 제거 후 저장
      }));

      // 정보창 내용 설정
      const infoContent = `
        <div class="info-window" role="dialog" aria-label="선택한 위치 정보">
          <b>선택된 위치</b><br />
          ${address}
        </div>
      `;
      nInfoWindow.setContent(infoContent); // 정보창 내용 설정
      nInfoWindow.open(nMap, tempMarkerRef.current); // 정보창 열기
    } catch (err) {
      setError("주소 조회 실패"); // 에러 메시지 설정
      console.error("Reverse geocode error:", err); // 콘솔에 에러 출력
    } finally {
      setIsLoading(false); // 로딩 상태 해제
    }
  }, []); // 폼 타입에 따라 useCallback 내부의 로직이 달라질 수 있으므로 form.type을 종속성으로 추가

  // 저장된 마커들을 로드하는 함수
  const loadSavedMarkers = useCallback(async (nMap) => {
    try {
      setIsLoading(true); // 로딩 상태 설정
      setError(null); // 에러 메시지 초기화

      // Supabase에서 travel_markers 테이블의 모든 데이터 가져오기
      const { data, error } = await supabase.from("travel_markers").select("*");

      // 디버깅을 위한 로그
      console.log("📌 마커 데이터 수:", data?.length);
      console.log("📌 마커 데이터 내용:", data);
      console.log("📌 에러:", error);

      if (error) throw error; // 에러 발생 시 throw

      if (!data || data.length === 0) {
        console.warn("저장된 마커가 없습니다."); // 데이터가 없으면 경고
        return;
      }

      // 각 마커 데이터에 대해 지도에 마커 생성
      data.forEach((m) => {
        if (!m.lat || !m.lng) return; // 위도, 경도 없으면 건너뛰기

        const pos = new window.naver.maps.LatLng(m.lat, m.lng); // LatLng 객체 생성

        // 마커 타입에 따라 아이콘 URL 설정
        const iconUrl = m.type === "visited"
          ? "/images/marker-green.svg" // 다녀온 곳: 초록색
          : "/images/marker-red.svg"; // 가보고 싶은 곳: 빨간색

        const marker = new window.naver.maps.Marker({
          position: pos, // 마커 위치
          map: nMap, // 마커를 표시할 지도
          title: m.region || "이름 없는 장소", // 마커 타이틀 (지역명 또는 기본값)
          icon: {
            url: iconUrl, // 아이콘 이미지 URL
            size: new window.naver.maps.Size(13, 20), // 아이콘 크기
            scaledSize: new window.naver.maps.Size(13, 20), // 스케일된 아이콘 크기
            anchor: new window.naver.maps.Point(6.5, 20) // 아이콘 앵커 포인트
          }
        });

        // 마커 클릭 이벤트 리스너 추가
        window.naver.maps.Event.addListener(marker, 'click', () => {
          // 클릭된 마커의 정보로 폼 상태 업데이트
          setForm({
            id: m.id,
            region: m.region || "",
            reason: m.reason || "",
            type: m.type || "want"
          });
          setTempMarker(marker); // 임시 마커를 클릭된 마커로 설정
          setIsSavedMarker(true); // 저장된 마커임을 표시
        });
      });
    } catch (err) {
      console.error("마커 로딩 실패:", err); // 에러 발생 시 콘솔 출력
      setError("마커를 불러오는 중 오류가 발생했습니다."); // 에러 메시지 설정
    } finally {
      setIsLoading(false); // 로딩 상태 해제
    }
  }, []); // 의존성 없음 (nMap은 함수 인자로 받음)

  // 특정 마커에 대한 이미지들을 Supabase에서 가져오는 함수
  const fetchMarkerImages = async (markerId) => {
    try {
      const { data, error } = await supabase
        .from("travel_marker_images") // travel_marker_images 테이블에서
        .select("*") // 모든 컬럼 선택
        .eq("marker_id", markerId) // 특정 marker_id와 일치하는 데이터 필터링
        .order("created_at", { ascending: false }); // 최신순으로 정렬

      if (error) {
        console.error("이미지 로드 실패:", error); // 에러 발생 시 콘솔 출력
        return []; // 빈 배열 반환
      }

      return data; // 가져온 데이터 반환
    } catch (err) {
      console.error("이미지 불러오는 중 오류:", err); // 예외 발생 시 콘솔 출력
      return []; // 빈 배열 반환
    }
  };

  // 갤러리 모달을 열고 이미지들을 불러오는 함수
  const openGallery = async (markerId) => {
    const images = await fetchMarkerImages(markerId); // 이미지 데이터 가져오기
    setMarkerImages(images); // 이미지 state 업데이트
    setIsGalleryOpen(true); // 갤러리 모달 열기
  };

  // 지도 초기화 및 스크립트 로드 useEffect
  useEffect(() => {
    // 네이버 지도 API가 이미 로드되어 있으면 바로 지도 초기화
    if (window.naver && window.naver.maps) {
      initMap();
      return;
    }

    // 네이버 지도 API 스크립트 로드 콜백 함수를 전역에 등록
    window.initMap = initMap;

    // 네이버 지도 API 스크립트 동적 생성 및 삽입
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${
      import.meta.env.VITE_NAVER_API_KEY // 환경 변수에서 API 키 가져오기
    }&callback=initMap`; // 스크립트 로드 완료 후 initMap 함수 호출
    script.async = true; // 비동기 로드
    script.onerror = () => setError('지도 스크립트를 로드하는 데 실패했습니다.'); // 에러 발생 시 에러 메시지 설정
    document.head.appendChild(script); // head 태그에 스크립트 추가

    // 컴포넌트 언마운트 시 스크립트 및 콜백 함수 정리
    return () => {
      if (window.initMap) {
        delete window.initMap; // 전역 콜백 함수 제거
      }
      if (script.parentNode) {
        document.head.removeChild(script); // 스크립트 제거
      }
    };
  }, []); // 빈 의존성 배열: 컴포넌트 마운트 시 한 번만 실행

  // 지도 초기화 함수 ( useCallback으로 불필요한 재생성 방지 )
  const initMap = useCallback(() => {
    try {
      const mapOptions = {
        center: new window.naver.maps.LatLng(36.5, 127.5), // 지도 초기 중심 좌표 (대한민국 중심 근처)
        zoom: 7, // 지도 초기 줌 레벨
        mapTypeControl: false, // 위성 보기 제거
        zoomControl: true, // 줌 컨트롤 표시
        zoomControlOptions: {
          style: window.naver.maps.ZoomControlStyle.SMALL, // 줌 컨트롤 스타일
          position: window.naver.maps.Position.TOP_LEFT // 줌 컨트롤 위치 (왼쪽 상단)
        },
        scaleControl: false, // 스케일 컨트롤 제거
        logoControl: false, // 로고 컨트롤 제거
        mapDataControl: false // 지도 데이터 컨트롤 제거
      };

      const nMap = new window.naver.maps.Map("map", mapOptions); // "map" ID를 가진 요소에 지도 생성

      setMap(nMap); // 지도 인스턴스 state에 저장
      const nInfoWindow = new window.naver.maps.InfoWindow({
        anchorSkew: true, // 앵커 스큐 사용 여부
        disableAnchor: true, // 앵커 비활성화 여부
        borderWidth: 0, // 테두리 너비
        backgroundColor: 'transparent', // 배경색 투명
        pixelOffset: new window.naver.maps.Point(0, -10) // 픽셀 오프셋
      });

      setInfoWindow(nInfoWindow); // 정보창 인스턴스 state에 저장

      // 지도 클릭 이벤트 리스너 추가
      const clickListener = window.naver.maps.Event.addListener(
        nMap,
        "click",
        (e) => handleMapClick(e, nMap, nInfoWindow) // 클릭 시 handleMapClick 호출
      );

      loadSavedMarkers(nMap); // 저장된 마커 로드

      // 클린업 함수: 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        if (clickListener) {
          window.naver.maps.Event.removeListener(clickListener);
        }
      };
    } catch (err) {
      setError("지도를 초기화하는 중 오류가 발생했습니다."); // 에러 메시지 설정
      console.error("Map initialization error:", err); // 콘솔에 에러 출력
    }
  }, [handleMapClick, loadSavedMarkers]); // handleMapClick과 loadSavedMarkers가 변경될 때만 initMap 재성성

  // 검색 핸들러 ( useCallback으로 불필요한 재생성 방지 )
  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) {
      setError('검색어를 입력해주세요.'); // 검색어가 없으면 에러 메시지
      return;
    }

    try {
      setIsLoading(true); // 로딩 상태 설정
      setError(null); // 에러 메시지 초기화

      // 지오코딩 API 호출 (주소 -> 좌표)
      const res = await fetch(`/api/geocode?query=${encodeURIComponent(searchInput)}`);
      if (!res.ok) throw new Error('검색에 실패했습니다.'); // 응답 실패 시 에러 throw

      const json = await res.json(); // 응답 데이터 파싱
      const item = json.addresses?.[0]; // 첫 번째 검색 결과 가져오기

      if (!item) {
        setError('검색 결과가 없습니다. 다른 검색어를 시도해주세요.'); // 검색 결과가 없으면 에러 메시지
        return;
      }

      const latlng = new window.naver.maps.LatLng(item.y, item.x); // 검색된 위치의 LatLng 객체 생성
      map.setCenter(latlng); // 지도 중심을 검색된 위치로 이동
      map.setZoom(14); // 줌 레벨 설정

      // 임시 마커가 있으면 위치 업데이트, 없으면 새로 생성
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setPosition(latlng);
      } else {
        tempMarkerRef.current = new window.naver.maps.Marker({
          position: latlng,
          map,
          title: "검색된 위치"
        });
      }

      setTempMarker(tempMarkerRef.current); // 임시 마커 state 업데이트
      setIsSavedMarker(false); // 저장된 마커가 아님을 표시

      // 폼의 region 필드 업데이트 (도로명 주소 우선, 없으면 지번 주소)
      setForm(prev => ({
        ...prev,
        region: item.roadAddress || item.jibunAddress || "주소 없음",
      }));
    } catch (err) {
      setError('검색 중 오류가 발생했습니다.'); // 에러 메시지 설정
      console.error('Search error:', err); // 콘솔에 에러 출력
    } finally {
      setIsLoading(false); // 로딩 상태 해제
    }
  }, [searchInput, map]); // searchInput, map이 변경될 때만 handleSearch 재생성

  // 마커 저장 함수
  const saveMarker = async () => {
    // 필수 입력 필드 확인
    if (!tempMarker || !form.region || !form.reason) {
      setError('주소와 이유를 모두 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true); // 로딩 상태 설정
      setError(null); // 에러 메시지 초기화

      const pos = tempMarker.getPosition(); // 임시 마커의 좌표 가져오기
      // Supabase에 마커 정보 삽입
      const { data, error } = await supabase
        .from("travel_markers")
        .insert({
          region: form.region, // 지역
          reason: form.reason, // 이유/추억
          type: form.type, // 타입 (visited/want)
          lat: pos.lat(), // 위도
          lng: pos.lng(), // 경도
        })
        .select(); // 삽입된 데이터 반환

      if (error || !data?.[0]) {
        throw new Error('저장에 실패했습니다.'); // 저장 실패 시 에러 throw
      }

      // 푸시 알림 전송 (비동기로 실행되며, 결과는 기다리지 않음)
      sendPushToAll({
        title: `${form.region}에 새 추억이 추가됐어요!`, // 알림 제목
        body: form.reason, // 알림 내용
        click_action: `${window.location.origin}/#travel?highlight=marker_${data[0].id}`, // 클릭 시 이동할 URL
        excludeUserId: getAnonId(), // 현재 사용자 제외
      }).catch(err => {
        console.error('푸시 알림 전송 실패:', err); // 푸시 알림 에러 발생 시 콘솔 출력
      });

      alert("✨ 저장 완료!"); // 성공 메시지 알림
      setTempMarker(null); // 임시 마커 초기화 (지도에서 제거)
      setForm({ // 폼 데이터 초기화
        id: null,
        region: "",
        reason: "",
        type: "want"
      });

      setSearchInput(""); // 검색 입력 필드 초기화

      // 지도 인스턴스가 존재하면 저장된 마커들을 다시 로드하여 지도에 반영
      if (map) {
        loadSavedMarkers(map);
      }
    } catch (err) {
      setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.'); // 에러 메시지 설정
      console.error('Save marker error:', err); // 콘솔에 에러 출력
    } finally {
      setIsLoading(false); // 로딩 상태 해제
    }
  };

  return (
    <div className="travel-map-wrap"> {/* 전체 컨테이너 */}
      {/* 로딩 오버레이 (isLoading 상태일 때만 표시) */}
      {isLoading && <LoadingSpinner />}

      {/* 검색 영역 */}
      <div className="search-box">
        <input
          type="text"
          value={searchInput} // 검색어 입력 필드 값
          onChange={(e) => setSearchInput(e.target.value)} // 입력 값 변경 핸들러
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()} // Enter 키 누르면 검색
          placeholder="주소 검색 (예: 부산, 제주도…)" // 플레이스홀더 텍스트
          aria-label="주소 검색" // 접근성 레이블
          disabled={isLoading} // 로딩 중일 때 비활성화
        />
        <button
          onClick={handleSearch} // 클릭 시 검색 실행
          disabled={isLoading || !searchInput.trim()} // 로딩 중이거나 검색어가 비어있으면 비활성화
          aria-label="검색" // 접근성 레이블
        >
          🔍 검색
        </button>
      </div>

      {/* 에러 메시지 (error 상태일 때만 표시) */}
      {error && (
        <ErrorMessage
          message={error} // 에러 메시지 전달
          onRetry={() => setError(null)} // 다시 시도 버튼 클릭 시 에러 초기화
        />
      )}

      {/* 네이버 맵을 렌더링할 영역 */}
      <div
        id="map" // 지도 인스턴스가 마운트될 DOM ID
        ref={mapRef} // ref 연결
        className="naver-map" // CSS 클래스
        aria-label="여행 지도" // 접근성 레이블
        role="application" // ARIA 역할
        tabIndex="-1" // 키보드 접근성
      ></div>

      {/* 마커 정보 폼 (tempMarker가 있거나 form.region 또는 form.reason이 채워져 있을 때만 표시) */}
      {(tempMarker || form.region || form.reason) && (
        <div className="marker-form-box travel-form" role="dialog" aria-labelledby="marker-form-title">
          <h3 id="marker-form-title">
            {form.type === "want" ? "가보고 싶은 곳" : "다녀온 곳"} {/* 폼 제목 */}
          </h3>

          <p>📍 {form.region || "주소 정보 없음"}</p> {/* 선택된/검색된 주소 */}

          <textarea
            placeholder="이 장소에 대한 추억이나 이유를 적어주세요" // 플레이스홀더 텍스트
            value={form.reason} // 이유 입력 필드 값
            onChange={(e) => setForm({ ...form, reason: e.target.value })} // 입력 값 변경 핸들러
            disabled={isLoading || isSavedMarker} // 로딩 중이거나 저장된 마커일 때 비활성화
            aria-label="이유 입력" // 접근성 레이블
            maxLength={500} // 최대 입력 길이
          />

          {/* 저장된 마커가 아닐 때만 '가보고 싶은 곳'/'다녀온 곳' 선택 및 저장/취소 버튼 표시 */}
          {!isSavedMarker && (
            <>
              <div className="type-buttons">
                <button
                  className={form.type === "want" ? "active" : ""} // 활성화 상태에 따라 클래스 추가
                  onClick={() => setForm({ ...form, type: "want" })} // 타입 변경
                  disabled={isLoading} // 로딩 중일 때 비활성화
                  aria-pressed={form.type === "want"} // ARIA pressed 상태
                >
                  가보고 싶은 곳
                </button>
                <button
                  className={form.type === "visited" ? "active" : ""} // 활성화 상태에 따라 클래스 추가
                  onClick={() => setForm({ ...form, type: "visited" })} // 타입 변경
                  disabled={isLoading} // 로딩 중일 때 비활성화
                  aria-pressed={form.type === "visited"} // ARIA pressed 상태
                >
                  다녀온 곳
                </button>
              </div>
              <div className="form-actions">
                <button
                  className="cancel" // CSS 클래스
                  onClick={() => setTempMarker(null)} // 임시 마커 초기화 (폼 닫기)
                  disabled={isLoading} // 로딩 중일 때 비활성화
                >
                  취소
                </button>
                <button
                  className="save" // CSS 클래스
                  onClick={saveMarker} // 클릭 시 마커 저장
                  disabled={isLoading || !form.reason.trim()} // 로딩 중이거나 이유가 비어있으면 비활성화
                >
                  {isLoading ? "저장 중..." : "✨ 저장"} {/* 로딩 상태에 따른 버튼 텍스트 */}
                </button>
              </div>
            </>
          )}

          {/* 저장된 마커일 때만 댓글 기능 관련 문구 표시 */}
          {isSavedMarker && (
            <div className="comments">
              <p style={{ fontSize: "14px", color: "#888" }}>
                💬 댓글 기능 여기에 들어갑니다 (추후 개발)
              </p>
            </div>
          )}

          {/* 저장된 마커이고 '다녀온 곳' 타입이며 ID가 있을 때만 '사진 보기' 버튼 표시 */}
          {isSavedMarker && form.type === "visited" && form.id && (
            <button
              onClick={() => navigate(`/travel-map/photos/${form.id}`)} // 클릭 시 사진 갤러리 페이지로 이동
              className="view-gallery-button" // CSS 클래스
              style={{ // 인라인 스타일
                marginTop: "0.5rem",
                fontSize: "0.95rem",
                backgroundColor: "#eef7ff",
                color: "#337ab7",
                border: "1px solid #c6e2ff",
                borderRadius: "6px",
                padding: "0.4em 1em",
                cursor: "pointer"
              }}
            >
              📷 사진 보기
            </button>
          )}

        </div>
      )}

      {/* 갤러리 모달 (isGalleryOpen 상태일 때만 표시) */}
      {isGalleryOpen && (
        <div
          className="gallery-modal" // CSS 클래스
          style={{ // 인라인 스타일 (모달 오버레이)
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
          onClick={() => setIsGalleryOpen(false)} // 오버레이 클릭 시 갤러리 닫기
        >
          <div
            style={{ // 인라인 스타일 (모달 내용 컨테이너)
              background: "#fff",
              borderRadius: "10px",
              padding: "1rem",
              maxWidth: "90vw",
              maxHeight: "80vh",
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", // 반응형 그리드
              gap: "0.7rem"
            }}
            onClick={(e) => e.stopPropagation()} // 모달 내용 클릭 시 오버레이 닫히지 않도록 이벤트 전파 중단
          >
            {markerImages.length === 0 ? (
              <p>등록된 사진이 없어요.</p> // 사진이 없을 때 메시지
            ) : (
              markerImages.map((img) => ( // 이미지 목록 렌더링
                <img
                  key={img.id} // 고유 key
                  src={img.thumbnail_url || img.image_url} // 썸네일 URL 우선 사용, 없으면 원본 URL
                  alt="마커 사진" // 이미지 alt 텍스트
                  style={{ width: "100%", borderRadius: "6px", objectFit: "cover" }} // 이미지 스타일
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
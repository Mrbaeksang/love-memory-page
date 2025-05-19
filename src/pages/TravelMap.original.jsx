import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { sendPushToAll } from "../utils/sendPushToAll";
import { getAnonId } from "../utils/getAnonId";
import "./TravelMap.css";

export default function TravelMap() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [tempMarker, setTempMarker] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [form, setForm] = useState({ region: "", reason: "", type: "want" });

  useEffect(() => {
    window.initMap = () => {
      const nMap = new window.naver.maps.Map("map", {
        center: new window.naver.maps.LatLng(36.5, 127.5),
        zoom: 7,
        mapTypeControl: true,
      });

      setMap(nMap);
      const nInfoWindow = new window.naver.maps.InfoWindow({ anchorSkew: true });
      setInfoWindow(nInfoWindow);

      window.naver.maps.Event.addListener(nMap, "click", async (e) => {
        const coord = e.coord;

        if (tempMarker) tempMarker.setMap(null);
        const marker = new window.naver.maps.Marker({ position: coord, map: nMap });
        setTempMarker(marker);

        const res = await fetch(`/api/reverse-geocode?lat=${coord.lat()}&lng=${coord.lng()}`);
        const data = await res.json();
        const address = data?.results?.[0]?.land?.name || "주소 정보 없음";

        setForm((prev) => ({ ...prev, region: address }));
        nInfoWindow.setContent(`
          <div class="info-window">
            <b>선택된 위치</b><br />
            ${address}
          </div>
        `);
        nInfoWindow.open(nMap, marker);
      });

      loadSavedMarkers(nMap);
    };

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${
      import.meta.env.VITE_NAVER_API_KEY
    }&callback=initMap`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const loadSavedMarkers = async (nMap) => {
    const { data } = await supabase.from("travel_markers").select("*");
    data?.forEach((m) => {
      const pos = new window.naver.maps.LatLng(m.lat, m.lng);
      new window.naver.maps.Marker({ position: pos, map: nMap });
    });
  };

  const handleSearch = async () => {
    const res = await fetch(`/api/geocode?query=${encodeURIComponent(searchInput)}`);
    const json = await res.json();
    const item = json.addresses?.[0];
    if (!item) return alert("검색 결과 없음");

    const latlng = new window.naver.maps.LatLng(item.y, item.x);
    map.setCenter(latlng);
    map.setZoom(14);

    if (tempMarker) tempMarker.setMap(null);
    const marker = new window.naver.maps.Marker({ position: latlng, map });
    setTempMarker(marker);

    setForm((prev) => ({
      ...prev,
      region: item.roadAddress || item.jibunAddress || "주소 없음",
    }));
  };

  const saveMarker = async () => {
    if (!tempMarker || !form.region || !form.reason) {
      alert("주소, 이유를 모두 입력하세요");
      return;
    }

    const pos = tempMarker.getPosition();
    const { data, error } = await supabase.from("travel_markers").insert({
      region: form.region,
      reason: form.reason,
      type: form.type,
      lat: pos.lat(),
      lng: pos.lng(),
    }).select();

    if (error || !data?.[0]) return alert("저장 실패");

    await sendPushToAll({
      title: `${form.region}에 새 추억이 추가됐어요!`,
      body: form.reason,
      click_action: `https://love-memory-page.vercel.app/#travel?highlight=marker_${data[0].id}`,
      excludeUserId: getAnonId(),
    });

    alert("✨ 저장 완료!");
    setTempMarker(null);
    setForm({ region: "", reason: "", type: "want" });
    location.reload();
  };

  return (
    <div className="travel-map-wrap">
      <div className="search-box">
        <input 
          value={searchInput} 
          onChange={(e) => setSearchInput(e.target.value)} 
          placeholder="주소 검색 (예: 부산, 제주도…)" 
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>🔍 검색</button>
      </div>
      <div id="map" ref={mapRef} className="naver-map"></div>

      {tempMarker && (
        <div className="marker-form-box">
          <p>📍 {form.region || "주소 정보 없음"}</p>
          <textarea
            placeholder="이 장소에 대한 추억이나 이유를 적어주세요"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
          <div className="type-buttons">
            <button 
              className={form.type === "want" ? "active" : ""}
              onClick={() => setForm({ ...form, type: "want" })}
            >
              가보고 싶은 곳
            </button>
            <button 
              className={form.type === "visited" ? "active" : ""}
              onClick={() => setForm({ ...form, type: "visited" })}
            >
              다녀온 곳
            </button>
          </div>
          <div className="action-buttons">
            <button onClick={saveMarker}>✨ 저장</button>
            <button onClick={() => setTempMarker(null)}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}

// src/pages/TravelMap.jsx
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { sendPushToAll } from "../utils/sendPushToAll";
import { getAnonId } from "../utils/getAnonId";
import "./TravelMap.css";

export default function TravelMap() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [form, setForm] = useState({ region: "", reason: "", type: "want" });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    window.initMap = () => {
      const mapOptions = {
        center: new window.naver.maps.LatLng(36.5, 127.5),
        zoom: 7,
        mapTypeControl: true,
      };
      const nMap = new window.naver.maps.Map("map", mapOptions);
      setMap(nMap);
      const nInfoWindow = new window.naver.maps.InfoWindow({ anchorSkew: true });
      setInfoWindow(nInfoWindow);

      naver.maps.Event.addListener(nMap, "click", async (e) => {
        const coord = e.coord;
        if (marker) marker.setMap(null);

        const newMarker = new naver.maps.Marker({ position: coord, map: nMap });
        setMarker(newMarker);

        const res = await fetch(
          `/api/reverse-geocode?lat=${coord.lat()}&lng=${coord.lng()}`
        );
        const data = await res.json();
        const address = data?.results?.[0]?.land?.name || "주소 정보 없음";

        setForm((prev) => ({ ...prev, region: address }));

        nInfoWindow.setContent(`
          <div style="padding:10px;min-width:200px;line-height:150%;">
            <b>선택된 위치</b><br />
            ${address}
          </div>
        `);
        nInfoWindow.open(nMap, newMarker);
      });

      loadExistingMarkers(nMap);
    };

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${import.meta.env.VITE_NAVER_API_KEY_ID}&callback=initMap`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const loadExistingMarkers = async (nMap) => {
    const { data } = await supabase.from("travel_markers").select("*");
    data.forEach((m) => {
      const pos = new window.naver.maps.LatLng(m.lat, m.lng);
      const mkr = new window.naver.maps.Marker({ position: pos, map: nMap });
      mkr.addListener("click", () => openCommentModal(m));
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

    if (marker) marker.setMap(null);
    const newMarker = new window.naver.maps.Marker({ position: latlng, map });
    setMarker(newMarker);

    setForm((prev) => ({
      ...prev,
      region: item.roadAddress || item.jibunAddress || "주소 없음",
    }));
  };

  const saveMarker = async () => {
    const { region, reason, type } = form;
    if (!marker || !region || !reason) return alert("모든 필드를 입력해주세요");
    const pos = marker.getPosition();

    const { data, error } = await supabase.from("travel_markers").insert({
      region,
      reason,
      type,
      lat: pos.lat(),
      lng: pos.lng(),
    }).select();

    if (error || !data?.[0]) return alert("저장 실패");

    await sendPushToAll({
      title: `${region}에 추억이 추가됐어요!`,
      body: reason,
      click_action: `https://love-memory-page.vercel.app/#travel?highlight=marker_${data[0].id}`,
      excludeUserId: getAnonId(),
    });

    alert("✨ 저장 완료!");
    setForm({ region: "", reason: "", type: "want" });
    setMarker(null);
    location.reload();
  };

  const openCommentModal = async (marker) => {
    setSelectedMarker(marker);
    const { data } = await supabase.from("travel_marker_comments").select("*")
      .eq("marker_id", marker.id).order("created_at", { ascending: false });
    setComments(data || []);
  };

  const submitComment = async () => {
    const marker_id = selectedMarker.id;
    if (!newComment.trim()) return;
    const { error } = await supabase.from("travel_marker_comments").insert({
      marker_id,
      content: newComment,
    });
    if (!error) {
      setComments([{ content: newComment, created_at: new Date().toISOString() }, ...comments]);
      setNewComment("");
    }
  };

  return (
    <div className="travel-map-wrap">
      <div className="search-box">
        <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="주소 입력" />
        <button onClick={handleSearch}>🔍 검색</button>
      </div>

      <div id="map" ref={mapRef} className="naver-map"></div>

      {marker && (
  <div className="travel-modal-card">
    <h3>📍 {form.region || "선택된 위치"}</h3>
    <textarea
      className="marker-input"
      placeholder="이 장소에 대한 추억이나 이유를 적어주세요"
      value={form.reason}
      onChange={(e) => setForm({ ...form, reason: e.target.value })}
    />
    <div className="type-toggle">
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
    <div className="marker-buttons">
      <button className="submit-btn" onClick={saveMarker}>✨ 저장</button>
      <button className="cancel-btn" onClick={() => {
        setMarker(null);
        setForm({ region: "", reason: "", type: "want" });
      }}>취소</button>
    </div>
  </div>
)}


      {selectedMarker && (
        <div className="marker-comment-modal">
          <h3>{selectedMarker.region}</h3>
          <p>{selectedMarker.reason}</p>
          <div className="comment-list">
            {comments.map((c, i) => (
              <div key={i}>{c.content}</div>
            ))}
          </div>
          <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="댓글" />
          <button onClick={submitComment}>등록</button>
          <button onClick={() => setSelectedMarker(null)}>닫기</button>
        </div>
      )}
    </div>
  );
}

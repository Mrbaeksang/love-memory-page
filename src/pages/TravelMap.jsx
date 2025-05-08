// src/pages/TravelMap.jsx
import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import "./TravelMap.css";
import { sendPushToAll } from "../utils/sendPushToAll";
import { getAnonId } from "../utils/getAnonId";
import MarkerImageModal from "../components/MarkerImageModal";
import MarkerImageUploadModal from "../components/MarkerImageUploadModal";

const wantIcon = new L.Icon({
  iconUrl: "/icons/want-marker.png",
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

const visitedIcon = new L.Icon({
  iconUrl: "/icons/visited-marker.png",
  iconSize: [30, 42],
  iconAnchor: [15, 42],
});

function AddMarker({ onAdd }) {
  useMapEvents({
    click(e) {
      onAdd({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function SearchBox({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    if (data.length > 0) {
      const { lat, lon } = data[0];
      onSearch([parseFloat(lat), parseFloat(lon)]);
    } else {
      alert("위치를 찾을 수 없어요 😢");
    }
  };

  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="장소 검색 (예: 부산, 제주도...)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>검색</button>
    </div>
  );
}

export default function TravelMap() {
  const navigate = useNavigate();
  const mapRef = useRef();
  const [markers, setMarkers] = useState([]);
  const [newMarker, setNewMarker] = useState(null);
  const [form, setForm] = useState({ region: "", reason: "", type: "want" });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const highlight = new URLSearchParams(window.location.hash.split("?")[1])?.get("highlight");

  useEffect(() => {
    supabase
      .from("travel_markers")
      .select("*")
      .then(({ data, error }) => {
        if (!error) setMarkers(data || []);
      });
  }, []);

  useEffect(() => {
    if (highlight?.startsWith("marker_")) {
      const id = parseInt(highlight.replace("marker_", ""));
      setTimeout(() => {
        const el = document.getElementById(`marker-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("marker-highlight");
          setTimeout(() => el.classList.remove("marker-highlight"), 2500);
        }
      }, 1000);
    }
  }, [markers]);

  const saveMarker = async () => {
    if (!form.region.trim() || !form.reason.trim() || !newMarker) return;

    const { lat, lng } = newMarker;
    const { data, error } = await supabase
      .from("travel_markers")
      .insert({ ...form, lat, lng })
      .select();

    if (error || !data?.[0]) return alert("저장 실패 😢");

    const newId = data[0].id;
    const myUserId = getAnonId();

    await sendPushToAll({
      title: `${form.region}에 추억이 추가됐어요!`,
      body: form.reason,
      click_action: `https://love-memory-page.vercel.app/#travel?highlight=marker_${newId}`,
      excludeUserId: myUserId,
    });

    const refresh = await supabase.from("travel_markers").select("*");
    setMarkers(refresh.data || []);
    setForm({ region: "", reason: "", type: "want" });
    setNewMarker(null);
    alert("✨ 저장 완료!");
  };

  const openCommentModal = async (marker) => {
    setSelectedMarker(marker);
    const { data } = await supabase
      .from("travel_marker_comments")
      .select("*")
      .eq("marker_id", marker.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;

    const marker_id = selectedMarker.id;
    const myUserId = getAnonId();

    const { error } = await supabase
      .from("travel_marker_comments")
      .insert({ marker_id, content: newComment });

    if (!error) {
      setComments([
        ...comments,
        { content: newComment, created_at: new Date().toISOString() },
      ]);
      setNewComment("");
      await sendPushToAll({
        title: `${selectedMarker.region}에 댓글이 달렸어요 💬`,
        body: newComment,
        click_action: `https://love-memory-page.vercel.app/#travel?highlight=marker_${marker_id}`,
        excludeUserId: myUserId,
      });
    }
  };

  return (
    <div className="travel-map-leaflet-wrap">
      <SearchBox
        onSearch={(coords) => mapRef.current?.flyTo(coords, 9)}
      />

      <MapContainer
        center={[36.5, 127.5]}
        zoom={7}
        scrollWheelZoom={true}
        className="leaflet-map"
        maxBounds={[[33, 124], [39, 132]]}
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <AddMarker onAdd={setNewMarker} />
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={m.type === "visited" ? visitedIcon : wantIcon}
            eventHandlers={{ click: () => openCommentModal(m) }}
          >
            <div id={`marker-${m.id}`} className="marker-anchor"></div>
          </Marker>
        ))}
        {newMarker && (
          <Marker position={[newMarker.lat, newMarker.lng]} icon={wantIcon} />
        )}
      </MapContainer>

      {newMarker && (
        <div className="travel-form">
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
          <input
            className="marker-input"
            placeholder="지역명"
            value={form.region}
            onChange={(e) =>
              setForm({ ...form, region: e.target.value })
            }
          />
          <input
            className="marker-input"
            placeholder="이유를 입력해주세요"
            value={form.reason}
            onChange={(e) =>
              setForm({ ...form, reason: e.target.value })
            }
          />
          <div className="marker-buttons">
            <button className="cancel-btn" onClick={() => setNewMarker(null)}>
              취소
            </button>
            <button className="submit-btn" onClick={saveMarker}>
              ✨ 저장
            </button>
          </div>
        </div>
      )}

      {selectedMarker && (
        <div className="marker-comment-modal">
          <div className="modal-card">
            <h3>
              {selectedMarker.region}{" "}
              <span className="tag">
                {selectedMarker.type === "visited"
                  ? "다녀온 곳"
                  : "가보고 싶은 곳"}
              </span>
            </h3>
            <p className="modal-reason">{selectedMarker.reason}</p>
            <div className="comment-list">
              {comments.map((c, idx) => (
                <div key={idx} className="comment-item">
                  {c.content}
                </div>
              ))}
            </div>
            <div className="comment-input-group">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요"
              />
              <button onClick={submitComment}>등록</button>
            </div>
            <div className="map-fab-buttons">
              <button
                className="map-fab-button"
                onClick={() => setShowImageModal(true)}
              >
                📸 이미지 보기
              </button>
              <button
                className="map-fab-button"
                onClick={() => setShowUploadModal(true)}
              >
                📤 이미지 업로드
              </button>
            </div>
            <button
              className="modal-close-btn"
              onClick={() => setSelectedMarker(null)}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {showImageModal && selectedMarker && (
        <MarkerImageModal
          markerId={selectedMarker.id}
          onClose={() => setShowImageModal(false)}
        />
      )}
      {showUploadModal && selectedMarker && (
        <MarkerImageUploadModal
          markerId={selectedMarker.id}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import mapImg from "../assets/map.png";
import markerImg from "../assets/marker.png";
import "./TravelMap.css";
import { useNavigate } from "react-router-dom";



<button className="back-home-btn" onClick={() => navigate("/")}>← 홈으로</button>


const TravelMap = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [tempMarker, setTempMarker] = useState(null);
  const [markerData, setMarkerData] = useState({ region: "", reason: "", type: "want" });
  const [isAdding, setIsAdding] = useState(false);
  const [isDeletingMode, setIsDeletingMode] = useState(false);
  const [deletingMarker, setDeletingMarker] = useState(null);
  const [guideText, setGuideText] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("travel_pins").select("*");
      if (!error) setMarkers(data || []);
    };
    fetchData();
  }, []);

  const handleMapClick = (e) => {
    if (!isAdding) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTempMarker({ x, y });
    setGuideText(""); // 위치 선택 안내 숨김
  };

  const handleSave = async () => {
    const { region, reason, type } = markerData;
    if (!region.trim() || !reason.trim()) return alert("내용을 입력해 주세요.");
    if (!tempMarker) return alert("지도를 클릭해 위치를 선택해 주세요.");

    const { error } = await supabase.from("travel_pins").insert({
      region,
      reason,
      type,
      x: tempMarker.x,
      y: tempMarker.y,
    });

    if (error) {
      console.error("🔥 Supabase insert error:", error);
      return alert("저장 실패 😢");
    }

    setIsAdding(false);
    setTempMarker(null);
    setMarkerData({ region: "", reason: "", type: "want" });
    const { data } = await supabase.from("travel_pins").select("*");
    setMarkers(data || []);
    alert("저장 완료 ✨");
  };

  const handleMarkerClick = (marker) => {
    if (isDeletingMode) {
      setDeletingMarker(marker);
    }
  };

  const handleDelete = async () => {
    if (!deletingMarker) return;
    const { error } = await supabase.from("travel_pins").delete().eq("id", deletingMarker.id);
    if (error) return alert("삭제 실패");
    setDeletingMarker(null);
    const { data } = await supabase.from("travel_pins").select("*");
    setMarkers(data || []);
    alert("삭제 완료 🗑️");
  };

  return (
    <div className="travel-map-wrap">
      {!isAdding && !isDeletingMode && (
  <div className="map-fab-buttons">
  <button
    onClick={() => {
      setIsAdding(true);
      setGuideText("📍 지도를 클릭해 위치를 선택하세요.");
    }}
    className="map-fab-button"
  >
    📍 마커 추가
  </button>
  <button
    onClick={() => setIsDeletingMode(true)}
    className="map-fab-button"
  >
    ❌ 삭제 모드
  </button>
</div>

)}


      <div
        ref={mapRef}
        className={`travel-map-img-wrap ${isAdding ? "zoom" : ""}`}
        onClick={handleMapClick}
      >
        <img src={mapImg} alt="지도" className="travel-map-img" />

        {markers.map((m) => (
          <img
            key={m.id}
            src={markerImg}
            className={`travel-marker-img ${m.type}-marker`}
            style={{ top: `${m.y}%`, left: `${m.x}%`, position: "absolute" }}
            onClick={() => handleMarkerClick(m)}
          />
        ))}

        {isAdding && tempMarker && (
          <img
            src={markerImg}
            className="travel-marker-img temp-marker"
            style={{ top: `${tempMarker.y}%`, left: `${tempMarker.x}%`, position: "absolute" }}
          />
        )}
      </div>

      {guideText && <p className="guide-text">{guideText}</p>}

      {isAdding && (
        <div className="travel-modal-card">
          <div className="type-toggle">
            <button
              className={markerData.type === "want" ? "active" : ""}
              onClick={() => setMarkerData({ ...markerData, type: "want" })}
            >
              가보고 싶은 곳
            </button>
            <button
              className={markerData.type === "visited" ? "active" : ""}
              onClick={() => setMarkerData({ ...markerData, type: "visited" })}
            >
              다녀온 곳
            </button>
          </div>

          <input
            placeholder="지역명"
            value={markerData.region}
            onChange={(e) => setMarkerData({ ...markerData, region: e.target.value })}
            className="marker-input"
          />
          <input
            placeholder="이유를 입력해주세요"
            value={markerData.reason}
            onChange={(e) => setMarkerData({ ...markerData, reason: e.target.value })}
            className="marker-input"
          />

          <div className="marker-buttons">
            <button
              className="cancel-btn"
              onClick={() => {
                setIsAdding(false);
                setTempMarker(null);
                setGuideText("");
              }}
            >
              취소
            </button>
            <button className="submit-btn" onClick={handleSave}>
              ✨ 저장
            </button>
          </div>
        </div>
      )}

      {deletingMarker && (
        <div className="travel-modal-card">
          <p>
            <strong>{deletingMarker.region}</strong> - {deletingMarker.reason}
          </p>
          <div className="marker-buttons">
            <button className="cancel-btn" onClick={() => setDeletingMarker(null)}>
              취소
            </button>
            <button
              className="submit-btn"
              onClick={() => {
                handleDelete();
                setIsDeletingMode(false);
              }}
            >
              삭제하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelMap;
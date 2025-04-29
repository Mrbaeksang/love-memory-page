import React from "react";
import mapImg from "../assets/map.png";
import markerImg from "../assets/marker.png";
import "./TravelMap.css";

// 반드시 사용자 제공 좌표만 사용
const markers = [
  { region: "창원", desc: "베이커리", top: 68, left: 37 },
  { region: "고령", desc: "카페, 호수", top: 52, left: 34 },
  // ...추가 마커 좌표는 직접 입력
];

const TravelMap = () => {
  return (
    <div className="travel-map-wrap">
      <div
        className="travel-map-img-wrap"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 800,
          margin: "0 auto"
        }}
      >
        <img src={mapImg} alt="대한민국 지도" className="travel-map-img" />
        {markers.map((marker, idx) => (
          <img
  key={marker.region + idx}
  src={markerImg}
  alt={marker.region}
  className="travel-marker-img"
  style={{
    position: "absolute",
    top: `${marker.top}%`,
    left: `${marker.left}%`,
    transform: "translate(-50%, -100%)",
    cursor: "pointer",
    zIndex: 10,
    width: "24px",
    height: "auto"
  }}
/>
        ))}
      </div>
    </div>
  );
};

export default TravelMap;
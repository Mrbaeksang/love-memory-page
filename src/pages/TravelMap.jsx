import React, { useState } from "react";
import koreaMap from "../assets/korea-map.svg";
import pinImg from "../assets/pin.png";
import "./TravelMap.css";

const regions = [
  { id: "changwon", name: "창원", x: 260, y: 380 },
  { id: "goryeong", name: "고령", x: 240, y: 290 },
  { id: "namhae", name: "남해", x: 240, y: 460 },
  { id: "goseong", name: "고성", x: 270, y: 460 },
  { id: "yeosu", name: "여수", x: 300, y: 440 },
  { id: "suncheon", name: "순천", x: 285, y: 410 },
  { id: "namwon", name: "남원", x: 245, y: 360 },
  { id: "gurye", name: "구례", x: 270, y: 375 },
  { id: "haman", name: "함안", x: 235, y: 370 },
  { id: "busan", name: "부산", x: 305, y: 470 },
  { id: "daegu", name: "대구", x: 270, y: 270 }
];

const visited = regions.map(r => r.id);

const regionMemo = {
  changwon: { label: "창원", memo: "베이커리" },
  goryeong: { label: "고령", memo: "카페, 호수" },
  namhae: { label: "남해", memo: "캠핑" },
  goseong: { label: "고성", memo: "캠핑" },
  yeosu: { label: "여수", memo: "첫 여행" },
  suncheon: { label: "순천", memo: "100일여행, 국가정원, 순천만" },
  namwon: { label: "남원", memo: "100일여행" },
  gurye: { label: "구례", memo: "100일여행" },
  haman: { label: "함안", memo: "짜장면" },
  busan: { label: "부산", memo: "광안리, 서면" },
  daegu: { label: "대구", memo: "이월드" }
};

const TravelMap = () => {
  const [modal, setModal] = useState(null);
  const [mapHover, setMapHover] = useState(false);

  return (
    <div className="travel-map-wrap">
      <div
        className={`travel-map-svg travel-map-zoomable${mapHover ? " zoom" : ""}`}
        onMouseEnter={() => setMapHover(true)}
        onMouseLeave={() => setMapHover(false)}
      >
        <img src={koreaMap} alt="대한민국 지도" className="travel-map-img" />
        {regions.map(r => (
          <button
            key={r.id}
            className={`travel-pin-img ${visited.includes(r.id) ? "visited" : ""}`}
            style={{ left: r.x, top: r.y }}
            onClick={() => setModal(r.id)}
            title={r.name}
          >
            <img src={pinImg} alt="여행 핀" className="travel-pin-icon" />
          </button>
        ))}
      </div>

      {modal && (
        <div className="travel-modal-bg" onClick={() => setModal(null)}>
          <div className="travel-modal-card" onClick={e => e.stopPropagation()}>
            <h3>{regionMemo[modal]?.label || modal}</h3>
            <div className="travel-modal-memo">
              {regionMemo[modal]?.memo || "기억이 없습니다."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelMap;

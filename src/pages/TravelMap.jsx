// src/pages/TravelMap.jsx
import React, { useEffect, useRef, useState } from "react";
import "./TravelMap.css";

export default function TravelMap() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [infoWindow, setInfoWindow] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    window.initMap = () => {
      const mapOptions = {
        center: new window.naver.maps.LatLng(37.5665, 126.9780),
        zoom: 14,
        mapTypeControl: true,
      };

      const nMap = new window.naver.maps.Map("map", mapOptions);
      setMap(nMap);

      const nMarker = new window.naver.maps.Marker({
        position: mapOptions.center,
        map: nMap,
      });
      setMarker(nMarker);

      const nInfoWindow = new window.naver.maps.InfoWindow({ anchorSkew: true });
      setInfoWindow(nInfoWindow);

      window.naver.maps.Event.addListener(nMap, "click", (e) => {
        const latlng = e.coord;
        nMarker.setPosition(latlng);

        fetch(`/api/reverse-geocode?lat=${latlng.lat()}&lng=${latlng.lng()}`)
          .then((res) => res.json())
          .then((data) => {
            const address =
              data?.results?.[0]?.land?.name || "주소 정보 없음";

            const content = `
              <div style="padding:10px;min-width:200px;line-height:150%;">
                <b>선택된 위치</b><br />
                ${address}
              </div>
            `;
            nInfoWindow.setContent(content);
            nInfoWindow.open(nMap, nMarker);
          });
      });
    };

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${import.meta.env.VITE_NAVER_API_KEY_ID}&callback=initMap`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleSearch = async () => {
    if (!searchInput.trim() || !map || !marker) return;

    const res = await fetch(`/api/geocode?query=${encodeURIComponent(searchInput)}`);
    const json = await res.json();
    const item = json.addresses?.[0];
    if (!item) return alert("검색 결과 없음");

    const latlng = new window.naver.maps.LatLng(item.y, item.x);
    map.setCenter(latlng);
    marker.setPosition(latlng);

    const address = item.roadAddress || item.jibunAddress || "주소 없음";
    const content = `
      <div style="padding:10px;min-width:200px;line-height:150%;">
        <b>검색 결과</b><br />
        ${address}
      </div>
    `;
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
  };

  return (
    <div className="travel-map-wrap">
      <div className="search-box">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="주소 입력"
        />
        <button onClick={handleSearch}>🔍 검색</button>
      </div>
      <div id="map" ref={mapRef} className="naver-map"></div>
    </div>
  );
}

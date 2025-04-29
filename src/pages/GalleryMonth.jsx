import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { galleryFileMap } from "./galleryFileMap";
import "./GalleryMonth.css";

const GalleryMonth = () => {
  const { year, month } = useParams();
  const navigate = useNavigate();
  const images = (galleryFileMap[year] && galleryFileMap[year][month]) || [];
  const [modalImg, setModalImg] = useState(null);
  useEffect(() => {
    console.log("[GalleryMonth] year:", year, "month:", month, "images:", images);
  }, [year, month, images]);
  const title = `${year}년 ${parseInt(month, 10)}월의 우리`;
  const emotionText = "이 달의 소중한 추억들을 담았어요.";

  if (!images || images.length === 0) {
    return (
      <div className="gallery-month-bg">
        <div className="gallery-header-bar">
          <button className="gallery-home-btn" onClick={() => navigate("/")}>← 홈으로</button>
        </div>
        <h2 className="gallery-month-title">{title}</h2>
        <div className="gallery-month-emotion">{emotionText}</div>
        <div style={{textAlign:'center',color:'#b0b0b0',marginTop:'2em',fontSize:'1.1em'}}>아직 등록된 추억이 없습니다.<br/>이미지 파일명을 다시 확인해 주세요.</div>
      </div>
    );
  }

  return (
    <div className="gallery-month-bg">
      <div className="gallery-header-bar">
        <button className="gallery-home-btn" onClick={() => navigate("/")}>← 홈으로</button>
      </div>
      <h2 className="gallery-month-title">{title}</h2>
      <div className="gallery-month-emotion">{emotionText}</div>
      <div className="gallery-month-grid">
        {images.map((img, idx) => (
          <div className="gallery-photo-card" key={img}>
            <img
              src={`/gallery/${img}`}
              alt={`추억 ${idx + 1}`}
              loading="lazy"
              className="gallery-photo-img"
              onClick={() => setModalImg(`/gallery/${img}`)}
              onError={e => { e.target.style.display = 'none'; console.warn('이미지 로드 실패:', img); }}
              style={{cursor:'zoom-in'}}
            />
          </div>
        ))}
      </div>
      {modalImg && (
        <div className="gallery-modal-bg" onClick={() => setModalImg(null)}>
          <div className="gallery-modal-img-wrap">
            <img src={modalImg} alt="확대 이미지" className="gallery-modal-img" />
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryMonth;

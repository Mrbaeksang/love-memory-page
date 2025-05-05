import React, { useEffect, useState } from "react";
import "./TrackListModal.css";

const TrackListModal = ({ tracks, metadataCache, onSelect, onClose }) => {
  const [metadata, setMetadata] = useState([]);

  useEffect(() => {
    const loadMetadata = async () => {
      const loaded = await Promise.all(
        tracks.map(async (src, index) => {
          if (metadataCache.has(src)) {
            const data = metadataCache.get(src);
            return { title: data.title || `Track ${index + 1}`, index };
          }

          try {
            const res = await fetch(src);
            const blob = await res.blob();
            return new Promise((resolve) => {
              window.jsmediatags.read(blob, {
                onSuccess: ({ tags }) => {
                  const data = {
                    title: tags.title || `Track ${index + 1}`,
                  };
                  metadataCache.set(src, data);
                  resolve({ ...data, index });
                },
                onError: () => {
                  const fallback = {
                    title: `Track ${index + 1}`,
                  };
                  metadataCache.set(src, fallback);
                  resolve({ ...fallback, index });
                },
              });
            });
          } catch {
            return { title: `Track ${index + 1}`, index };
          }
        })
      );
      setMetadata(loaded);
    };

    loadMetadata();
  }, [tracks, metadataCache]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="track-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">전체 곡 목록</h2>
        <div className="track-list">
          {metadata.map(({ title, index }) => (
            <div
              key={index}
              className="track-card"
              onClick={() => onSelect(index)}
            >
              <span className="track-name">{title}</span>
            </div>
          ))}
        </div>
        <button className="close-btn" onClick={onClose}>
          뒤로가기
        </button>
      </div>
    </div>
  );
};

export default TrackListModal;

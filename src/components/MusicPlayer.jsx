// src/components/MusicPlayer.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX
} from "lucide-react";
import "./MusicPlayer.css";

const tracks = Array.from({ length: 25 }, (_, i) => `/music/love${i + 1}.mp3`);

const MusicPlayer = () => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * tracks.length));
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const location = useLocation();

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => {
        console.warn("자동재생 차단 또는 재생 오류:", e);
      });
    }
    setPlaying(!playing);
  };

  const playNext = () => {
    const nextIndex = Math.floor(Math.random() * tracks.length);
    setCurrentIndex(nextIndex);
    setPlaying(true);
  };

  const playPrev = () => {
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentIndex(prevIndex);
    setPlaying(true);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !muted;
    audioRef.current.muted = newMuted;
    setMuted(newMuted);
  };

  const onTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const onEnded = () => {
    playNext();
  };

  const onSeek = (e) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = tracks[currentIndex];
    audio.load();
    audio.muted = muted;

    // 메타데이터 가져오기 (via blob)
    fetch(tracks[currentIndex])
      .then((res) => res.blob())
      .then((blob) => {
        if (window.jsmediatags) {
          window.jsmediatags.read(blob, {
            onSuccess: ({ tags }) => {
              setTitle(tags.title || `Track ${currentIndex + 1}`);
              setArtist(tags.artist || "Unknown Artist");
            },
            onError: () => {
              setTitle(`Track ${currentIndex + 1}`);
              setArtist("Unknown Artist");
            },
          });
        }
      })
      .catch(() => {
        setTitle(`Track ${currentIndex + 1}`);
        setArtist("Unknown Artist");
      });

    const handleLoaded = () => {
      setDuration(audio.duration || 0);
      if (playing) {
        audio.play().catch((e) => {
          console.warn("재생 실패:", e);
        });
      }
    };

    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current && playing) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [playing]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  return (
    <div className={`music-player-container ${location.pathname === "/" ? "float" : "dock"}`}>
      {/* ✅ 반드시 포함 */}
      <audio ref={audioRef} onTimeUpdate={onTimeUpdate} />

      <div className="music-player-inner">
        <div className="music-btn-group">
          <button className="music-btn" onClick={playPrev}><SkipBack size={18} /></button>
          <button className="music-btn" onClick={togglePlay}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button className="music-btn" onClick={playNext}><SkipForward size={18} /></button>
          <button className="music-btn" onClick={toggleMute}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        <div className="music-info">
          <span className="track-title">{title}</span>
          <span className="track-artist">{artist}</span>
        </div>

        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={currentTime}
          onChange={onSeek}
          className="progress-bar"
        />

        <div className="time-info">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;

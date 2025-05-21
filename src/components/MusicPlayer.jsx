import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronUp, ChevronDown
} from "lucide-react";
import "./MusicPlayer.css";

const tracks = Array.from({ length: 100 }, (_, i) => `/music/love${i + 1}.mp3`);

const MusicPlayer = () => {
  const audioRef = useRef(null);
  const location = useLocation();

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * tracks.length));
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [metadataCache] = useState(() => new Map());

  const playAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = false;
    audio.play().then(() => {
      setPlaying(true);
    }).catch((err) => {
      console.warn("Autoplay blocked:", err);
      setPlaying(false);
    });
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const playNext = () => {
  let nextIndex;
  do {
    nextIndex = Math.floor(Math.random() * tracks.length);
  } while (tracks.length > 1 && nextIndex === currentIndex); // 같은 곡 제외
  setCurrentIndex(nextIndex);
};


  const playPrev = () => {
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentIndex(prevIndex);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !muted;
      setMuted(!muted);
    }
  };

  const onSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  useEffect(() => {
  const audio = audioRef.current;
  if (!audio) return;

  audio.src = tracks[currentIndex];
  audio.load();
  audio.muted = false;

  const handleLoaded = () => {
    setDuration(audio.duration || 0);
    playAudio();
  };

  const updateTime = () => setCurrentTime(audio.currentTime);
  const handleEnded = () => playNext();

  const handleError = () => {
    console.warn(`❌ 트랙이 존재하지 않음: ${tracks[currentIndex]}. 다음 곡으로 넘어갑니다.`);
    playNext();
  };

  audio.addEventListener("loadedmetadata", handleLoaded);
  audio.addEventListener("timeupdate", updateTime);
  audio.addEventListener("ended", handleEnded);
  audio.addEventListener("error", handleError); // 🔥 에러 핸들링

  // 제목 처리
  if (metadataCache.has(tracks[currentIndex])) {
    setTitle(metadataCache.get(tracks[currentIndex]).title);
  } else {
    fetch(tracks[currentIndex])
      .then(res => res.blob())
      .then(blob => {
        if (window.jsmediatags) {
          window.jsmediatags.read(blob, {
            onSuccess: ({ tags }) => {
              const t = tags.title || `Track ${currentIndex + 1}`;
              setTitle(t);
              metadataCache.set(tracks[currentIndex], { title: t });
            },
            onError: () => {
              const fallback = `Track ${currentIndex + 1}`;
              setTitle(fallback);
              metadataCache.set(tracks[currentIndex], { title: fallback });
            }
          });
        }
      });
  }

  // 🧹 정리
  return () => {
    audio.removeEventListener("loadedmetadata", handleLoaded);
    audio.removeEventListener("timeupdate", updateTime);
    audio.removeEventListener("ended", handleEnded);
    audio.removeEventListener("error", handleError);
  };
}, [currentIndex]);


  return (
    <div className={`music-player-container ${location.pathname === "/" ? "float" : "dock"} ${isCollapsed ? "collapsed" : ""}`}>
      <audio ref={audioRef} />

      <div className="music-player-inner">
        {isCollapsed ? (
          <div className="collapsed-controls">
            <div className="collapsed-left">
              <button className="music-btn" onClick={playPrev}><SkipBack /></button>
              <button className="music-btn" onClick={togglePlay}>{playing ? <Pause /> : <Play />}</button>
              <button className="music-btn" onClick={playNext}><SkipForward /></button>
              <button className="music-btn" onClick={toggleMute}>{muted ? <VolumeX /> : <Volume2 />}</button>
            </div>
            <button className="collapse-btn" onClick={() => setIsCollapsed(false)}><ChevronUp /></button>
          </div>
        ) : (
          <>
            <div className="main-controls">
              <button className="music-btn" onClick={playPrev}><SkipBack /></button>
              <button className="music-btn" onClick={togglePlay}>{playing ? <Pause /> : <Play />}</button>
              <button className="music-btn" onClick={playNext}><SkipForward /></button>
              <button className="music-btn" onClick={toggleMute}>{muted ? <VolumeX /> : <Volume2 />}</button>
              <button className="collapse-btn" onClick={() => setIsCollapsed(true)}><ChevronDown /></button>
            </div>
            <div className="track-title">{title}</div>
            <input type="range" min="0" max={duration} step="0.1" value={currentTime} onChange={onSeek} className="progress-bar" />
            <div className="time-info">{formatTime(currentTime)} / {formatTime(duration)}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;

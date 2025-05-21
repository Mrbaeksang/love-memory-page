import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronUp, ChevronDown
} from "lucide-react";
import "./MusicPlayer.css";

// 🎵 love1.mp3 ~ love100.mp3 트랙 경로 생성
const tracks = Array.from({ length: 100 }, (_, i) => `/music/love${i + 1}.mp3`);

const MusicPlayer = () => {
  const audioRef = useRef(null);                     // <audio> 요소 접근용 ref
  const location = useLocation();                    // 현재 라우터 경로 확인

  // 🔊 상태 설정
  const [playing, setPlaying] = useState(false);     // 재생 중 여부
  const [muted, setMuted] = useState(false);         // 음소거 여부
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.floor(Math.random() * tracks.length)        // 초기 트랙 인덱스는 랜덤
  );
  const [title, setTitle] = useState("");            // 현재 곡 제목
  const [duration, setDuration] = useState(0);       // 곡 전체 길이
  const [currentTime, setCurrentTime] = useState(0); // 현재 재생 시간
  const [isCollapsed, setIsCollapsed] = useState(false); // 접힘 여부
  const [metadataCache] = useState(() => new Map()); // 제목 캐싱

  // ▶️ 오디오 재생
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

  // ⏯ 재생/일시정지 토글
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

  // ⏭ 다음 곡 랜덤 재생 (현재 곡은 제외)
  const playNext = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } while (tracks.length > 1 && nextIndex === currentIndex);
    setCurrentIndex(nextIndex);
  };

  // ⏮ 이전 곡 (순차적으로 한 곡 전)
  const playPrev = () => {
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentIndex(prevIndex);
  };

  // 🔇 음소거 토글
  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !muted;
      setMuted(!muted);
    }
  };

  // 🎚 슬라이더로 재생 위치 이동
  const onSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // ⏱ 시간 포맷 변환 (초 → 분:초)
  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  };

  // 🎵 트랙이 변경될 때마다 실행
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
    const handleEnded = () => playNext(); // 자동 다음곡
    const handleError = () => {
      console.warn(`❌ 트랙이 존재하지 않음: ${tracks[currentIndex]}. 다음 곡으로 넘어갑니다.`);
      playNext();
    };

    // 📌 이벤트 등록
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // 🎧 제목 불러오기
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

    // 🧹 이벤트 해제
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [currentIndex]);

  // 📦 렌더링 부분
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
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={currentTime}
              onChange={onSeek}
              className="progress-bar"
            />
            <div className="time-info">{formatTime(currentTime)} / {formatTime(duration)}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;

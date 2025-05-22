import React, { useEffect, useState } from "react"; // React 훅 임포트
import { useNavigate } from "react-router-dom"; // 페이지 이동을 위한 useNavigate 훅 임포트
import { supabase } from "../lib/supabaseClient"; // Supabase 클라이언트 임포트
import "./FullGallery.css"; // 컴포넌트 스타일시트 임포트
import usePageLogger from "../hooks/usePageLogger"; // 페이지 로깅 커스텀 훅 임포트

const FullGallery = () => {
  usePageLogger(); // 페이지 뷰를 기록하는 커스텀 훅 사용
  const [thumbnails, setThumbnails] = useState([]); // 썸네일 이미지 데이터를 저장할 상태
  const [loading, setLoading] = useState(true); // 로딩 상태 관리
  const navigate = useNavigate(); // 프로그래밍 방식의 페이지 이동을 위한 훅

  useEffect(() => {
    const fetchThumbnails = async () => {
      const allThumbs = []; // 모든 썸네일 데이터를 담을 배열

      // Supabase 스토리지의 'thumb' 디렉토리에서 연도 폴더 목록을 가져옵니다.
      const { data: yearFolders, error: yearError } = await supabase.storage
        .from("gallery") // 'gallery' 스토리지 버킷 사용
        .list("thumb", { limit: 100 }); // 연도 폴더를 최대 100개까지 가져오기

      if (yearError) {
        console.error("❌ 연도 목록 조회 실패:", yearError); // 연도 폴더 조회 실패 시 에러 로깅
        setLoading(false); // 성공 여부와 관계없이 로딩 중지
        return;
      }

      // 각 연도 폴더를 반복합니다.
      for (const year of yearFolders || []) {
        // 연도 폴더 이름이 4자리 숫자인지 유효성 검사
        if (!/^\d{4}$/.test(year.name)) continue;

        // 각 연도 폴더 내에서 월 폴더 목록을 가져옵니다.
        const { data: monthFolders } = await supabase.storage
          .from("gallery")
          .list(`thumb/${year.name}`, { limit: 100 }); // 연도당 최대 100개의 월 폴더

        // 각 월 폴더를 반복합니다.
        for (const month of monthFolders || []) {
          // 월 폴더 이름이 2자리 숫자인지 유효성 검사
          if (!/^\d{2}$/.test(month.name)) continue;

          // 각 월 폴더 내에서 파일(썸네일) 목록을 가져옵니다.
          const { data: files } = await supabase.storage
            .from("gallery")
            .list(`thumb/${year.name}/${month.name}`, { limit: 100 }); // 월당 최대 100개의 파일

          // 각 썸네일 파일을 반복합니다.
          for (const file of files || []) {
            const path = `thumb/${year.name}/${month.name}/${file.name}`; // 썸네일의 전체 경로 구성
            const url = supabase.storage.from("gallery").getPublicUrl(path).data.publicUrl; // 썸네일의 공개 URL 가져오기

            allThumbs.push({
              url, // 썸네일 URL
              fullPath: `${year.name}/${month.name}/${file.name}`, // 탐색에 사용될 전체 경로
            });
          }
        }
      }

      setThumbnails(allThumbs.reverse()); // 가져온 썸네일을 최신순으로 정렬하여 상태에 설정
      setLoading(false); // 데이터 로딩이 완료되면 로딩 상태를 false로 변경
    };

    fetchThumbnails(); // 컴포넌트 마운트 시 썸네일을 가져오는 함수 호출
  }, []); // 빈 의존성 배열은 이 효과가 초기 렌더링 후에 한 번만 실행됨을 의미합니다.

  // 썸네일 클릭 시 상세 페이지로 이동하는 함수
  const handleClick = (fullPath) => {
    navigate(`/comment-detail?img=${encodeURIComponent(fullPath)}`); // 이미지 경로와 함께 댓글 상세 페이지로 이동
    window.scrollTo(0, 0); // 페이지 상단으로 스크롤
  };

  return (
    <div className="full-gallery-wrapper">
      {/* 홈으로 돌아가기 버튼 */}
      <button className="back-to-home-btn" onClick={() => navigate("/")}>
        ← 홈으로 돌아가기
      </button>

      {/* 페이지 제목 */}
      <h2 className="full-gallery-title">📂 우리의 소중한 추억 모아보기</h2>
      <p className="full-gallery-intro">
        우리가 함께 담았던 모든 아름다운 순간들을 둘러보세요!
      </p>

      {/* 로딩 상태 및 썸네일 데이터에 따른 조건부 렌더링 */}
      {loading ? (
        <p className="loading-message">추억을 불러오는 중...</p>
      ) : thumbnails && thumbnails.length > 0 ? ( // 썸네일이 존재하고 비어있지 않은지 확인
        <div className="full-gallery-grid">
          {thumbnails.map((thumb, idx) => (
            <div
              key={idx} // key로 인덱스 사용 (더 나은 성능을 위해 고유 ID가 있다면 고려)
              className="thumb-card"
              onClick={() => handleClick(thumb.fullPath)} // 클릭 시 상세 보기 처리
            >
              <img src={thumb.url} alt={`추억 ${idx + 1}`} className="thumb-image" />
            </div>
          ))}
        </div>
      ) : (
        // 이미지가 없을 때 메시지
        <p className="no-images-message">아직 추억이 없네요. 새로운 추억을 만들어보세요!</p>
      )}
    </div>
  );
};

export default FullGallery; // 애플리케이션의 다른 부분에서 사용할 수 있도록 컴포넌트 내보내기
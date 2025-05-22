import React, { useEffect, useState } from "react"; // React와 훅 임포트
import "./Memories.css"; // 컴포넌트 스타일시트 임포트
import { useNavigate } from "react-router-dom"; // 페이지 이동 훅 임포트
import RandomImage from "../RandomImage"; // 랜덤 이미지 컴포넌트 임포트
import { supabase } from "../lib/supabaseClient"; // Supabase 클라이언트 임포트
import RandomCommentedImageButton from "../components/RandomCommentedImageButton"; // 랜덤 코멘트 이미지 버튼 컴포넌트 임포트
import usePageLogger from "../hooks/usePageLogger"; // 페이지 로거 훅 임포트 (로그인 여부 확인용)

// Memories 컴포넌트 정의
const Memories = () => {
  usePageLogger(); // 페이지 접근 시 로그인 상태를 기록하는 훅 사용

  const navigate = useNavigate(); // 페이지 이동을 위한 navigate 함수 초기화
  const [thumbnails, setThumbnails] = useState([]); // 갤러리 썸네일 이미지 목록 상태

  // 컴포넌트가 마운트될 때 썸네일 이미지들을 Supabase Storage에서 불러오는 useEffect
  useEffect(() => {
    const fetchThumbnails = async () => {
      const result = []; // 최종 썸네일 데이터를 저장할 배열

      // 1. Supabase Storage의 'gallery' 버킷에서 연도 폴더 목록을 불러옴
      // limit: 100, offset: 0은 최대 100개까지 가져오도록 설정
      const { data: yearFolders, error } = await supabase.storage.from("gallery").list("", {
        limit: 100,
        offset: 0,
      });

      if (error) return console.error("연도 폴더 불러오기 실패", error); // 에러 발생 시 콘솔에 출력 후 함수 종료

      // 2. 각 연도 폴더에 대해 반복 처리 (폴더 이름이 4자리 숫자인 경우만 필터링)
      for (const year of yearFolders.filter(f => f.name.match(/^\d{4}$/))) {
        // 3. 해당 연도 폴더 내의 월 폴더 목록을 불러옴
        const { data: monthFolders } = await supabase.storage.from("gallery").list(`${year.name}`, {
          limit: 100,
          offset: 0,
        });

        // 4. 각 월 폴더에 대해 반복 처리 (폴더 이름이 2자리 숫자인 경우만 필터링)
        for (const month of monthFolders.filter(f => f.name.match(/^\d{2}$/))) {
          // 5. 해당 월 폴더 내의 이미지 파일 중 첫 번째 파일만 불러옴 (썸네일용)
          const { data: imageFiles } = await supabase.storage.from("gallery").list(`${year.name}/${month.name}`, {
            limit: 1,
          });

          // 6. 이미지 파일이 존재하고, 최소 한 개 이상일 경우 썸네일 정보 추가
          if (imageFiles && imageFiles.length > 0) {
            const thumbPath = `${year.name}/${month.name}/${imageFiles[0].name}`; // 썸네일 이미지 경로
            // Supabase Storage에서 해당 경로의 공개 URL을 가져옴
            const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(thumbPath);

            // 결과 배열에 연도, 월, 썸네일 URL 추가
            result.push({
              year: year.name,
              month: month.name,
              thumb: publicUrl,
            });
          }
        }
      }

      // 7. 썸네일 목록을 최신순으로 정렬 (연도 역순, 월 역순)
      result.sort((a, b) => b.year.localeCompare(a.year) || b.month.localeCompare(a.month));
      setThumbnails(result); // 정렬된 썸네일 목록으로 상태 업데이트
    };

    fetchThumbnails(); // 썸네일 불러오는 함수 호출
  }, []); // 의존성 배열이 비어 있으므로 컴포넌트가 처음 마운트될 때 한 번만 실행

  // 컴포넌트 렌더링
  return (
    <div className="memories-container"> {/* 전체 메모리 페이지 컨테이너 */}

      {/* 상단 버튼 그룹 (사진 업로드, 랜덤 코멘트 이미지) */}
      <div className="memories-top-button-group">
        <button className="upload-button" onClick={() => navigate("/upload")}>
          📤 사진 업로드 {/* 클릭 시 /upload 경로로 이동 */}
        </button>
        <RandomCommentedImageButton
          onSelect={(url) => {
            // 랜덤 이미지가 선택되면 해당 이미지 URL을 파라미터로 넘겨 갤러리 페이지로 이동
            navigate(`/gallery/random?img=${encodeURIComponent(url)}`);
          }}
        />
      </div>

      {/* 랜덤 이미지 컴포넌트 */}
      <RandomImage />

      {/* 월별 썸네일 그리드 */}
      <div className="memories-thumbnail-grid">
        {thumbnails.map(({ year, month, thumb }) => ( // 썸네일 목록을 매핑하여 각 썸네일 카드 생성
          <div
            key={`${year}-${month}`} // 각 카드의 고유 키 (연도-월)
            className="memories-thumb-card" // 썸네일 카드 스타일 클래스
            onClick={() => navigate(`/gallery/${year}/${month}`)} // 클릭 시 해당 월의 갤러리 페이지로 이동
          >
            <img
              src={thumb} // 썸네일 이미지 소스
              alt={`${year}년 ${month}월 썸네일`} // 이미지 대체 텍스트
              className="memories-thumb-img" // 썸네일 이미지 스타일 클래스
              loading="lazy" // 이미지 지연 로딩 활성화
            />
            <span className="memories-thumb-label">{year}.{month}</span> {/* 연도.월 라벨 */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Memories; // Memories 컴포넌트 내보내기
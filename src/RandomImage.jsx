import { useEffect, useRef, useState } from "react"; // React 훅 임포트: 컴포넌트 생명주기 관리, DOM 참조, 상태 관리
import { useNavigate } from "react-router-dom"; // React Router 훅: 프로그래밍 방식으로 페이지 이동
import { supabase } from "./lib/supabaseClient"; // Supabase 클라이언트 인스턴스 임포트: 데이터베이스 및 스토리지와 상호작용
import "./RandomImage.css"; // 컴포넌트 스타일을 위한 CSS 파일 임포트

/**
 * Supabase Storage에서 랜덤 이미지를 가져와 표시하는 컴포넌트입니다.
 * 작은 크기에서는 썸네일을 로드하고, 특정 크기 이상에서는 원본 이미지를 로드하여 최적화를 시도합니다.
 * 클릭 시 해당 이미지의 상세 페이지로 이동합니다.
 *
 * @param {Object} props - 컴포넌트에 전달되는 props
 * @param {Object} props.style - 이미지 요소에 적용할 추가 CSS 스타일 객체
 */
const RandomImage = ({ style = {} }) => {
  // 상태 변수 정의
  const [thumbUrl, setThumbUrl] = useState(null); // 썸네일 이미지 URL을 저장
  const [originUrl, setOriginUrl] = useState(null); // 원본 이미지 URL을 저장
  const [useOriginal, setUseOriginal] = useState(false); // 원본 이미지를 사용할지 여부를 저장 (초기값: false, 썸네일 사용)

  // useRef 훅: <img> 요소에 대한 직접적인 DOM 참조를 생성
  const imgRef = useRef(null);

  // useNavigate 훅: 페이지 이동을 위한 함수를 가져옴
  const navigate = useNavigate();

  // 첫 번째 useEffect: 컴포넌트 마운트 시 랜덤 썸네일 및 원본 이미지 URL을 가져옴
  useEffect(() => {
    const fetchRandomThumbnail = async () => {
      try {
        // Supabase Storage에서 최상위 폴더(연도) 목록을 가져옴
        const { data: folders, error: folderErr } = await supabase.storage
          .from("gallery") // 'gallery' 버킷에서
          .list("", { limit: 100 }); // 빈 경로(루트)에서 최대 100개의 항목을 나열

        // 폴더 가져오기 중 에러 발생 시 처리
        if (folderErr || !folders) {
          console.error("상위 폴더 에러:", folderErr);
          return;
        }

        // 폴더 목록에서 실제 폴더(메타데이터가 없는 항목)의 이름을 추출 (예: '2023', '2024')
        const folderPaths = folders
          .filter(f => f.name && f.metadata === null) // 이름이 있고 메타데이터가 없는 항목만 필터링 (폴더)
          .map(f => f.name); // 이름만 추출

        let allFiles = []; // 모든 이미지 파일 정보를 저장할 배열

        // 각 연도 폴더를 반복
        for (const year of folderPaths) {
          // 해당 연도 폴더 내의 월(month) 폴더 목록을 가져옴
          const { data: months } = await supabase.storage.from("gallery").list(year);
          const monthFolders = (months || []) // 월 폴더가 없으면 빈 배열 사용
            .filter(m => m.name && m.metadata === null) // 이름이 있고 메타데이터가 없는 항목만 필터링 (폴더)
            .map(m => m.name); // 이름만 추출

          // 각 월 폴더를 반복
          for (const month of monthFolders) {
            // 해당 '연도/월' 경로 내의 파일 목록을 가져옴
            const { data: files } = await supabase.storage
              .from("gallery")
              .list(`${year}/${month}`);

            // 이미지 파일(jpg, jpeg, png, webp)만 필터링하고 파일 정보를 추출
            const imageFiles = (files || []) // 파일이 없으면 빈 배열 사용
              .filter(file => /\.(jpe?g|png|webp)$/i.test(file.name)) // 이미지 파일 확장자 정규식 검사
              .map(f => ({ year, month, name: f.name })); // 연도, 월, 파일 이름으로 구성된 객체 생성

            allFiles.push(...imageFiles); // 추출된 이미지 파일 정보를 allFiles 배열에 추가
          }
        }

        // 이미지 파일을 찾지 못했을 경우 경고 메시지 출력 후 종료
        if (!allFiles.length) {
          console.warn("이미지를 찾을 수 없음.");
          return;
        }

        // 전체 파일 목록에서 무작위로 하나의 이미지를 선택
        const random = allFiles[Math.floor(Math.random() * allFiles.length)];

        // 썸네일과 원본 이미지의 경로를 생성
        const thumbPath = `thumb/${random.year}/${random.month}/${random.name}`;
        const originPath = `${random.year}/${random.month}/${random.name}`;

        // Supabase Storage에서 썸네일과 원본 이미지의 공개 URL을 가져옴
        const thumb = supabase.storage.from("gallery").getPublicUrl(thumbPath).data?.publicUrl;
        const original = supabase.storage.from("gallery").getPublicUrl(originPath).data?.publicUrl;

        // 상태 업데이트: 썸네일 URL 설정 (썸네일이 없으면 원본으로 대체), 원본 URL 설정
        setThumbUrl(thumb || original);
        setOriginUrl(original);
      } catch (err) {
        console.error("썸네일 로딩 에러:", err); // 에러 발생 시 콘솔에 출력
      }
    };

    fetchRandomThumbnail(); // 컴포넌트가 마운트될 때 랜덤 썸네일 가져오기 함수 호출
  }, []); // 빈 의존성 배열: 컴포넌트가 처음 렌더링될 때 한 번만 실행

  // 두 번째 useEffect: 이미지 크기 변화를 감지하여 원본 이미지 로드 여부를 결정 (최적화)
  useEffect(() => {
    // imgRef가 참조하는 요소가 없거나 originUrl이 없으면 함수 실행 중단
    if (!imgRef.current || !originUrl) return;

    // ResizeObserver를 생성: imgRef.current 요소의 크기 변화를 관찰
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect; // 요소의 현재 너비와 높이를 가져옴
      // 이미지 너비 또는 높이가 300px 이상이면 원본 이미지 사용 상태로 변경
      if (width >= 300 || height >= 300) {
        setUseOriginal(true);
      }
    });

    observer.observe(imgRef.current); // imgRef.current 요소의 관찰을 시작
    // 클린업 함수: 컴포넌트 언마운트 시 옵저버 연결 해제
    return () => observer.disconnect();
  }, [originUrl]); // originUrl이 변경될 때마다 이 효과를 다시 실행

  /**
   * 이미지를 클릭했을 때 호출되는 핸들러 함수입니다.
   * 이미지 상세 페이지로 이동하고, 원본 이미지 URL을 쿼리 파라미터로 전달합니다.
   */
  const handleClick = () => {
    if (originUrl) {
      // 원본 이미지 URL이 있다면 상세 페이지로 이동
      navigate(`/comment-detail?img=${encodeURIComponent(originUrl)}`);
      window.scrollTo(0, 0); // 페이지 상단으로 스크롤
    }
  };

  // 컴포넌트 렌더링
  return thumbUrl ? ( // 썸네일 URL이 있을 경우에만 이미지 컨테이너를 렌더링
    <div className="lovetype-random-image-wrap">
      <img
        ref={imgRef} // imgRef를 <img> 요소에 연결
        src={useOriginal ? originUrl : thumbUrl} // useOriginal 값에 따라 썸네일 또는 원본 URL 사용
        alt="감성 랜덤 썸네일" // 이미지 대체 텍스트
        className="lovetype-random-image clickable" // CSS 클래스 적용
        style={style} // props로 받은 스타일 적용
        loading="lazy" // 이미지 지연 로딩 설정 (성능 최적화)
        onClick={handleClick} // 클릭 이벤트 핸들러
        onError={(e) => {
          // 이미지 로딩 실패 시 (예: 썸네일이 없거나 깨졌을 때)
          if (originUrl) e.target.src = originUrl; // 원본 이미지 URL로 다시 로드 시도
        }}
      />
    </div>
  ) : null; // 썸네일 URL이 없으면 아무것도 렌더링하지 않음
};

export default RandomImage; // RandomImage 컴포넌트 내보내기
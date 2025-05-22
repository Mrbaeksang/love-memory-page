import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient"; // Supabase 클라이언트 임포트
import { addEmojiIfMatch } from "../utils/emojiMap"; // 텍스트에 이모지를 추가하는 유틸리티 함수 임포트
import "./RandomSelectorPage.css"; // 컴포넌트 CSS 스타일시트 임포트

// 카테고리 상수 정의
const CATEGORIES = [
  { key: "date", label: "🧡 데이트" }, // 데이트 카테고리
  { key: "food", label: "🍽 음식" }, // 음식 카테고리
  { key: "activity", label: "🎮 활동" }, // 활동 카테고리
  { key: "custom", label: "🪄 커스텀" }, // 커스텀 카테고리
];

// RandomSelectorPage 컴포넌트 정의
const RandomSelectorPage = () => {
  // 현재 선택된 카테고리 상태 (기본값: date)
  const [selectedCategory, setSelectedCategory] = useState("date");
  // 선택지 목록 상태
  const [options, setOptions] = useState([]);
  // 새로 추가할 선택지 입력 필드 상태
  const [newOption, setNewOption] = useState("");
  // 룰렛이 돌아가는 중인지 여부 상태
  const [isRolling, setIsRolling] = useState(false);
  // 룰렛이 돌아갈 때 표시되는 텍스트 상태
  const [rollingText, setRollingText] = useState("");
  // 최종 결과 목록 상태
  const [finalResults, setFinalResults] = useState([]);
  // 여러 개 뽑기 시 선택할 개수 상태 (기본값: 1)
  const [multiCount, setMultiCount] = useState(1);
  // 여러 개 뽑기 입력 필드 표시 여부 상태
  const [showMultiInput, setShowMultiInput] = useState(false);

  // 선택된 카테고리가 변경될 때마다 옵션을 가져오거나 초기화하는 useEffect
  useEffect(() => {
    if (selectedCategory === "custom") {
      setOptions([]); // 커스텀 카테고리일 경우 옵션 초기화
    } else {
      fetchOptions(); // 그 외의 경우 해당 카테고리의 옵션 불러오기
    }
  }, [selectedCategory]); // selectedCategory가 변경될 때마다 실행

  // Supabase에서 해당 카테고리의 옵션을 불러오는 비동기 함수
  const fetchOptions = async () => {
    const { data, error } = await supabase
      .from("random_options") // 'random_options' 테이블에서
      .select("*") // 모든 컬럼 선택
      .eq("category", selectedCategory); // 현재 선택된 카테고리와 일치하는 항목 필터링

    if (!error) {
      setOptions(data); // 에러가 없으면 옵션 상태 업데이트
    } else {
      console.error("불러오기 실패", error); // 에러 발생 시 콘솔에 출력
    }
  };

  // 새로운 선택지를 추가하는 비동기 함수
  const addOption = async () => {
    const trimmed = newOption.trim(); // 입력된 텍스트의 앞뒤 공백 제거
    if (!trimmed) return; // 공백만 있으면 함수 종료
    const finalText = addEmojiIfMatch(trimmed); // 텍스트에 이모지 추가 (유틸리티 함수 사용)

    if (selectedCategory === "custom") {
      // 커스텀 카테고리일 경우 로컬 상태에만 추가 (데이터베이스 저장X)
      setOptions((prev) => [...prev, { text: finalText }]);
      setNewOption(""); // 입력 필드 초기화
      return;
    }

    // 데이터베이스에 새로운 선택지 삽입
    const { error } = await supabase
      .from("random_options")
      .insert({ text: finalText, category: selectedCategory });

    if (!error) {
      setNewOption(""); // 입력 필드 초기화
      fetchOptions(); // 옵션 목록 다시 불러오기
    }
  };

  // 선택지를 삭제하는 비동기 함수
  const deleteOption = async (idOrIndex) => {
    if (selectedCategory === "custom") {
      // 커스텀 카테고리일 경우 인덱스를 사용하여 로컬 상태에서 제거
      setOptions((prev) => prev.filter((_, i) => i !== idOrIndex));
      return;
    }

    // 데이터베이스에서 해당 ID의 선택지 삭제
    const { error } = await supabase
      .from("random_options")
      .delete()
      .eq("id", idOrIndex); // 해당 ID와 일치하는 항목 삭제

    if (!error) {
      fetchOptions(); // 옵션 목록 다시 불러오기
    }
  };

  // 룰렛을 돌리는 함수
  const roll = (count = 1) => {
    if (options.length === 0) return alert("목록이 없습니다!"); // 옵션이 없으면 경고
    if (count > options.length) return alert("선택 수가 항목보다 많습니다"); // 선택 개수가 옵션 수보다 많으면 경고

    setIsRolling(true); // 룰렛 돌아가는 중 상태 설정
    setFinalResults([]); // 최종 결과 초기화

    let i = 0; // 현재 인덱스
    let total = 0; // 총 반복 횟수
    const maxCount = 30 + Math.floor(Math.random() * 10); // 룰렛이 돌아갈 총 횟수 (30~39회)
    // 룰렛 인터벌 설정
    const interval = setInterval(() => {
      const current = options[i % options.length]; // 현재 표시될 옵션 (순환)
      setRollingText(current.text); // 룰렛 텍스트 업데이트
      i++; // 인덱스 증가
      total++; // 총 반복 횟수 증가

      if (total > maxCount) {
        // 총 반복 횟수를 초과하면 룰렛 중지
        clearInterval(interval); // 인터벌 중지

        const shuffled = [...options].sort(() => 0.5 - Math.random()); // 옵션을 무작위로 섞음
        const selected = shuffled.slice(0, count).map((o) => o.text); // 섞인 옵션에서 원하는 개수만큼 선택
        setFinalResults(selected); // 최종 결과 상태 업데이트
      }
    }, 70 - Math.floor(total / 5)); // 처음에는 빠르게, 점점 느리게 돌아가도록 인터벌 시간 조절
  };

  // 컴포넌트 렌더링
  return (
    <div className="random-page"> {/* 전체 페이지 컨테이너 */}
      <h2 className="random-title">✨ 랜덤 선택기</h2> {/* 페이지 제목 */}

      <div className="random-category-bar"> {/* 카테고리 버튼 바 */}
        {CATEGORIES.map((cat) => ( // CATEGORIES 배열을 매핑하여 버튼 생성
          <button
            key={cat.key} // 각 버튼의 고유 키
            className={`category-btn ${selectedCategory === cat.key ? "active" : ""}`} // 활성화된 카테고리에 'active' 클래스 추가
            onClick={() => setSelectedCategory(cat.key)} // 클릭 시 카테고리 변경
          >
            {cat.label} {/* 카테고리 라벨 */}
          </button>
        ))}
      </div>

      <div className="random-controls"> {/* 제어 버튼 및 입력 필드 그룹 */}
        <button className="roll-btn" onClick={() => roll(1)}>🎲 1개 뽑기</button> {/* 1개 뽑기 버튼 */}
        <button
          className="roll-btn secondary" // 보조 버튼 스타일
          onClick={() => setShowMultiInput(!showMultiInput)} // 클릭 시 여러 개 뽑기 입력 필드 토글
        >
          🔢 설정 뽑기
        </button>

        {showMultiInput && ( // showMultiInput이 true일 때만 표시
          <div className="multi-input"> {/* 여러 개 뽑기 입력 필드 */}
            <input
              type="number" // 숫자 입력 타입
              min="1" // 최소값 1
              max={options.length} // 최대값은 현재 옵션의 개수
              value={multiCount} // 입력 값
              onChange={(e) => setMultiCount(Number(e.target.value))} // 입력 값 변경 핸들러
              placeholder="몇 개 뽑을까요?" // 플레이스홀더 텍스트
            />
            <button onClick={() => roll(multiCount)}>🎉 뽑기</button> {/* 설정된 개수만큼 뽑기 버튼 */}
          </div>
        )}

        <div className="add-option"> {/* 항목 추가 섹션 */}
          <input
            placeholder="새 항목 입력" // 플레이스홀더 텍스트
            value={newOption} // 입력 값
            onChange={(e) => setNewOption(e.target.value)} // 입력 값 변경 핸들러
          />
          <button onClick={addOption}>＋ 추가</button> {/* 추가 버튼 */}
        </div>
      </div>

      <ul className="option-list"> {/* 선택지 목록 */}
        {options.map((opt, idx) => ( // 옵션 배열을 매핑하여 목록 아이템 생성
          <li key={selectedCategory === "custom" ? idx : opt.id} className="fade-in-up"> {/* 커스텀 카테고리일 경우 인덱스, 아니면 ID를 키로 사용 */}
            <span>{opt.text}</span> {/* 선택지 텍스트 */}
            <button onClick={() => deleteOption(selectedCategory === "custom" ? idx : opt.id)}>
              ❌ {/* 삭제 버튼 */}
            </button>
          </li>
        ))}
      </ul>

      {isRolling && ( // isRolling이 true일 때만 룰렛 모달 표시
        <div className="rolling-modal"> {/* 룰렛 모달 컨테이너 */}
          <div className="rolling-backdrop" onClick={() => setIsRolling(false)} /> {/* 배경 클릭 시 모달 닫기 */}
          <div className="rolling-content bounce-in"> {/* 룰렛 내용 (애니메이션 적용) */}
            {!finalResults.length ? ( // 최종 결과가 없으면 룰렛 돌아가는 중 표시
              <>
                <h3 className="rolling-title">✨ 선택 중...</h3> {/* 룰렛 제목 */}
                <div className="rolling-wheel">{rollingText}</div> {/* 룰렛 텍스트 */}
              </>
            ) : ( // 최종 결과가 있으면 결과 표시
              <>
                <h3 className="rolling-title">🎉 선택 완료!</h3> {/* 완료 제목 */}
                <div className="rolling-result"> {/* 최종 결과 목록 */}
                  {finalResults.map((res, i) => ( // 결과 배열 매핑
                    <div key={i}>{res}</div> // 각 결과 아이템
                  ))}
                </div>
                <button className="close-btn" onClick={() => setIsRolling(false)}>확인</button> {/* 확인 버튼 */}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RandomSelectorPage; // RandomSelectorPage 컴포넌트 내보내기
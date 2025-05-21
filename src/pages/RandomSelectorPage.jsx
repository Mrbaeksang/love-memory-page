import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { addEmojiIfMatch } from "../utils/emojiMap";
import "./RandomSelectorPage.css";

const CATEGORIES = [
  { key: "date", label: "🧡 데이트" },
  { key: "food", label: "🍽 음식" },
  { key: "activity", label: "🎮 활동" },
  { key: "custom", label: "🪄 커스텀" },
];

const RandomSelectorPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("date");
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState("");
  const [isRolling, setIsRolling] = useState(false);
  const [rollingText, setRollingText] = useState("");
  const [finalResults, setFinalResults] = useState([]);
  const [multiCount, setMultiCount] = useState(1);
  const [showMultiInput, setShowMultiInput] = useState(false);

  useEffect(() => {
    if (selectedCategory === "custom") {
      setOptions([]);
    } else {
      fetchOptions();
    }
  }, [selectedCategory]);

  const fetchOptions = async () => {
    const { data, error } = await supabase
      .from("random_options")
      .select("*")
      .eq("category", selectedCategory);
    if (!error) setOptions(data);
    else console.error("불러오기 실패", error);
  };

  const addOption = async () => {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    const finalText = addEmojiIfMatch(trimmed);

    if (selectedCategory === "custom") {
      setOptions((prev) => [...prev, { text: finalText }]);
      setNewOption("");
      return;
    }

    const { error } = await supabase
      .from("random_options")
      .insert({ text: finalText, category: selectedCategory });

    if (!error) {
      setNewOption("");
      fetchOptions();
    }
  };

  const deleteOption = async (idOrIndex) => {
    if (selectedCategory === "custom") {
      setOptions((prev) => prev.filter((_, i) => i !== idOrIndex));
      return;
    }

    const { error } = await supabase
      .from("random_options")
      .delete()
      .eq("id", idOrIndex);

    if (!error) fetchOptions();
  };

  const roll = (count = 1) => {
    if (options.length === 0) return alert("목록이 없습니다!");
    if (count > options.length) return alert("선택 수가 항목보다 많습니다");

    setIsRolling(true);
    setFinalResults([]);

    let i = 0;
    let total = 0;
    const maxCount = 30 + Math.floor(Math.random() * 10);
    const interval = setInterval(() => {
      const current = options[i % options.length];
      setRollingText(current.text);
      i++;
      total++;
      if (total > maxCount) {
        clearInterval(interval);

        const shuffled = [...options].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count).map((o) => o.text);
        setFinalResults(selected);
      }
    }, 70 - Math.floor(total / 5));
  };

  return (
    <div className="random-page">
      <h2 className="random-title">✨ 랜덤 선택기</h2>

      <div className="random-category-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`category-btn ${selectedCategory === cat.key ? "active" : ""}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="random-controls">
        <button className="roll-btn" onClick={() => roll(1)}>🎲 1개 뽑기</button>
        <button
          className="roll-btn secondary"
          onClick={() => setShowMultiInput(!showMultiInput)}
        >
          🔢 설정 뽑기
        </button>

        {showMultiInput && (
          <div className="multi-input">
            <input
              type="number"
              min="1"
              max={options.length}
              value={multiCount}
              onChange={(e) => setMultiCount(Number(e.target.value))}
              placeholder="몇 개 뽑을까요?"
            />
            <button onClick={() => roll(multiCount)}>🎉 뽑기</button>
          </div>
        )}

        <div className="add-option">
          <input
            placeholder="새 항목 입력"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
          />
          <button onClick={addOption}>＋ 추가</button>
        </div>
      </div>

      <ul className="option-list">
        {options.map((opt, idx) => (
          <li key={selectedCategory === "custom" ? idx : opt.id} className="fade-in-up">
            <span>{opt.text}</span>
            <button onClick={() => deleteOption(selectedCategory === "custom" ? idx : opt.id)}>
              ❌
            </button>
          </li>
        ))}
      </ul>

      {isRolling && (
        <div className="rolling-modal">
          <div className="rolling-backdrop" onClick={() => setIsRolling(false)} />
          <div className="rolling-content bounce-in">
            {!finalResults.length ? (
              <>
                <h3 className="rolling-title">✨ 선택 중...</h3>
                <div className="rolling-wheel">{rollingText}</div>
              </>
            ) : (
              <>
                <h3 className="rolling-title">🎉 선택 완료!</h3>
                <div className="rolling-result">
                  {finalResults.map((res, i) => (
                    <div key={i}>{res}</div>
                  ))}
                </div>
                <button className="close-btn" onClick={() => setIsRolling(false)}>확인</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RandomSelectorPage;

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
  const [finalResult, setFinalResult] = useState(null);

  useEffect(() => {
    if (selectedCategory === "custom") {
      setOptions([]); // 커스텀은 항상 초기화
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

  const roll = () => {
    if (options.length === 0) return alert("목록이 없습니다!");

    setIsRolling(true);
    setFinalResult(null);

    let i = 0;
    let count = 0;
    const maxCount = 30 + Math.floor(Math.random() * 10);

    const interval = setInterval(() => {
      const current = options[i % options.length];
      setRollingText(current.text);
      i++;
      count++;

      if (count > maxCount) {
        clearInterval(interval);
        setFinalResult(current.text);
      }
    }, 70 - Math.floor(count / 5));
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
        <button className="roll-btn" onClick={roll}>🎲 돌리기</button>
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
            {!finalResult ? (
              <>
                <h3 className="rolling-title">✨ 선택 중...</h3>
                <div className="rolling-wheel">{rollingText}</div>
              </>
            ) : (
              <>
                <h3 className="rolling-title">🎉 선택 완료!</h3>
                <div className="rolling-result">{finalResult}</div>
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

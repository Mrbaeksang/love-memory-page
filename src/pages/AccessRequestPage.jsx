// 📁 pages/AccessRequestPage.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getAnonId } from "../utils/getAnonId";

import "./AccessRequestPage.css"; // 스타일 분리

const AccessRequestPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    relation: "",
    purpose: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const userId = getAnonId();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from("access_requests").insert([
      {
        user_id: userId,
        name: formData.name,
        relation: formData.relation,
        purpose: formData.purpose,
      },
    ]);

    if (!error) {
      setSubmitted(true);
    } else {
      alert("제출 중 오류가 발생했어요.");
      console.error(error);
    }
  };

  return (
    <div className="request-page">
      <h2 className="request-title">상현 페이지 접근 요청 양식</h2>
      {submitted ? (
        <div className="request-complete">
          <p>요청이 성공적으로 제출되었어요!</p>
          <p>관리자가 확인 후 허용해줄 거예요 💌</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="request-form">
          <label>
            이름
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="이름을 입력해주세요"
            />
          </label>
          <label>
            나와의 관계
            <input
              type="text"
              name="relation"
              value={formData.relation}
              onChange={handleChange}
              required
              placeholder="예: 지인, 동창, 가족 등"
            />
          </label>
          <label>
            방문 목적
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              rows={3}
              placeholder="예: 갤러리 사진 보기"
              required
            />
          </label>
          <button type="submit" className="request-btn">
            접근 요청하기 💌
          </button>
        </form>
      )}
    </div>
  );
};

export default AccessRequestPage;

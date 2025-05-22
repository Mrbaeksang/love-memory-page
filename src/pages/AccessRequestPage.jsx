// 📁 pages/AccessRequestPage.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient"; // Supabase 클라이언트 인스턴스를 가져옵니다.
import { getAnonId } from "../utils/getAnonId"; // 익명 사용자 ID를 가져오는 유틸리티 함수를 가져옵니다.

import "./AccessRequestPage.css"; // 이 컴포넌트의 스타일을 정의하는 CSS 파일을 가져옵니다.

const AccessRequestPage = () => {
  // 상태 훅: 폼 데이터를 저장합니다. 이름, 관계, 목적 필드를 포함합니다.
  const [formData, setFormData] = useState({
    name: "",
    relation: "",
    purpose: "",
  });
  // 상태 훅: 폼 제출 성공 여부를 저장합니다. 초기값은 false입니다.
  const [submitted, setSubmitted] = useState(false);
  // 익명 사용자 ID를 가져와 userId 변수에 저장합니다.
  const userId = getAnonId();

  /**
   * 폼 입력 필드의 값이 변경될 때 호출되는 핸들러 함수입니다.
   * @param {Object} e 이벤트 객체
   */
  const handleChange = (e) => {
    // 이전 폼 데이터를 복사하고, 변경된 필드의 이름(name)에 해당하는 값(value)을 업데이트합니다.
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * 폼 제출 시 호출되는 비동기 핸들러 함수입니다.
   * @param {Object} e 이벤트 객체
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // 폼의 기본 제출 동작(페이지 새로고침)을 막습니다.

    // 'access_requests' 테이블에 새로운 접근 요청을 삽입합니다.
    const { error } = await supabase.from("access_requests").insert([
      {
        user_id: userId, // 익명 사용자 ID
        name: formData.name, // 폼에서 입력된 이름
        relation: formData.relation, // 폼에서 입력된 관계
        purpose: formData.purpose, // 폼에서 입력된 방문 목적
      },
    ]);

    // 에러가 없으면 제출 성공 상태로 업데이트합니다.
    if (!error) {
      setSubmitted(true);
    } else {
      // 에러가 발생하면 사용자에게 알리고 콘솔에 에러를 출력합니다.
      alert("제출 중 오류가 발생했어요.");
      console.error(error);
    }
  };

  return (
    // 접근 요청 페이지의 최상위 컨테이너입니다. CSS 클래스를 사용하여 스타일을 적용합니다.
    <div className="request-page">
      {/* 페이지 제목입니다. */}
      <h2 className="request-title">상현 페이지 접근 요청 양식</h2>
      {/* 폼이 제출된 상태인지 아닌지에 따라 다른 UI를 렌더링합니다. */}
      {submitted ? (
        // 폼이 성공적으로 제출되었을 때 표시되는 메시지입니다.
        <div className="request-complete">
          <p>요청이 성공적으로 제출되었어요!</p>
          <p>관리자가 확인 후 허용해줄 거예요 💌</p>
        </div>
      ) : (
        // 폼이 제출되지 않은 상태일 때 표시되는 접근 요청 폼입니다.
        <form onSubmit={handleSubmit} className="request-form">
          {/* 이름 입력 필드 */}
          <label>
            이름
            <input
              type="text"
              name="name" // 필드 이름
              value={formData.name} // 상태와 연결된 값
              onChange={handleChange} // 값 변경 핸들러
              required // 필수 입력 필드
              placeholder="이름을 입력해주세요" // 플레이스홀더 텍스트
            />
          </label>
          {/* 관계 입력 필드 */}
          <label>
            나와의 관계
            <input
              type="text"
              name="relation" // 필드 이름
              value={formData.relation} // 상태와 연결된 값
              onChange={handleChange} // 값 변경 핸들러
              required // 필수 입력 필드
              placeholder="예: 지인, 동창, 가족 등" // 플레이스홀더 텍스트
            />
          </label>
          {/* 방문 목적 텍스트 영역 */}
          <label>
            방문 목적
            <textarea
              name="purpose" // 필드 이름
              value={formData.purpose} // 상태와 연결된 값
              onChange={handleChange} // 값 변경 핸들러
              rows={3} // 텍스트 영역의 초기 행 수
              placeholder="예: 갤러리 사진 보기" // 플레이스홀더 텍스트
              required // 필수 입력 필드
            />
          </label>
          {/* 폼 제출 버튼 */}
          <button type="submit" className="request-btn">
            접근 요청하기 💌
          </button>
        </form>
      )}
    </div>
  );
};

export default AccessRequestPage;
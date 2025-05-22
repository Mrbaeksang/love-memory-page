import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./AdminAccessPage.css"; // AdminAccessPage 컴포넌트의 스타일을 정의하는 CSS 파일입니다.

const AdminAccessPage = () => {
  // 상태 훅: 접근 요청 목록을 저장합니다. 초기값은 빈 배열입니다.
  const [requests, setRequests] = useState([]);

  /**
   * Supabase에서 접근 요청 목록을 비동기적으로 가져오는 함수입니다.
   */
  const fetchRequests = async () => {
    // 'access_requests' 테이블에서 모든 데이터를 선택하고, 'created_at' 필드를 기준으로 최신순으로 정렬합니다.
    const { data, error } = await supabase
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });

    // 에러가 없으면 요청 목록 상태를 업데이트합니다. 데이터가 없으면 빈 배열로 설정합니다.
    if (!error) setRequests(data || []);
    // 에러가 발생하면 콘솔에 에러 메시지를 출력합니다.
    else console.error("불러오기 오류:", error);
  };

  /**
   * 특정 접근 요청을 승인하고 'allowed_users' 테이블에 추가하는 비동기 함수입니다.
   * 승인 후에는 'access_requests' 테이블에서 해당 요청을 삭제합니다.
   * @param {string} user_id 승인할 사용자의 고유 ID입니다.
   * @param {string} label 'allowed_users' 테이블에 저장될 사용자의 레이블(예: '이름의 기기')입니다.
   * @param {number} id 'access_requests' 테이블에서 삭제할 요청의 ID입니다.
   */
  const approveRequest = async (user_id, label, id) => {
    // 1. 'allowed_users' 테이블에 사용자를 추가합니다.
    const { error: insertError } = await supabase
      .from("allowed_users")
      .insert([{ user_id, label }]); // user_id와 label을 가진 새 레코드를 삽입합니다.

    // 삽입 중 에러가 발생하면 사용자에게 알리고 콘솔에 에러를 출력한 뒤 함수를 종료합니다.
    if (insertError) {
      alert("❌ 등록 실패");
      console.error(insertError);
      return;
    }

    // 2. 'access_requests' 테이블에서 해당 요청을 삭제합니다.
    const { error: deleteError } = await supabase
      .from("access_requests")
      .delete()
      .eq("id", id); // 요청 ID가 일치하는 레코드를 삭제합니다.

    // 삭제 중 에러가 발생하면 사용자에게 경고 메시지를 표시하고 콘솔에 에러를 출력합니다.
    if (deleteError) {
      alert("⚠️ 허용했지만 요청 삭제 실패");
      console.error(deleteError);
    }

    // 모든 작업이 성공적으로 완료되면 사용자에게 알립니다.
    alert("✅ 허용되었습니다");
    fetchRequests(); // 변경된 요청 목록을 다시 불러와 UI를 갱신합니다.
  };

  /**
   * 특정 접근 요청을 거절하고 'access_requests' 테이블에서 삭제하는 비동기 함수입니다.
   * @param {number} id 'access_requests' 테이블에서 삭제할 요청의 ID입니다.
   */
  const rejectRequest = async (id) => {
    // 'access_requests' 테이블에서 요청 ID가 일치하는 레코드를 삭제합니다.
    const { error } = await supabase
      .from("access_requests")
      .delete()
      .eq("id", id);

    // 에러가 없으면 사용자에게 알리고 요청 목록을 갱신합니다.
    if (!error) {
      alert("❌ 요청 거절됨");
      fetchRequests(); // 변경된 요청 목록을 다시 불러와 UI를 갱신합니다.
    } else {
      // 에러가 발생하면 콘솔에 에러 메시지를 출력합니다.
      console.error("삭제 실패:", error);
    }
  };

  // useEffect 훅: 컴포넌트가 마운트될 때 (첫 렌더링 시) 접근 요청 목록을 한 번 불러옵니다.
  useEffect(() => {
    fetchRequests();
  }, []); // 빈 의존성 배열은 이 효과가 컴포넌트 마운트 시 한 번만 실행되도록 합니다.

  return (
    // 관리자 접근 페이지의 최상위 컨테이너입니다. CSS 클래스를 사용하여 스타일을 적용합니다.
    <div className="admin-access-page">
      {/* 페이지 제목입니다. */}
      <h2 className="admin-title">접근 요청 승인</h2>
      {/* 요청 목록이 비어있을 경우 메시지를 표시합니다. */}
      {requests.length === 0 ? (
        <p className="admin-empty">요청이 아직 없습니다.</p>
      ) : (
        // 요청 목록이 있을 경우, 각 요청을 리스트 아이템으로 렌더링합니다.
        <ul className="admin-list">
          {requests.map((req) => (
            // 각 요청에 대한 카드 형태의 UI입니다.
            <li key={req.id} className="admin-card">
              <div><strong>이름:</strong> {req.name}</div>
              <div><strong>관계:</strong> {req.relation}</div>
              <div><strong>목적:</strong> {req.purpose}</div>
              <div><strong>user_id:</strong> {req.user_id}</div>
              {/* 요청 시간은 한국 시간 형식으로 변환하여 표시합니다. */}
              <div><strong>요청시간:</strong> {new Date(req.created_at).toLocaleString("ko-KR")}</div>
              <div className="admin-btn-group">
                {/* 승인 버튼: 클릭 시 approveRequest 함수를 호출하여 요청을 승인합니다. */}
                <button
                  className="admin-approve-btn"
                  onClick={() =>
                    approveRequest(req.user_id, `${req.name}의 기기`, req.id)
                  }
                >
                  ✅ 허용
                </button>
                {/* 거절 버튼: 클릭 시 rejectRequest 함수를 호출하여 요청을 거절합니다. */}
                <button
                  className="admin-reject-btn"
                  onClick={() => rejectRequest(req.id)}
                >
                  ❌ 거절
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminAccessPage;
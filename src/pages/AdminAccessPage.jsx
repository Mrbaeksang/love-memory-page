import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./AdminAccessPage.css";

const AdminAccessPage = () => {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setRequests(data || []);
    else console.error("불러오기 오류:", error);
  };

  const approveRequest = async (user_id, label, id) => {
    const { error: insertError } = await supabase
      .from("allowed_users")
      .insert([{ user_id, label }]);

    if (insertError) {
      alert("❌ 등록 실패");
      console.error(insertError);
      return;
    }

    const { error: deleteError } = await supabase
      .from("access_requests")
      .delete()
      .eq("id", id);

    if (deleteError) {
      alert("⚠️ 허용했지만 요청 삭제 실패");
      console.error(deleteError);
    }

    alert("✅ 허용되었습니다");
    fetchRequests(); // 갱신
  };

  const rejectRequest = async (id) => {
    const { error } = await supabase
      .from("access_requests")
      .delete()
      .eq("id", id);

    if (!error) {
      alert("❌ 요청 거절됨");
      fetchRequests(); // 갱신
    } else {
      console.error("삭제 실패:", error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="admin-access-page">
      <h2 className="admin-title">접근 요청 승인</h2>
      {requests.length === 0 ? (
        <p className="admin-empty">요청이 아직 없습니다.</p>
      ) : (
        <ul className="admin-list">
          {requests.map((req) => (
            <li key={req.id} className="admin-card">
              <div><strong>이름:</strong> {req.name}</div>
              <div><strong>관계:</strong> {req.relation}</div>
              <div><strong>목적:</strong> {req.purpose}</div>
              <div><strong>user_id:</strong> {req.user_id}</div>
              <div><strong>요청시간:</strong> {new Date(req.created_at).toLocaleString("ko-KR")}</div>
              <div className="admin-btn-group">
                <button
                  className="admin-approve-btn"
                  onClick={() =>
                    approveRequest(req.user_id, `${req.name}의 기기`, req.id)
                  }
                >
                  ✅ 허용
                </button>
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

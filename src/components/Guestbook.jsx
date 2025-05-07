import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { sendPushToAll } from '../utils/sendPushToAll';

const Guestbook = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [author, setAuthor] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const myToken = localStorage.getItem("fcm_token");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('guestbook')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const validatePassword = (pwd) => {
    if (!/^[0-9]{4}$/.test(pwd)) {
      setError('비밀번호는 4자리 숫자여야 합니다');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!author.trim() || !password.trim() || !newMessage.trim()) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
  
    if (!validatePassword(password)) return;
  
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('guestbook')
        .insert([
          {
            author,
            message: newMessage,
            password,
            created_at: new Date().toISOString()
          }
        ]);
  
      if (error) throw error;
  
      // ✅ 작성자 본인의 FCM 토큰 가져오기
      const myToken = localStorage.getItem("fcm_token");
  
      // ✅ 푸시 알림 (작성자 제외)
      await sendPushToAll({
        title: "방명록에 사랑의 흔적이 남았어요 💌",
        body: `"${author}"님의 메시지가 도착했어요!`,
        click_action: "https://love-memory-page.vercel.app/#guestbook",
        excludeToken: myToken,
      });
  
      // ✅ 입력값 초기화 + 메시지 목록 새로고침
      setNewMessage('');
      setAuthor('');
      setPassword('');
      setError('');
      await fetchMessages();
    } catch (error) {
      setError('메시지 작성 중 오류가 발생했습니다.');
      console.error('Error submitting message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const handleDelete = async () => {
    if (!deleteId || !deletePassword) return;
    if (!validatePassword(deletePassword)) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('guestbook')
        .delete()
        .eq('id', deleteId)
        .eq('password', deletePassword);

      if (error) throw error;

      setDeletePassword('');
      setDeleteId(null);
      setIsDeleteModalOpen(false);
      await fetchMessages();
    } catch (error) {
      setError('비밀번호가 틀렸습니다.');
      console.error('Error deleting message:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="guestbook-container">
      <h2 className="section-title">방명록</h2>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="작성자 이름"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="비밀번호 (4자리 숫자)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
              }}
              className="form-input"
              required
            />
            {error && <p className="error-message">{error}</p>}
          </div>
          <div className="form-group">
            <textarea
              placeholder="메시지를 남겨주세요..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="form-textarea"
              rows="4"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="submit-btn"
          >
            {isSubmitting ? '작성 중...' : '기록하기'}
          </button>
        </form>
      </div>
      <div className="messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className="message-card">
            <div className="message-header">
              <div className="author-container">
                <span className="author">{msg.author}</span>
                <small className="timestamp">{new Date(msg.created_at).toLocaleString()}</small>
              </div>
              <button 
                onClick={() => {
                  setDeleteId(msg.id);
                  setIsDeleteModalOpen(true);
                }}
                className="delete-btn"
              >
                삭제
              </button>
            </div>
            <p className="message-text">{msg.message}</p>
          </div>
        ))}
      </div>
      {isDeleteModalOpen && (
        <div className="delete-modal">
          <div className="delete-modal-content">
            <h3>메시지 삭제</h3>
            <p>비밀번호를 입력해주세요:</p>
            <div className="form-group">
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                className="modal-input"
                required
              />
            </div>
            <div className="modal-buttons">
              <button 
                onClick={() => {
                  setDeletePassword('');
                  setDeleteId(null);
                  setIsDeleteModalOpen(false);
                }}
                className="modal-cancel-btn"
              >
                취소
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="modal-delete-btn"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Guestbook;

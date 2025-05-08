// src/utils/getAnonId.js
export function getAnonId() {
  const key = "local_user_id";
  const stored = localStorage.getItem(key);
  if (stored) return stored;

  const newId = "user_" + Math.random().toString(36).substring(2, 12);
  localStorage.setItem(key, newId);
  return newId;
}

// src/hooks/usePageLogger.js
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getAnonId } from "../utils/getAnonId";

const usePageLogger = () => {
  const location = useLocation();

  useEffect(() => {
    const page = location.pathname;
    const referer = document.referrer || "";
    const anon_user_id = getAnonId();

    fetch("/api/log-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, referer, anon_user_id }),
    });
  }, [location.pathname]);
};

export default usePageLogger;

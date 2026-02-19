import React, { useEffect, useState } from 'react';
import SignUpProcess from './SignUpProcess';
import { authFetch, verifyToken } from './api/fetchers';

function App() {
  // 로그인 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 회원가입 또는 로그인 성공 시 호출될 함수
  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
  };

  const clearAuthStorage = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentUser");
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const hasAnyToken =
        Boolean(localStorage.getItem("accessToken")) ||
        Boolean(localStorage.getItem("refreshToken"));

      if (!hasAnyToken) {
        setIsLoggedIn(false);
        return;
      }

      try {
        const data = await verifyToken();
        if (data?.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        }
        setIsLoggedIn(true);
      } catch (error) {
        clearAuthStorage();
        setIsLoggedIn(false);
      }
    };

    initializeAuth();
  }, []);

  // 로그아웃 처리
  const handleLogout = async () => {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;

    const refreshToken = localStorage.getItem("refreshToken");
    const apiBase = (process.env.REACT_APP_API_BASE_URL ?? "").replace(/\/$/, "");
    const logoutUrl = `${apiBase}/api/accounts/logout/`;

    if (!refreshToken) {
      clearAuthStorage();
      setIsLoggedIn(false);
      alert("로그아웃되었습니다.");
      return;
    }

    try {
      const response = await authFetch(logoutUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseError) {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.detail || "로그아웃 요청에 실패했습니다.");
      }

      if (data?.success === false) {
        throw new Error(data?.message || "로그아웃 요청에 실패했습니다.");
      }

      clearAuthStorage();
      setIsLoggedIn(false);
      alert(data?.message || "로그아웃되었습니다.");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      clearAuthStorage();
      setIsLoggedIn(false);
      alert(error.message || "서버 로그아웃에 실패했습니다. 기기에서는 로그아웃 처리했습니다.");
    }
  };

  return (
    <div className="App">
      {/* [에러 해결 포인트] 
        SignUpProcess 내부에서 onAuthSuccess()를 실행하므로, 
        반드시 props로 handleAuthSuccess 함수를 전달해야 합니다.
      */}
      <SignUpProcess 
        isLoggedIn={isLoggedIn} 
        onAuthSuccess={handleAuthSuccess} 
        onLogout={handleLogout} 
      />
    </div>
  );
}

export default App;

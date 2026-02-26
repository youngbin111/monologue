import React, { useState } from 'react';
import './SignInProcess.css';
import { plainFetch, requestPasswordReset } from "./api/fetchers";
import FindIdProcess from "./FindIdProcess";

const SignInProcess = ({ onLoginSuccess, onGoSignUp, onGoHome }) => {
  // view: 0(로그인), 1(아이디 찾기), 2(비밀번호 찾기)
  const [view, setView] = useState(0);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isPasswordResetSubmitting, setIsPasswordResetSubmitting] = useState(false);
  
  // 각 화면별 독립된 데이터 상태
  const [loginData, setLoginData] = useState({ id: '', pw: '' });
  const [findPwData, setFindPwData] = useState({ email: '' });

  const handleLogin = async () => {
    const username = loginData.id.trim();
    const password = loginData.pw;

    if (!username || !password) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    const apiBase = (process.env.REACT_APP_API_BASE_URL ?? "").replace(/\/$/, "");
    const loginUrl = `${apiBase}/api/accounts/login/`;

    try {
      setIsLoginSubmitting(true);
      const response = await plainFetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseError) {
        data = null;
      }

      if (!response.ok) {
        const message =
          data?.message ||
          data?.detail ||
          "로그인 요청에 실패했습니다.";
        throw new Error(message);
      }

      const accessToken = data?.tokens?.access;
      const refreshToken = data?.tokens?.refresh;

      if (!accessToken || !refreshToken) {
        throw new Error("토큰 응답 형식이 올바르지 않습니다.");
      }

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      if (data?.user) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
      }

      if (typeof onLoginSuccess === "function") {
        onLoginSuccess(data);
      }
    } catch (error) {
      console.error("로그인 실패:", error);
      alert(error.message || "로그인에 실패했습니다.");
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handlePasswordResetRequest = async () => {
    const email = findPwData.email.trim();
    if (!email) {
      alert("이메일을 입력해주세요.");
      return;
    }

    try {
      setIsPasswordResetSubmitting(true);
      const result = await requestPasswordReset({ email });
      alert(
        result.message ||
          "비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요."
      );
      setView(0);
    } catch (error) {
      alert(error.message || "비밀번호 재설정 요청에 실패했습니다.");
    } finally {
      setIsPasswordResetSubmitting(false);
    }
  };

  return (
    <div className="absolute-viewport">
      <div className="side-bg-green"></div>
      
      <div className="fixed-content-wrapper">
        <div className="left-fixed-section">
          <div className="logo-box" onClick={onGoHome} style={{cursor:'pointer'}}>
            <img src="/image-Photoroom.png" alt="독백 로고" className="logo-image" />
          </div>
        </div>

        <div className="right-fixed-section">
          <div className="auth-full-container">
            
            {/* 1. 로그인 화면 */}
            {view === 0 && (
              <>
                <h1 className="login-title-top">로그인</h1>
                <div className="login-form-area">
                  <div className="login-input-group">
                    <input 
                      type="text" 
                      placeholder="아이디" 
                      className="underline-input" 
                      value={loginData.id}
                      onChange={(e)=>setLoginData({...loginData, id: e.target.value})} 
                    />
                  </div>
                  <div className="login-input-group">
                    <input 
                      type="password" 
                      placeholder="비밀번호" 
                      className="underline-input" 
                      value={loginData.pw}
                      onChange={(e)=>setLoginData({...loginData, pw: e.target.value})} 
                    />
                  </div>
                  
                  <div className="login-helper-links">
                    <span onClick={() => setView(1)}>로그인 찾기</span>
                    <span className="dot">/</span>
                    <span onClick={() => setView(2)}>비밀번호 찾기</span>
                    <span className="dot">/</span>
                    <span onClick={onGoSignUp}>회원가입</span>
                  </div>
                  
                  <div className="login-submit-area">
                    <button className="login-main-btn" onClick={handleLogin} disabled={isLoginSubmitting}>
                      {isLoginSubmitting ? "로그인 중..." : "로그인"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* 2. 아이디 찾기 화면 */}
            {view === 1 && (
              <FindIdProcess onBack={() => setView(0)} />
            )}

            {/* 3. 비밀번호 찾기 화면 - 요청 이미지 반영 */}
            {view === 2 && (
              <>
                <h1 className="login-title-top">비밀번호 찾기</h1>
                <div className="login-form-area">
                  <div className="login-input-group">
                    <input 
                      type="email" 
                      placeholder="가입한 이메일" 
                      className="underline-input" 
                      value={findPwData.email}
                      onChange={(e)=>setFindPwData({...findPwData, email: e.target.value})} 
                    />
                  </div>
                  <div className="login-submit-area">
                    <button
                      className="login-main-btn"
                      onClick={handlePasswordResetRequest}
                      disabled={isPasswordResetSubmitting}
                    >
                      {isPasswordResetSubmitting ? "요청 중..." : "비밀번호 재설정 메일 보내기"}
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInProcess;

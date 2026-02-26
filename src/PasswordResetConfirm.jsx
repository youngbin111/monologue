import React, { useMemo, useState } from "react";
import { confirmPasswordReset } from "./api/fetchers";
import "./SignInProcess.css";

function extractResetParams(pathname) {
  const match = pathname.match(/^\/(?:password-reset-confirm|reset-password)\/([^/]+)\/([^/]+)\/?$/);
  if (!match) {
    return { uidb64: "", token: "" };
  }

  return {
    uidb64: decodeURIComponent(match[1]),
    token: decodeURIComponent(match[2]),
  };
}

const PasswordResetConfirm = () => {
  const { uidb64, token } = useMemo(
    () => extractResetParams(window.location.pathname),
    []
  );
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const hasInvalidLink = !uidb64 || !token;

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setSuccessMessage("");
      setErrorMessage("");
      const result = await confirmPasswordReset({
        uidb64,
        token,
        newPassword,
        newPassword2,
      });
      setSuccessMessage(result.message);
      setNewPassword("");
      setNewPassword2("");
    } catch (error) {
      setErrorMessage(error.message || "비밀번호 재설정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute-viewport">
      <div className="side-bg-green"></div>

      <div className="fixed-content-wrapper">
        <div className="left-fixed-section">
          <div className="logo-box" style={{ cursor: "pointer" }} onClick={() => (window.location.href = "/")}>
            <img src="/image-Photoroom.png" alt="독백 로고" className="logo-image" />
          </div>
        </div>

        <div className="right-fixed-section">
          <div className="auth-full-container">
            <h1 className="login-title-top">비밀번호 재설정</h1>
            <form className="login-form-area" onSubmit={onSubmit}>
              {hasInvalidLink ? (
                <div className="find-id-result error">유효하지 않거나 만료된 링크입니다</div>
              ) : (
                <>
                  <div className="login-input-group">
                    <input
                      type="password"
                      className="underline-input"
                      placeholder="새 비밀번호"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="login-input-group">
                    <input
                      type="password"
                      className="underline-input"
                      placeholder="새 비밀번호 확인"
                      value={newPassword2}
                      onChange={(e) => setNewPassword2(e.target.value)}
                    />
                  </div>
                </>
              )}

              {successMessage ? <div className="find-id-result success">{successMessage}</div> : null}
              {errorMessage ? <div className="find-id-result error">{errorMessage}</div> : null}

              <div className="login-submit-area">
                {!hasInvalidLink ? (
                  <button className="login-main-btn" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "처리 중..." : "비밀번호 재설정"}
                  </button>
                ) : null}
                <button
                  className="login-sub-btn"
                  type="button"
                  onClick={() => (window.location.href = "/")}
                >
                  로그인 화면으로
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetConfirm;

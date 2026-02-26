import React, { useState } from "react";
import { findAccountId } from "./api/fetchers";

const FindIdProcess = ({ onBack }) => {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundUsername, setFoundUsername] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
    setResultMessage("");
    setFoundUsername("");
  };

  const onFindId = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage("");
      const result = await findAccountId({
        name: form.name,
        phone: form.phone,
      });
      setFoundUsername(result.username || "");
      setResultMessage(result.message || "아이디를 찾았습니다");
    } catch (error) {
      setErrorMessage(error.message || "아이디 찾기에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="login-title-top">아이디 찾기</h1>
      <div className="login-form-area">
        <div className="login-input-group">
          <input
            type="text"
            name="name"
            placeholder="이름"
            className="underline-input"
            value={form.name}
            onChange={onChange}
          />
        </div>
        <div className="login-input-group">
          <input
            type="text"
            name="phone"
            placeholder="전화번호 (010-1234-5678)"
            className="underline-input"
            value={form.phone}
            onChange={onChange}
          />
        </div>

        {resultMessage ? (
          <div className="find-id-result success">
            <p>{resultMessage}</p>
            {foundUsername ? <strong>{foundUsername}</strong> : null}
          </div>
        ) : null}

        {errorMessage ? <div className="find-id-result error">{errorMessage}</div> : null}

        <div className="login-submit-area">
          <button className="login-main-btn" onClick={onFindId} disabled={isSubmitting}>
            {isSubmitting ? "확인 중..." : "아이디 찾기"}
          </button>
          <button type="button" className="login-sub-btn" onClick={onBack}>
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    </>
  );
};

export default FindIdProcess;

import React, { useState } from 'react';
import './MyPage.css';

const MyPage = ({ onGoHome }) => {
  const [readCount, setReadCount] = useState(0);
  const [nickname, setNickname] = useState('byte');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');

  const handleSave = () => {
    // TODO: 백엔드 API 연동 시 여기서 nickname/email/bio/readCount를 전송
    alert('저장되었습니다!');
  };

  return (
    <div className="mypage-container">
      {/* 상단 헤더 영역 */}
      <header className="mypage-header">
        <div className="header-left">
          <span className="breadcrumb">마이페이지</span>
        </div>
        <div className="header-right">
          <span className="header-hint">내 정보 관리 및 활동 내역</span>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="mypage-main">
        <section className="mypage-panel">
          <h1 className="mypage-title">마이페이지</h1>
          <p className="mypage-sub">나의 정보를 확인하고 수정할 수 있습니다.</p>

          <div className="mypage-content">
            {/* 왼쪽: 프로필 및 기본 정보 */}
            <div className="profile-section">
              <div className="profile-image-placeholder">
                <span className="user-icon">👤</span>
              </div>
              <button className="edit-img-btn">사진 변경</button>
            </div>

            {/* 오른쪽: 상세 정보 입력 폼 */}
            <div className="info-section">
              <div className="info-row">
                <label>닉네임</label>
                <input
                  type="text"
                  placeholder="닉네임을 입력하세요"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
              <div className="info-row">
                <label>이메일</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="info-row">
                <label>한줄 소개</label>
                <textarea
                  placeholder="나를 표현하는 한마디"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="reading-counter-card">
            <div className="reading-counter-label">여태 읽은 권수</div>
            <div className="reading-counter-controls">
              <button
                type="button"
                className="counter-btn"
                onClick={() => setReadCount((prev) => Math.max(0, prev - 1))}
                aria-label="읽은 권수 감소"
              >
                -
              </button>
              <div className="reading-counter-value">{readCount}권</div>
              <button
                type="button"
                className="counter-btn"
                onClick={() => setReadCount((prev) => prev + 1)}
                aria-label="읽은 권수 증가"
              >
                +
              </button>
            </div>
          </div>

          <div className="mypage-actions">
            <button type="button" className="save-btn" onClick={handleSave}>
              수정 사항 저장
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MyPage;

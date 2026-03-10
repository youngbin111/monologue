import React, { useEffect, useMemo, useState } from "react";
import { fetchMyProfile } from "./api/fetchers";
import "./MyPage.css";

const parseStoredCurrentUser = () => {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
};

const getDisplayNickname = (user, fallback = "-") => {
  const candidate =
    user?.nickname ||
    user?.profile?.nickname ||
    user?.username ||
    user?.name ||
    user?.profile?.name ||
    "";
  const trimmed = String(candidate).trim();
  return trimmed || fallback;
};

const getDisplayEmail = (user, fallback = "-") => {
  const candidate = user?.email || user?.profile?.email || user?.user?.email || "";
  const trimmed = String(candidate).trim();
  return trimmed || fallback;
};

const getReadCount = (user) => {
  const raw =
    user?.readCount ?? user?.read_count ?? user?.profile?.readCount ?? user?.profile?.read_count;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
};

const MyPage = () => {
  const initialUser = useMemo(() => parseStoredCurrentUser(), []);
  const shouldHydrateProfile =
    !getDisplayEmail(initialUser, "") || !getDisplayNickname(initialUser, "");
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(() => ({
    nickname: getDisplayNickname(initialUser, ""),
    email: getDisplayEmail(initialUser, ""),
    readCount: String(getReadCount(initialUser)),
  }));

  useEffect(() => {
    if (!shouldHydrateProfile) return;

    let isMounted = true;

    const syncProfile = async () => {
      try {
        const profile = await fetchMyProfile();
        if (!isMounted || !profile || typeof profile !== "object") return;

        setCurrentUser((prev) => {
          const merged = {
            ...(prev && typeof prev === "object" ? prev : {}),
            ...profile,
          };
          localStorage.setItem("currentUser", JSON.stringify(merged));
          return merged;
        });
      } catch (error) {
        // 로그인하지 않았거나 프로필 API가 없는 환경은 무시
      }
    };

    syncProfile();
    return () => {
      isMounted = false;
    };
  }, [shouldHydrateProfile]);

  useEffect(() => {
    if (isEditing) return;
    setFormData({
      nickname: getDisplayNickname(currentUser, ""),
      email: getDisplayEmail(currentUser, ""),
      readCount: String(getReadCount(currentUser)),
    });
  }, [currentUser, isEditing]);

  const displayNickname = getDisplayNickname(currentUser);
  const displayEmail = getDisplayEmail(currentUser);
  const displayReadCount = getReadCount(currentUser);

  const updateDraftReadCount = (nextValue) => {
    const normalized = Math.max(0, Math.floor(nextValue));
    setFormData((prev) => ({
      ...prev,
      readCount: String(normalized),
    }));
  };

  const handlePrimaryAction = () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    const nextNickname = formData.nickname.trim() || getDisplayNickname(currentUser, "");
    const nextEmail = formData.email.trim() || getDisplayEmail(currentUser, "");
    const parsedReadCount = Number.parseInt(formData.readCount, 10);
    const nextReadCount = Number.isFinite(parsedReadCount)
      ? Math.max(0, parsedReadCount)
      : 0;

    const updatedUser = {
      ...(currentUser && typeof currentUser === "object" ? currentUser : {}),
      nickname: nextNickname,
      email: nextEmail,
      readCount: nextReadCount,
    };

    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    setIsEditing(false);
    alert("저장되었습니다!");
  };

  const handleCancelEdit = () => {
    setFormData({
      nickname: getDisplayNickname(currentUser, ""),
      email: getDisplayEmail(currentUser, ""),
      readCount: String(getReadCount(currentUser)),
    });
    setIsEditing(false);
  };

  const draftReadCount = Number.parseInt(formData.readCount, 10);
  const safeDraftReadCount = Number.isFinite(draftReadCount) ? Math.max(0, draftReadCount) : 0;

  return (
    <div className="mypage-container">
      <header className="mypage-header">
        <div className="header-left">
          <span className="breadcrumb">마이페이지</span>
        </div>
        <div className="header-right">
          <span className="header-hint">내 정보 관리 및 활동 내역</span>
        </div>
      </header>

      <main className="mypage-main">
        <section className="mypage-panel">
          <h1 className="mypage-title">마이페이지</h1>
          <p className="mypage-sub">가입 정보를 확인할 수 있습니다.</p>

          <div className="mypage-content">
            <div className="profile-section">
              <div className="profile-image-placeholder">
                <span className="user-icon">👤</span>
              </div>
              <button className="edit-img-btn">사진 변경</button>
            </div>

            <div className="info-section">
              <div className="info-row">
                <label>닉네임</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="info-input"
                    value={formData.nickname}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, nickname: event.target.value }))
                    }
                  />
                ) : (
                  <div className="info-value">{displayNickname}</div>
                )}
              </div>
              <div className="info-row">
                <label>이메일</label>
                {isEditing ? (
                  <input
                    type="email"
                    className="info-input"
                    value={formData.email}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                ) : (
                  <div className="info-value">{displayEmail}</div>
                )}
              </div>
              <div className="info-row">
                <label>여태 읽은 권수</label>
                {isEditing ? (
                  <div className="read-count-editor">
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => updateDraftReadCount(safeDraftReadCount - 1)}
                      aria-label="읽은 권수 감소"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="read-count-input"
                      value={formData.readCount}
                      onChange={(event) => {
                        const raw = event.target.value;
                        if (raw === "") {
                          setFormData((prev) => ({ ...prev, readCount: "" }));
                          return;
                        }
                        if (!/^\d+$/.test(raw)) return;
                        setFormData((prev) => ({ ...prev, readCount: raw }));
                      }}
                    />
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => updateDraftReadCount(safeDraftReadCount + 1)}
                      aria-label="읽은 권수 증가"
                    >
                      +
                    </button>
                    <span className="read-count-unit">권</span>
                  </div>
                ) : (
                  <div className="info-value">{displayReadCount}권</div>
                )}
              </div>
            </div>
          </div>

          <div className="mypage-actions">
            <button type="button" className="save-btn" onClick={handlePrimaryAction}>
              {isEditing ? "저장" : "편집"}
            </button>
            {isEditing ? (
              <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                취소
              </button>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MyPage;

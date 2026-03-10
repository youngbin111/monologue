import React, { useEffect, useRef, useState } from 'react';
import './SignUpProcess.css';
import SignInProcess from './SignInProcess'; 
import OthersDokbaek from './OthersDokbaek';
import MyPage from './MyPage'; 
import MyDokbaek from './MyDokbaek';
import OtherReviews from './OtherReviews';
import BookRecommend from './BookRecommend';
import BookDetail from './BookDetail';
import GenreSelect from './GenreSelect';
import MyDokbaekList from './MyDokbaekList';
import MyPostDetail from "./MyPostDetail";
import { checkUsernameAvailability, fetchBooksByCategory, plainFetch } from "./api/fetchers";

const SELECTED_GENRES_STORAGE_KEY = "selectedGenres";

function getStoredSelectedGenres() {
  try {
    const raw = localStorage.getItem(SELECTED_GENRES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((genre) => String(genre ?? "").trim())
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

const SignUpProcess = ({ isLoggedIn, onAuthSuccess, onLogout }) => {
  const [viewMode, setViewMode] = useState(0); 
  const [isSignUpSubmitting, setIsSignUpSubmitting] = useState(false);
  const [homeCenterIndex, setHomeCenterIndex] = useState(0);
  const [homeBooks, setHomeBooks] = useState([]);
  const [isHomeBooksLoading, setIsHomeBooksLoading] = useState(false);
  const [homeBooksError, setHomeBooksError] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedMyPostId, setSelectedMyPostId] = useState("");
  const [selectedOtherPostId, setSelectedOtherPostId] = useState("");
  const [editingMyPost, setEditingMyPost] = useState(null);
  const [latestMyPost, setLatestMyPost] = useState(null);
  const skipNextHistoryPushRef = useRef(false);
  
  const [formData, setFormData] = useState({ 
    name: '', phone: '', nickname: '', id: '', pw: '', confirmPw: '', email: '' 
  });
  const [selectedGenres, setSelectedGenres] = useState(() => getStoredSelectedGenres());
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [isIdChecking, setIsIdChecking] = useState(false);

  useEffect(() => {
    try {
      if (selectedGenres.length === 0) {
        localStorage.removeItem(SELECTED_GENRES_STORAGE_KEY);
        return;
      }
      localStorage.setItem(
        SELECTED_GENRES_STORAGE_KEY,
        JSON.stringify(selectedGenres)
      );
    } catch (error) {
      // localStorage 저장 실패는 기능 진행에 영향 없도록 무시
    }
  }, [selectedGenres]);

  useEffect(() => {
    const parseViewModeFromHash = () => {
      const match = window.location.hash.match(/view=(\d+)/);
      if (!match) return null;
      const parsed = Number(match[1]);
      return Number.isInteger(parsed) ? parsed : null;
    };

    const initialViewMode =
      typeof window.history.state?.viewMode === "number"
        ? window.history.state.viewMode
        : parseViewModeFromHash() ?? 0;
    if (initialViewMode !== viewMode) {
      setViewMode(initialViewMode);
    }

    const baseUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(
      { ...(window.history.state ?? {}), viewMode: initialViewMode },
      "",
      `${baseUrl}#view=${initialViewMode}`
    );

    const onPopState = (event) => {
      const nextViewMode =
        typeof event.state?.viewMode === "number"
          ? event.state.viewMode
          : parseViewModeFromHash();
      if (typeof nextViewMode === "number") {
        skipNextHistoryPushRef.current = true;
        setViewMode(nextViewMode);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipNextHistoryPushRef.current) {
      skipNextHistoryPushRef.current = false;
      return;
    }

    const currentViewMode = window.history.state?.viewMode;
    if (currentViewMode === viewMode) {
      return;
    }

    const baseUrl = `${window.location.pathname}${window.location.search}`;
    window.history.pushState(
      { ...(window.history.state ?? {}), viewMode },
      "",
      `${baseUrl}#view=${viewMode}`
    );
  }, [viewMode]);

  const allGenres = [
    "공학", "자연과학", "소설", "유아/어린이/청소년", "의학", "인문/사회", "탐정소설",
    "인문", "철학", "고전", "로맨스", "사회풍자", "미술", "자기계발", "호러",
    "창작", "역사소설", "재테크", "디스토피아", "범죄소설", "행동과학", "인공지능"
  ];

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      try {
        setIsHomeBooksLoading(true);
        setHomeBooksError("");
        const result = await fetchBooksByCategory({
          category: "01",
          limit: 5,
        });
        if (isCancelled) return;
        const normalized = Array.isArray(result.results)
          ? result.results
              .filter((book) => book?.id && book?.title)
              .map((book) => ({
                id: `${book.id}`,
                title: book.title,
                cover: book.cover ?? null,
              }))
          : [];
        setHomeBooks(normalized);
      } catch (error) {
        if (isCancelled) return;
        setHomeBooks([]);
        setHomeBooksError(error.message || "추천 도서를 불러오지 못했습니다.");
      } finally {
        if (!isCancelled) {
          setIsHomeBooksLoading(false);
        }
      }
    };

    run();
    return () => {
      isCancelled = true;
    };
  }, []);

  const getHomeBookAt = (offset) => {
    const length = homeBooks.length;
    if (length === 0) return null;
    return homeBooks[(homeCenterIndex + offset + length) % length];
  };

  const openBookDetail = (bookId) => {
    const id = `${bookId ?? ""}`.trim();
    if (id) {
      setSelectedBookId(id);
      localStorage.setItem("selectedBookId", id);
    }
    setViewMode(9);
  };

  const openMyPostDetail = (postId) => {
    const id = `${postId ?? ""}`.trim();
    if (!id) return;
    setSelectedMyPostId(id);
    setViewMode(11);
  };

  const openOtherPostDetail = (postId) => {
    const id = `${postId ?? ""}`.trim();
    if (!id) return;
    setSelectedOtherPostId(id);
    setViewMode(5);
  };

  const moveHomeCarousel = (step) => {
    const length = homeBooks.length;
    if (length === 0) return;
    setHomeCenterIndex((prev) => (prev + step + length) % length);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'id') setIsIdChecked(false);
  };

  const handleIdCheck = async () => {
    const username = formData.id.trim();
    if (!username) {
      alert("아이디를 입력해주세요.");
      return;
    }

    try {
      setIsIdChecking(true);
      const result = await checkUsernameAvailability({ username });
      console.log("[ID_CHECK_RESULT]", { username, available: result.available, message: result.message, exists: result.exists });
      setIsIdChecked(Boolean(result.available));
      alert(result.message || (result.available ? "사용 가능한 아이디입니다" : "이미 사용 중인 아이디입니다"));
    } catch (error) {
      setIsIdChecked(false);
      alert(error.message || "아이디 중복확인에 실패했습니다.");
    } finally {
      setIsIdChecking(false);
    }
  };

  const isPwMismatch = formData.confirmPw.length > 0 && formData.pw !== formData.confirmPw;

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const getPreferredCategoryCode = () => {
    const genreToCategoryCode = {
      소설: "01",
      로맨스: "0114",
      탐정소설: "0114",
      역사소설: "0114",
      디스토피아: "0114",
      범죄소설: "0114",
      고전: "0111",
      창작: "0113",
      인문: "03",
      철학: "03",
      행동과학: "0301",
    };

    for (const genre of selectedGenres) {
      const matchedCode = genreToCategoryCode[genre];
      if (matchedCode) {
        return matchedCode;
      }
    }

    return "01";
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();

    if (!isIdChecked) return alert("중복확인을 해주세요.");
    if (isPwMismatch) return alert("비밀번호가 다릅니다.");

    const payload = {
      username: formData.id.trim(),
      password: formData.pw,
      password2: formData.confirmPw,
      name: formData.name.trim(),
      nickname: formData.nickname.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
    };

    const hasEmptyField = Object.values(payload).some((value) => !value);
    if (hasEmptyField) {
      alert("회원가입 항목을 모두 입력해주세요.");
      return;
    }

    const apiBase = (process.env.REACT_APP_API_BASE_URL ?? "").replace(/\/$/, "");
    const signUpUrl = `${apiBase}/api/accounts/signup/`;

    try {
      setIsSignUpSubmitting(true);
      const response = await plainFetch(signUpUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseError) {
        data = null;
      }

      if (!response.ok || data?.success === false) {
        const fieldErrors = data?.errors
          ? Object.values(data.errors).flat().join("\n")
          : "";
        const message =
          fieldErrors ||
          data?.message ||
          data?.detail ||
          "회원가입 요청에 실패했습니다.";
        throw new Error(message);
      }

      const accessToken = data?.tokens?.access;
      const refreshToken = data?.tokens?.refresh;
      if (accessToken && refreshToken) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
      }
      if (data?.user) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
      }

      alert(data?.message || "회원가입이 완료되었습니다.");
      setViewMode(2);
    } catch (error) {
      console.error("회원가입 실패:", error);
      alert(error.message || "회원가입에 실패했습니다.");
    } finally {
      setIsSignUpSubmitting(false);
    }
  };

  if (viewMode === 3) {
    return (
      <SignInProcess 
        onLoginSuccess={() => { 
          alert("로그인 성공"); 
          onAuthSuccess(); 
          setViewMode(0);
        }}
        onGoSignUp={() => setViewMode(1)}
        onGoHome={() => setViewMode(0)}
      />
    );
  }

  return (
    <div className="absolute-viewport">
      {/* 좌측 초록색 배경 섹션 */}
      <div className="side-bg-green"></div>
      
      <div className="fixed-content-wrapper">
        <div className="left-fixed-section">
          {/* 로고 영역 */}
          <div className="logo-box" onClick={() => setViewMode(0)} style={{cursor:'pointer'}}>
            <img src="/image-Photoroom.png" alt="독백 로고" className="logo-image" />
          </div>
          
          {/* 홈(0), 마이페이지(4), 다른독백들목록(7), 타인의독백상세(5), 나의독백(6) 등일 때 사이드바 메뉴 표시 */}
          {(viewMode === 0 || viewMode === 2 || viewMode === 4 || viewMode === 5 || viewMode === 6 || viewMode === 7 || viewMode === 8 || viewMode === 9 || viewMode === 10 || viewMode === 11 || viewMode === 12) && (
            <>
              <nav className="side-nav-menu">
                <p onClick={() => setViewMode(10)} style={{cursor:'pointer', fontWeight: (viewMode === 10 || viewMode === 6 || viewMode === 11 || viewMode === 12) ? 'bold' : 'normal'}}>나의 독백</p>
                {/* [수정] 다른 독백들 클릭 시 목록 화면인 7번으로 이동하도록 수정 */}
                <p onClick={() => setViewMode(7)} style={{cursor:'pointer', fontWeight: (viewMode === 7 || viewMode === 5) ? 'bold' : 'normal'}}>다른 독백들</p>
                {/* 기존 나의 책추천(7번) 메뉴는 기능상 중복되거나 다른 번호로 할당이 필요할 수 있으나, 요청대로 로직 유지를 위해 7번을 목록으로 활용 */}
                <p onClick={() => setViewMode(8)} style={{cursor:'pointer', fontWeight: viewMode === 8 ? 'bold' : 'normal'}}>나의 책추천</p>
                <p onClick={() => setViewMode(4)} style={{cursor:'pointer', fontWeight: viewMode === 4 ? 'bold' : 'normal'}}>마이페이지</p>
                <p onClick={() => setViewMode(2)} style={{cursor:'pointer', fontWeight: viewMode === 2 ? 'bold' : 'normal'}}>취향 더하기</p>
              </nav>
              <div className="side-auth-area">
                {isLoggedIn ? (
                  <button className="side-auth-link-text" onClick={onLogout}>로그아웃</button>
                ) : (
                  <>
                    <button className="side-auth-link-text" onClick={() => setViewMode(1)}>회원가입</button>
                    <span className="auth-divider">/</span>
                    <button className="side-auth-link-text" onClick={() => setViewMode(3)}>로그인</button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="right-fixed-section">
          {/* [0] 홈 화면 */}
          {viewMode === 0 && (
            <div className="home-screen-content">
              {isHomeBooksLoading ? (
                <p className="home-book-empty">추천 도서를 불러오는 중...</p>
              ) : homeBooksError ? (
                <p className="home-book-empty">{homeBooksError}</p>
              ) : homeBooks.length === 0 ? (
                <p className="home-book-empty">추천 도서가 없습니다.</p>
              ) : (
              <div className="home-book-slider">
                <div className="b-card side" onClick={() => openBookDetail(getHomeBookAt(-1)?.id)} style={{cursor:'pointer'}}>
                  {getHomeBookAt(-1)?.cover ? (
                    <img className="b-card-image" src={getHomeBookAt(-1).cover} alt={`${getHomeBookAt(-1).title} 표지`} />
                  ) : (
                    <div className="b-card-image b-card-image-empty" />
                  )}
                  <div className="b-card-title">{getHomeBookAt(-1)?.title}</div>
                </div>
                <div className="b-card center" onClick={() => openBookDetail(getHomeBookAt(0)?.id)} style={{cursor:'pointer'}}>
                  {getHomeBookAt(0)?.cover ? (
                    <img className="b-card-image" src={getHomeBookAt(0).cover} alt={`${getHomeBookAt(0).title} 표지`} />
                  ) : (
                    <div className="b-card-image b-card-image-empty" />
                  )}
                  <div className="b-card-title">{getHomeBookAt(0)?.title}</div>
                  <button
                    type="button"
                    className="home-slide-arrow left"
                    aria-label="이전 책"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveHomeCarousel(-1);
                    }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="home-slide-arrow right"
                    aria-label="다음 책"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveHomeCarousel(1);
                    }}
                  >
                    ›
                  </button>
                </div>
                <div className="b-card side" onClick={() => openBookDetail(getHomeBookAt(1)?.id)} style={{cursor:'pointer'}}>
                  {getHomeBookAt(1)?.cover ? (
                    <img className="b-card-image" src={getHomeBookAt(1).cover} alt={`${getHomeBookAt(1).title} 표지`} />
                  ) : (
                    <div className="b-card-image b-card-image-empty" />
                  )}
                  <div className="b-card-title">{getHomeBookAt(1)?.title}</div>
                </div>
              </div>
              )}
              <div className="home-bottom-reviews">
                <h3>다른 독백들</h3>
                <div className="review-grid-home">
                  {/* 홈 리뷰 박스는 목록 화면(7)으로 이동해 실제 postId를 선택하게 합니다. */}
                  <div className="r-box" onClick={() => setViewMode(7)} style={{cursor:'pointer'}}>
                    <h4>회색인간</h4>
                    <p>담담한 문장이지만 강렬한 메시지...</p>
                  </div>
                  <div className="r-box" onClick={() => setViewMode(7)} style={{cursor:'pointer'}}>
                    <h4>총,균,쇠</h4>
                    <p>인류 문명의 흐름을 꿰뚫는 통찰...</p>
                  </div>
                  <div className="r-box" onClick={() => setViewMode(7)} style={{cursor:'pointer'}}>
                    <h4>메타버스</h4>
                    <p>가상과 현실의 경계가 무너지는 세상...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* [9] 책 상세 화면 */}
          {viewMode === 9 && (
            <BookDetail 
              onBack={() => setViewMode(0)} 
              onOpenReview={() => setViewMode(5)} 
              bookId={selectedBookId}
            />
          )}

          {/* [4] 마이페이지 */}
          {viewMode === 4 && <MyPage onGoHome={() => setViewMode(0)} />}

          {/* [5] 타인의 독백 상세 (개별 글 보기) */}
          {viewMode === 5 && (
            <OthersDokbaek 
              postId={selectedOtherPostId}
              onGoMyDokbaek={() => setViewMode(6)} 
              onGoSignUp={() => setViewMode(7)} /* 다시 목록으로 */
              onOpenBook={() => openBookDetail()}
            />
          )}

          {/* [7] 다른 독백들 (전체 목록 화면 - OtherReviews) */}
          {viewMode === 7 && (
            <OtherReviews 
              onGoMyDokbaek={() => setViewMode(6)} 
              onGoSignUp={() => setViewMode(0)} 
              onOpenOthersDokbaek={openOtherPostDetail} /* 상세 글로 이동 */
              onOpenBookDetail={openBookDetail}
              onLogout={onLogout}
            />
          )}

          {/* [6] 나의 독백 작성 화면 */}
          {viewMode === 6 && (
            <MyDokbaek
              onFinish={(createdPost, meta = {}) => {
                if (meta?.deletedId) {
                  setLatestMyPost(null);
                } else {
                  setLatestMyPost(createdPost ?? null);
                }
                setViewMode(10);
              }}
              onOpenBookDetail={openBookDetail}
            />
          )}

          {/* [10] 나의 독백들 목록 */}
          {viewMode === 10 && (
            <MyDokbaekList
              optimisticPost={latestMyPost}
              onOpenPostDetail={openMyPostDetail}
              onWriteDokbaek={() => setViewMode(6)}
            />
          )}

          {/* [11] 나의 독서록 상세 */}
          {viewMode === 11 && (
            <MyPostDetail
              postId={selectedMyPostId}
              onBack={() => setViewMode(10)}
              onEditPost={(post) => {
                setEditingMyPost(post ?? null);
                setViewMode(12);
              }}
            />
          )}

          {/* [12] 나의 독서록 수정 */}
          {viewMode === 12 && (
            <MyDokbaek
              initialPost={editingMyPost}
              onCancelEdit={() => setViewMode(11)}
              onFinish={(updatedPost, meta = {}) => {
                if (meta?.deletedId) {
                  setEditingMyPost(null);
                  setSelectedMyPostId("");
                  setLatestMyPost(null);
                  setViewMode(10);
                  return;
                }

                setEditingMyPost(updatedPost ?? null);
                setLatestMyPost(updatedPost ?? null);
                setViewMode(11);
              }}
              onOpenBookDetail={openBookDetail}
            />
          )}

          {/* [8] BookRecommend (취향 더하기) */}
          {viewMode === 8 && (
            <BookRecommend 
              onGoMyDokbaek={() => setViewMode(6)} 
              onGoSignUp={() => setViewMode(0)} 
              onOpenBookDetail={openBookDetail}
              preferredCategoryCode={getPreferredCategoryCode()}
              selectedGenres={selectedGenres}
              isLoggedIn={isLoggedIn}
            />
          )}

          {/* [1] 회원가입 1단계 */}
          {viewMode === 1 && (
            <div className="auth-full-container">
              <h1 className="main-title-top">회원가입</h1>
              <div className="bottom-sticky-area">
                <form onSubmit={handleSignUpSubmit} noValidate>
                  <div className="input-row">
                    <div className="input-group half"><input type="text" name="name" placeholder="이름" onChange={handleChange} /></div>
                    <div className="input-group half"><input type="text" name="phone" placeholder="전화번호" onChange={handleChange} /></div>
                  </div>
                  <div className="input-group">
                    <input type="text" name="nickname" placeholder="닉네임" onChange={handleChange} />
                  </div>
                  <div className="input-group">
                    <input type="text" name="id" placeholder="아이디" onChange={handleChange} />
                    <button type="button" className={`check-btn ${isIdChecked ? 'ok' : ''}`} onClick={handleIdCheck} disabled={isIdChecking}>
                      {isIdChecking ? "확인중" : isIdChecked ? "확인됨" : "중복확인"}
                    </button>
                  </div>
                  <div className="input-group"><input type="password" name="pw" placeholder="비밀번호" onChange={handleChange} /></div>
                  <div className="input-group">
                    <input 
                      type="password" 
                      name="confirmPw" 
                      placeholder="비밀번호 확인" 
                      onChange={handleChange} 
                      className={isPwMismatch ? "error" : ""} 
                    />
                  </div>
                  <div className="input-group"><input type="text" name="email" placeholder="이메일" onChange={handleChange} /></div>
                  <div className="next-btn-area">
                    <button type="submit" className="next-btn" disabled={isSignUpSubmitting}>
                      {isSignUpSubmitting ? "가입 중..." : "다음"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* [2] 회원가입 2단계 */}
          {viewMode === 2 && (
            <GenreSelect
              allGenres={allGenres}
              selectedGenres={selectedGenres}
              onToggleGenre={toggleGenre}
              onNext={() => {
                onAuthSuccess();
                setViewMode(0);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUpProcess;
